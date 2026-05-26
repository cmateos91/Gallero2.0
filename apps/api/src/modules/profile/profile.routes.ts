import type { FastifyInstance } from "fastify";
import { getPrisma } from "../../db/prisma.js";
import { requireAuth } from "../../lib/auth-guard.js";

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrisma();

  // GET /profile/me
  app.get("/profile/me", { preHandler: requireAuth }, async (req, reply) => {
    const [user, roostersCount, fightsCount] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: req.userId } }),
      prisma.rooster.count({ where: { userId: req.userId, diedAt: null } }),
      prisma.fight.count({
        where: { OR: [{ challengerUserId: req.userId }, { defenderUserId: req.userId }] },
      }),
    ]);

    return reply.send({
      id:             user.id,
      username:       user.username,
      mmr:            user.mmr,
      coins:          user.coins,
      streakDays:     user.streakDays,
      towerHighFloor: user.towerHighFloor,
      roostersCount,
      fightsCount,
      createdAt:      user.createdAt,
    });
  });

  // POST /rewards/claim-weekly
  app.post("/rewards/claim-weekly", { preHandler: requireAuth }, async (req, reply) => {
    const { claimWeeklyReward } = await import("../rewards/rewards.service.js");
    try {
      const result = await claimWeeklyReward(prisma, req.userId);
      return reply.send(result);
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });
}
