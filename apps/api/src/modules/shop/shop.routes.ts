import type { FastifyInstance } from "fastify";
import { getPrisma } from "../../db/prisma.js";
import { requireAuth } from "../../lib/auth-guard.js";
import { getCombatItemsCatalog, buyCombatItem } from "./shop.service.js";

export async function shopRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrisma();

  // GET /shop/combat-items
  app.get("/shop/combat-items", { preHandler: requireAuth }, async (req, reply) => {
    const items = await getCombatItemsCatalog(prisma, req.userId);
    return reply.send({ items });
  });

  // POST /shop/combat-items/:id/buy
  app.post("/shop/combat-items/:id/buy", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as { quantity?: number };
    const qty = Math.max(1, Math.floor(body.quantity ?? 1));
    try {
      await buyCombatItem(prisma, req.userId, id, qty);
      return reply.send({ bought: qty });
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });
}
