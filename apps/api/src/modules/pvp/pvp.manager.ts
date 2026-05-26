import { randomUUID } from "crypto";
import type { WebSocket } from "@fastify/websocket";
import type { FastifyInstance } from "fastify";
import type { Redis } from "ioredis";
import type { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "../auth/auth.service.js";
import { startSoloCombat, submitTurn } from "../fights/fights.service.js";
import { saveChallenge, getChallenge, deleteChallenge, saveRoom, getRoom, deleteRoom } from "./pvp.redis.js";
import type { PvpMessage } from "./pvp.schemas.js";

type Connection = {
  ws:          WebSocket;
  userId:      string;
  username:    string;
  lastPingAt:  number;
  roomId?:     string;
};

const HEARTBEAT_INTERVAL_MS = 60_000;
const TURN_TIMEOUT_MS       = 30_000;

export class PvpManager {
  private connections = new Map<string, Connection>();
  private turnTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly redis: Redis,
    private readonly app: FastifyInstance,
  ) {
    setInterval(() => this.runHeartbeatCheck(), HEARTBEAT_INTERVAL_MS);
  }

  // ─── Connection lifecycle ──────────────────────────────────────────────────

  handleConnection(ws: WebSocket): void {
    let conn: Connection | null = null;
    const authTimeout = setTimeout(() => {
      if (!conn) ws.close(4001, "Auth timeout");
    }, 10_000);

    ws.on("message", async (raw: Buffer | string) => {
      let msg: PvpMessage;
      try { msg = JSON.parse(String(raw)) as PvpMessage; }
      catch { ws.close(4002, "Invalid JSON"); return; }

      if (!conn) {
        if (msg.type !== "auth") { ws.close(4001, "First message must be auth"); return; }
        try {
          const { sub } = verifyAccessToken(msg.payload.token);
          const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: sub }, select: { id: true, username: true },
          });
          clearTimeout(authTimeout);
          conn = { ws, userId: user.id, username: user.username, lastPingAt: Date.now() };
          this.connections.set(user.id, conn);
          this.send(conn, { type: "connected", payload: { userId: user.id, username: user.username } });
        } catch {
          ws.close(4003, "Invalid token");
        }
        return;
      }

      conn.lastPingAt = Date.now();
      await this.handleMessage(conn, msg);
    });

    ws.on("close", () => {
      if (conn) {
        this.connections.delete(conn.userId);
        if (conn.roomId) void this.cancelRoom(conn.roomId, conn.userId);
      }
      clearTimeout(authTimeout);
    });
  }

  private async handleMessage(conn: Connection, msg: PvpMessage): Promise<void> {
    switch (msg.type) {
      case "ping":
        this.send(conn, { type: "pong", payload: { serverTime: Date.now() } });
        break;

      case "challenge:send":
        await this.sendChallenge(conn, msg.payload.targetUsername, msg.payload.roosterId);
        break;

      case "challenge:accept":
        await this.acceptChallenge(conn, msg.payload.inviteId);
        break;

      case "challenge:decline":
        await this.declineChallenge(conn, msg.payload.inviteId);
        break;

      case "turn:move":
        await this.handleTurnMove(conn, msg.payload.roomId, msg.payload.move);
        break;
    }
  }

  // ─── Challenge flow ────────────────────────────────────────────────────────

  private async sendChallenge(conn: Connection, targetUsername: string, roosterId: string): Promise<void> {
    const target = await this.prisma.user.findUnique({
      where: { username: targetUsername }, select: { id: true, username: true },
    });
    if (!target) { this.send(conn, { type: "fight:error", payload: { message: "Usuario no encontrado" } }); return; }

    const targetConn = this.connections.get(target.id);
    if (!targetConn) { this.send(conn, { type: "fight:error", payload: { message: "Usuario no conectado" } }); return; }

    const rooster = await this.prisma.rooster.findFirst({
      where: { id: roosterId, userId: conn.userId, stage: "ADULTO", diedAt: null },
    });
    if (!rooster) { this.send(conn, { type: "fight:error", payload: { message: "Gallo no disponible" } }); return; }

    const inviteId = randomUUID();
    await saveChallenge(this.redis, {
      inviteId, challengerUserId: conn.userId, challengerUsername: conn.username,
      roosterId, roosterName: rooster.name, targetUserId: target.id, createdAt: Date.now(),
    });

    this.send(conn, { type: "challenge:sent" });
    this.send(targetConn, {
      type: "challenge:received",
      payload: { challengerUsername: conn.username, roosterName: rooster.name, inviteId },
    });

    setTimeout(async () => {
      const still = await getChallenge(this.redis, inviteId);
      if (still) {
        await deleteChallenge(this.redis, inviteId);
        this.send(conn, { type: "challenge:expired" });
      }
    }, 60_000);
  }

  private async acceptChallenge(conn: Connection, inviteId: string): Promise<void> {
    const challenge = await getChallenge(this.redis, inviteId);
    if (!challenge || challenge.targetUserId !== conn.userId) {
      this.send(conn, { type: "fight:error", payload: { message: "Invitación no encontrada" } }); return;
    }
    await deleteChallenge(this.redis, inviteId);

    const challengerConn = this.connections.get(challenge.challengerUserId);

    const defenderRooster = await this.prisma.rooster.findFirst({
      where: { userId: conn.userId, stage: "ADULTO", diedAt: null },
    });
    if (!defenderRooster) {
      this.send(conn, { type: "fight:error", payload: { message: "No tienes gallo adulto disponible" } }); return;
    }

    try {
      const { fightId, combatId, initialState } = await startSoloCombat(
        this.prisma, this.redis,
        challenge.challengerUserId, challenge.roosterId,
        conn.userId, defenderRooster.id,
      );

      const roomId = randomUUID();
      await saveRoom(this.redis, {
        roomId, challengerUserId: challenge.challengerUserId, defenderUserId: conn.userId,
        challengerRoosterId: challenge.roosterId, defenderRoosterId: defenderRooster.id,
        fightId, combatId, createdAt: Date.now(),
      });

      conn.roomId = roomId;
      if (challengerConn) challengerConn.roomId = roomId;

      this.send(conn, { type: "fight:start", payload: { roomId, role: "defender", initialState } });
      if (challengerConn) this.send(challengerConn, { type: "fight:start", payload: { roomId, role: "challenger", initialState } });
    } catch (err) {
      const e = err as { message?: string };
      this.send(conn, { type: "fight:error", payload: { message: e.message ?? "Error al iniciar combate" } });
    }
  }

  private async declineChallenge(conn: Connection, inviteId: string): Promise<void> {
    const challenge = await getChallenge(this.redis, inviteId);
    if (!challenge) return;
    await deleteChallenge(this.redis, inviteId);
    const challengerConn = this.connections.get(challenge.challengerUserId);
    if (challengerConn) this.send(challengerConn, { type: "challenge:declined" });
  }

  // ─── Turn handling ─────────────────────────────────────────────────────────

  private async handleTurnMove(conn: Connection, roomId: string, move: string): Promise<void> {
    const room = await getRoom(this.redis, roomId);
    if (!room) { this.send(conn, { type: "fight:error", payload: { message: "Sala no encontrada" } }); return; }

    clearTimeout(this.turnTimeouts.get(`${roomId}:${conn.userId}`));
    this.scheduleTurnTimeout(roomId, conn.userId, room.combatId);

    const validMoves = ["atacar", "defender", "esquivar", "huir", "usar_objeto"] as const;
    if (!validMoves.includes(move as typeof validMoves[number])) return;

    try {
      const result = await submitTurn(
        this.prisma, this.redis, room.combatId, conn.userId,
        move as typeof validMoves[number],
      );

      const challConn = this.connections.get(room.challengerUserId);
      const defConn   = this.connections.get(room.defenderUserId);

      if (result.waiting) return;

      if (challConn) this.send(challConn, { type: "turn:result", payload: result });
      if (defConn)   this.send(defConn,   { type: "turn:result", payload: result });

      if (result.over) {
        const winnerUserId = result.state.winner === 0 ? room.challengerUserId : room.defenderUserId;
        const [userC, userD] = await Promise.all([
          this.prisma.user.findUniqueOrThrow({ where: { id: room.challengerUserId }, select: { mmr: true, coins: true } }),
          this.prisma.user.findUniqueOrThrow({ where: { id: room.defenderUserId }, select: { mmr: true, coins: true } }),
        ]);
        if (challConn) this.send(challConn, { type: "fight:over", payload: { winner: winnerUserId, mmrDelta: 0, coins: userC.coins } });
        if (defConn)   this.send(defConn,   { type: "fight:over", payload: { winner: winnerUserId, mmrDelta: 0, coins: userD.coins } });
        await deleteRoom(this.redis, roomId);
      }
    } catch (err) {
      const e = err as { message?: string };
      this.send(conn, { type: "fight:error", payload: { message: e.message ?? "Error en turno" } });
    }
  }

  private scheduleTurnTimeout(roomId: string, userId: string, combatId: string): void {
    const key = `${roomId}:${userId}`;
    const t = setTimeout(async () => {
      this.app.log.warn({ roomId, userId }, "Timeout de turno PvP → auto huir");
      try {
        await submitTurn(this.prisma, this.redis, combatId, userId, "huir");
      } catch { /* fight may have ended */ }
    }, TURN_TIMEOUT_MS);
    this.turnTimeouts.set(key, t);
  }

  private async cancelRoom(roomId: string, disconnectedUserId: string): Promise<void> {
    const room = await getRoom(this.redis, roomId);
    if (!room) return;
    await deleteRoom(this.redis, roomId);
    const otherId = room.challengerUserId === disconnectedUserId ? room.defenderUserId : room.challengerUserId;
    const otherConn = this.connections.get(otherId);
    if (otherConn) this.send(otherConn, { type: "fight:cancelled" });
  }

  // ─── Heartbeat ────────────────────────────────────────────────────────────

  private runHeartbeatCheck(): void {
    const now = Date.now();
    for (const [userId, conn] of this.connections) {
      if (now - conn.lastPingAt > HEARTBEAT_INTERVAL_MS) {
        conn.ws.close(4004, "Heartbeat timeout");
        this.connections.delete(userId);
      }
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private send(conn: Connection, msg: PvpMessage): void {
    if (conn.ws.readyState === conn.ws.OPEN) {
      conn.ws.send(JSON.stringify(msg));
    }
  }
}
