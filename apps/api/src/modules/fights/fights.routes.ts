import type { FastifyInstance } from "fastify";
import { getPrisma } from "../../db/prisma.js";
import { getRedis } from "../../db/redis.js";
import { requireAuth } from "../../lib/auth-guard.js";
import { StartSoloCombatSchema, SubmitTurnSchema } from "./fights.schemas.js";
import { startSoloCombat, submitTurn, getFight } from "./fights.service.js";

export async function fightsRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrisma();
  const redis  = getRedis();

  // POST /fights/solo/start
  app.post("/fights/solo/start", { preHandler: requireAuth }, async (req, reply) => {
    const body = StartSoloCombatSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });

    try {
      const result = await startSoloCombat(
        prisma, redis,
        req.userId,
        body.data.challengerRoosterId,
        body.data.defenderUserId,
        body.data.defenderRoosterId,
      );
      return reply.code(201).send(result);
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });

  // POST /fights/solo/:combatId/turn
  app.post("/fights/solo/:combatId/turn", { preHandler: requireAuth }, async (req, reply) => {
    const { combatId } = req.params as { combatId: string };
    const body = SubmitTurnSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });

    try {
      const result = await submitTurn(prisma, redis, combatId, req.userId, body.data.move);
      return reply.send(result);
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });

  // GET /fights/:fightId
  app.get("/fights/:fightId", { preHandler: requireAuth }, async (req, reply) => {
    const { fightId } = req.params as { fightId: string };
    const fight = await getFight(prisma, fightId);
    if (!fight) return reply.code(404).send({ error: "Combate no encontrado" });
    return reply.send({ fight });
  });
}
