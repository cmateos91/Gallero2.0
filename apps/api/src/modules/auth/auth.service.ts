import crypto, { type BinaryLike } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import type { PrismaClient, Session } from "@prisma/client";
import type { Redis } from "ioredis";
import { REDIS_KEYS, TTL } from "../../constants.js";
import type { AuthUserDto } from "./auth.schemas.js";

const scryptAsync = promisify<BinaryLike, BinaryLike, number, Buffer>(crypto.scrypt);
const SCRYPT_KEYLEN = 64;

// ─── Password ────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, SCRYPT_KEYLEN);
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const hashBuf = await scryptAsync(password, salt, SCRYPT_KEYLEN);
  const storedBuf = Buffer.from(hashHex, "hex");
  return crypto.timingSafeEqual(hashBuf, storedBuf);
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

function accessSecret(): string {
  const s = process.env.JWT_ACCESS_SECRET;
  if (!s) throw new Error("JWT_ACCESS_SECRET not set");
  return s;
}

function refreshSecret(): string {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s) throw new Error("JWT_REFRESH_SECRET not set");
  return s;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "access" }, accessSecret(), { expiresIn: "15m" });
}

export function signRefreshToken(userId: string, sessionId: string): string {
  return jwt.sign({ sub: userId, sid: sessionId, type: "refresh" }, refreshSecret(), {
    expiresIn: "30d",
  });
}

export function verifyAccessToken(token: string): { sub: string } {
  const payload = jwt.verify(token, accessSecret()) as { sub: string; type: string };
  if (payload.type !== "access") throw new Error("Wrong token type");
  return { sub: payload.sub };
}

export function verifyRefreshToken(token: string): { sub: string; sid: string } {
  const payload = jwt.verify(token, refreshSecret()) as { sub: string; sid: string; type: string };
  if (payload.type !== "refresh") throw new Error("Wrong token type");
  return { sub: payload.sub, sid: payload.sid };
}

// ─── Session ──────────────────────────────────────────────────────────────────

export async function createSession(
  prisma: PrismaClient,
  userId: string,
  refreshTokenHash: string,
  userAgent?: string,
  ip?: string,
): Promise<Session> {
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  return prisma.session.create({
    data: { userId, refreshTokenHash, userAgent, ipAddress: ip, expiresAt },
  });
}

export async function revokeSession(
  prisma: PrismaClient,
  redis: Redis,
  sessionId: string,
): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await redis.setex(REDIS_KEYS.sessionBlacklist(sessionId), TTL.SESSION_BLACKLIST_S, "1");
}

export async function isSessionBlacklisted(redis: Redis, sessionId: string): Promise<boolean> {
  const val = await redis.get(REDIS_KEYS.sessionBlacklist(sessionId));
  return val !== null;
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

const googleClient = new OAuth2Client();

export async function verifyGoogleToken(
  idToken: string,
): Promise<{ email: string; name: string; sub: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const ticket = await googleClient.verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) throw new Error("Invalid Google token payload");
  return { email: payload.email, name: payload.name ?? payload.email, sub: payload.sub };
}

// ─── DTO helper ──────────────────────────────────────────────────────────────

export function toAuthUserDto(user: {
  id: string;
  email: string;
  username: string;
  mmr: number;
  coins: number;
  streakDays: number;
  towerHighFloor: number;
  createdAt: Date;
}): AuthUserDto {
  return {
    id:             user.id,
    email:          user.email,
    username:       user.username,
    mmr:            user.mmr,
    coins:          user.coins,
    streakDays:     user.streakDays,
    towerHighFloor: user.towerHighFloor,
    createdAt:      user.createdAt,
  };
}

// ─── Feathers ─────────────────────────────────────────────────────────────────

const FEATHER_COOLDOWN_MS = 90_000;
const FEATHER_MAX_PER_DAY = 40;

export async function rollFeather(
  prisma: PrismaClient,
  userId: string,
  screen: string,
  nowMs: number,
): Promise<{ spawned: boolean; xPct?: number; yPct?: number; id?: string }> {
  const today = new Date(nowMs).toISOString().slice(0, 10);

  const todayCount = await prisma.featherCollectible.count({
    where: { userId, screen, collectedAt: { not: null } },
  });
  if (todayCount >= FEATHER_MAX_PER_DAY) return { spawned: false };

  const lastPending = await prisma.featherCollectible.findFirst({
    where: { userId, screen, collectedAt: null },
    orderBy: { collectedAt: "desc" },
  });
  if (lastPending) return { spawned: false };

  const xPct = Math.random() * 80 + 10;
  const yPct = Math.random() * 70 + 15;
  const scale = 0.8 + Math.random() * 0.4;
  const rotationDeg = Math.random() * 360;

  const feather = await prisma.featherCollectible.create({
    data: { userId, xPct, yPct, scale, rotationDeg, screen },
  });

  void today;
  void FEATHER_COOLDOWN_MS;
  return { spawned: true, xPct, yPct, id: feather.id };
}

export async function collectFeather(
  prisma: PrismaClient,
  userId: string,
  featherId: string,
): Promise<{ coins: number }> {
  const feather = await prisma.featherCollectible.findFirst({
    where: { id: featherId, userId, collectedAt: null },
  });
  if (!feather) throw Object.assign(new Error("Feather not found or already collected"), { status: 404 });

  await prisma.$transaction([
    prisma.featherCollectible.update({
      where: { id: featherId },
      data: { collectedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: 1 } },
    }),
  ]);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { coins: true } });
  return { coins: user.coins };
}
