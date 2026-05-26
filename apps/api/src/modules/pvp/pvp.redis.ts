import type { Redis } from "ioredis";
import { REDIS_KEYS, TTL } from "../../constants.js";
import type { PvpChallenge, PvpRoom } from "./pvp.schemas.js";

export async function saveChallenge(redis: Redis, challenge: PvpChallenge): Promise<void> {
  await redis.setex(
    REDIS_KEYS.pvpChallenge(challenge.inviteId),
    TTL.PVP_CHALLENGE_S,
    JSON.stringify(challenge),
  );
}

export async function getChallenge(redis: Redis, inviteId: string): Promise<PvpChallenge | null> {
  const raw = await redis.get(REDIS_KEYS.pvpChallenge(inviteId));
  return raw ? (JSON.parse(raw) as PvpChallenge) : null;
}

export async function deleteChallenge(redis: Redis, inviteId: string): Promise<void> {
  await redis.del(REDIS_KEYS.pvpChallenge(inviteId));
}

export async function saveRoom(redis: Redis, room: PvpRoom): Promise<void> {
  await redis.setex(REDIS_KEYS.pvpRoom(room.roomId), TTL.PVP_ROOM_S, JSON.stringify(room));
}

export async function getRoom(redis: Redis, roomId: string): Promise<PvpRoom | null> {
  const raw = await redis.get(REDIS_KEYS.pvpRoom(roomId));
  return raw ? (JSON.parse(raw) as PvpRoom) : null;
}

export async function deleteRoom(redis: Redis, roomId: string): Promise<void> {
  await redis.del(REDIS_KEYS.pvpRoom(roomId));
}

// ─── Connection tracking ─────────────────────────────────────────────────────

const WS_USER_TTL_S = 120; // 2 min — heartbeat failure auto-expira

export async function registerConnection(redis: Redis, userId: string): Promise<void> {
  await redis.setex(REDIS_KEYS.wsUser(userId), WS_USER_TTL_S, String(Date.now()));
}

export async function refreshConnection(redis: Redis, userId: string): Promise<void> {
  await redis.setex(REDIS_KEYS.wsUser(userId), WS_USER_TTL_S, String(Date.now()));
}

export async function unregisterConnection(redis: Redis, userId: string): Promise<void> {
  await redis.del(REDIS_KEYS.wsUser(userId));
}

export async function isUserConnected(redis: Redis, userId: string): Promise<boolean> {
  const exists = await redis.exists(REDIS_KEYS.wsUser(userId));
  return exists === 1;
}
