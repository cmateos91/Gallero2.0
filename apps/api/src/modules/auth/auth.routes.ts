import type { FastifyInstance } from "fastify";
import { getPrisma } from "../../db/prisma.js";
import { getRedis } from "../../db/redis.js";
import { requireAuth } from "../../lib/auth-guard.js";
import {
  RegisterSchema,
  LoginSchema,
  GoogleLoginSchema,
} from "./auth.schemas.js";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  createSession,
  revokeSession,
  isSessionBlacklisted,
  verifyGoogleToken,
  toAuthUserDto,
  rollFeather,
  collectFeather,
} from "./auth.service.js";

const REFRESH_COOKIE = "refresh_token";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/auth/refresh",
  maxAge: 30 * 24 * 3600,
};

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrisma();
  const redis  = getRedis();

  // POST /auth/register
  app.post("/auth/register", {
    config: { rateLimit: { max: 3, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const body = RegisterSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });
    const { email, username, password } = body.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) return reply.code(409).send({ error: "Email o username ya en uso" });

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, username, passwordHash } });

    const session = await createSession(prisma, user.id, "", req.headers["user-agent"], req.ip);
    const refreshToken = signRefreshToken(user.id, session.id);
    await prisma.session.update({ where: { id: session.id }, data: { refreshTokenHash: refreshToken } });

    reply.setCookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    return reply.code(201).send({ accessToken: signAccessToken(user.id), user: toAuthUserDto(user) });
  });

  // POST /auth/login
  app.post("/auth/login", {
    config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const body = LoginSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });
    const { emailOrUsername, password } = body.data;

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
    });
    if (!user?.passwordHash) return reply.code(401).send({ error: "Credenciales inválidas" });

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return reply.code(401).send({ error: "Credenciales inválidas" });

    const session = await createSession(prisma, user.id, "", req.headers["user-agent"], req.ip);
    const refreshToken = signRefreshToken(user.id, session.id);
    await prisma.session.update({ where: { id: session.id }, data: { refreshTokenHash: refreshToken } });

    reply.setCookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    return reply.send({ accessToken: signAccessToken(user.id), user: toAuthUserDto(user) });
  });

  // POST /auth/google
  app.post("/auth/google", async (req, reply) => {
    const body = GoogleLoginSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });

    let googlePayload: { email: string; name: string; sub: string };
    try {
      googlePayload = await verifyGoogleToken(body.data.idToken);
    } catch {
      return reply.code(401).send({ error: "Invalid Google token" });
    }

    let user = await prisma.user.findUnique({ where: { email: googlePayload.email } });
    if (!user) {
      const baseUsername = googlePayload.name.replace(/\s+/g, "").slice(0, 16);
      const username = `${baseUsername}${Math.floor(Math.random() * 9000 + 1000)}`;
      user = await prisma.user.create({
        data: { email: googlePayload.email, username, passwordHash: null },
      });
    }

    const session = await createSession(prisma, user.id, "", req.headers["user-agent"], req.ip);
    const refreshToken = signRefreshToken(user.id, session.id);
    await prisma.session.update({ where: { id: session.id }, data: { refreshTokenHash: refreshToken } });

    reply.setCookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    return reply.send({ accessToken: signAccessToken(user.id), user: toAuthUserDto(user) });
  });

  // POST /auth/refresh
  app.post("/auth/refresh", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) return reply.code(401).send({ error: "No refresh token" });

    let payload: { sub: string; sid: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return reply.code(401).send({ error: "Invalid refresh token" });
    }

    const blacklisted = await isSessionBlacklisted(redis, payload.sid);
    if (blacklisted) return reply.code(401).send({ error: "Session revoked" });

    const session = await prisma.session.findUnique({ where: { id: payload.sid } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return reply.code(401).send({ error: "Session expired or revoked" });
    }

    await revokeSession(prisma, redis, payload.sid);

    const newSession = await createSession(
      prisma, payload.sub, "", req.headers["user-agent"], req.ip,
    );
    const newRefreshToken = signRefreshToken(payload.sub, newSession.id);
    await prisma.session.update({
      where: { id: newSession.id },
      data: { refreshTokenHash: newRefreshToken },
    });

    reply.setCookie(REFRESH_COOKIE, newRefreshToken, COOKIE_OPTS);
    return reply.send({ accessToken: signAccessToken(payload.sub) });
  });

  // POST /auth/logout
  app.post("/auth/logout", async (req, reply) => {
    const token = req.cookies[REFRESH_COOKIE];
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        await revokeSession(prisma, redis, payload.sid);
      } catch {
        // token inválido → limpiar cookie de todas formas
      }
    }
    reply.clearCookie(REFRESH_COOKIE, { path: "/auth/refresh" });
    void (await reply.code(204).send());
    return;
  });

  // GET /auth/me
  app.get("/auth/me", { preHandler: requireAuth }, async (req, reply) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
    return reply.send(toAuthUserDto(user));
  });

  // GET /auth/feathers
  app.get("/auth/feathers", { preHandler: requireAuth }, async (req, reply) => {
    const feathers = await prisma.featherCollectible.findMany({
      where: { userId: req.userId, collectedAt: null },
    });
    return reply.send({ feathers });
  });

  // POST /auth/feathers/roll
  app.post("/auth/feathers/roll", { preHandler: requireAuth }, async (req, reply) => {
    const body = (req.body ?? {}) as { screen?: string };
    const screen = body.screen ?? "home";
    const redis = getRedis();
    const result = await rollFeather(prisma, redis, req.userId, screen, Date.now());
    return reply.send(result);
  });

  // POST /auth/collect-feather
  app.post("/auth/collect-feather", { preHandler: requireAuth }, async (req, reply) => {
    const body = (req.body ?? {}) as { featherId?: string };
    if (!body.featherId) return reply.code(400).send({ error: "featherId requerido" });
    try {
      const result = await collectFeather(prisma, req.userId, body.featherId);
      return reply.send(result);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 400).send({ error: e.message });
    }
  });

}
