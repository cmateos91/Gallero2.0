import type { FastifyInstance } from "fastify";
import { getPrisma } from "../../db/prisma.js";
import { getRedis } from "../../db/redis.js";
import { requireAuth } from "../../lib/auth-guard.js";
import { REDIS_KEYS, TTL } from "../../constants.js";

export async function rankingRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrisma();
  const redis  = getRedis();

  // GET /ranking/leaderboard
  app.get("/ranking/leaderboard", { preHandler: requireAuth }, async (_req, reply) => {
    const cached = await redis.get(REDIS_KEYS.rankingCache);
    if (cached) return reply.send({ leaderboard: JSON.parse(cached) as unknown[] });

    const top = await prisma.user.findMany({
      orderBy: { mmr: "desc" },
      take: 50,
      select: { id: true, username: true, mmr: true, towerHighFloor: true, streakDays: true },
    });

    await redis.setex(REDIS_KEYS.rankingCache, TTL.RANKING_CACHE_S, JSON.stringify(top));
    return reply.send({ leaderboard: top });
  });
}
