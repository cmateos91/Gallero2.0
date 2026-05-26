import type { FastifyInstance } from "fastify";
import { getPrisma } from "../../db/prisma.js";
import { getRedis } from "../../db/redis.js";
import { requireAuth } from "../../lib/auth-guard.js";
import {
  startTowerRun,
  getTowerRun,
  startFloorCombat,
  submitFloorTurn,
  advanceFloor,
  abandonRun,
} from "./tower.service.js";

export async function towerRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrisma();
  const redis  = getRedis();

  // POST /tower/runs/start
  app.post("/tower/runs/start", { preHandler: requireAuth }, async (req, reply) => {
    const body = (req.body ?? {}) as { roosterId?: string };
    if (!body.roosterId) return reply.code(400).send({ error: "roosterId requerido" });
    try {
      const run = await startTowerRun(prisma, redis, req.userId, body.roosterId);
      return reply.code(201).send({ run });
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });

  // GET /tower/runs/:runId
  app.get("/tower/runs/:runId", { preHandler: requireAuth }, async (req, reply) => {
    const { runId } = req.params as { runId: string };
    const run = await getTowerRun(redis, runId);
    if (!run || run.userId !== req.userId) return reply.code(404).send({ error: "Run no encontrado" });
    return reply.send({ run });
  });

  // POST /tower/runs/:runId/start-floor
  app.post("/tower/runs/:runId/start-floor", { preHandler: requireAuth }, async (req, reply) => {
    const { runId } = req.params as { runId: string };
    try {
      const result = await startFloorCombat(prisma, redis, req.userId, runId);
      return reply.code(201).send(result);
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });

  // POST /tower/runs/:runId/turn
  app.post("/tower/runs/:runId/turn", { preHandler: requireAuth }, async (req, reply) => {
    const { runId } = req.params as { runId: string };
    const body = (req.body ?? {}) as { combatId?: string; move?: string };
    if (!body.combatId || !body.move) return reply.code(400).send({ error: "combatId y move requeridos" });

    const validMoves = ["atacar", "defender", "esquivar", "huir", "usar_objeto"] as const;
    if (!validMoves.includes(body.move as typeof validMoves[number])) {
      return reply.code(400).send({ error: "move inválido" });
    }

    try {
      const result = await submitFloorTurn(
        redis, runId, body.combatId, req.userId,
        body.move as typeof validMoves[number],
      );
      return reply.send(result);
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });

  // POST /tower/runs/:runId/advance
  app.post("/tower/runs/:runId/advance", { preHandler: requireAuth }, async (req, reply) => {
    const { runId } = req.params as { runId: string };
    const body = (req.body ?? {}) as { playerHp?: number };
    try {
      const run = await advanceFloor(redis, req.userId, runId, body.playerHp ?? 1);
      return reply.send({ run });
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });

  // POST /tower/runs/:runId/abandon
  app.post("/tower/runs/:runId/abandon", { preHandler: requireAuth }, async (req, reply) => {
    const { runId } = req.params as { runId: string };
    try {
      const result = await abandonRun(prisma, redis, req.userId, runId);
      return reply.send(result);
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });
}
