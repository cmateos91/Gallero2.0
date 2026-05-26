import type { FastifyInstance } from "fastify";
import { DAILY_MISSIONS } from "@gallos/game-engine";
import { getPrisma } from "../../db/prisma.js";
import { requireAuth } from "../../lib/auth-guard.js";
import { getDailyProgress, claimMission } from "./missions.service.js";

export async function missionsRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrisma();

  // GET /missions/daily
  app.get("/missions/daily", { preHandler: requireAuth }, async (req, reply) => {
    const progress = await getDailyProgress(prisma, req.userId);
    return reply.send({ missions: DAILY_MISSIONS, progress });
  });

  // POST /missions/daily/claim/:key
  app.post("/missions/daily/claim/:key", { preHandler: requireAuth }, async (req, reply) => {
    const { key } = req.params as { key: string };
    try {
      const result = await claimMission(prisma, req.userId, key);
      return reply.send(result);
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });
}
