import type { FastifyInstance } from "fastify";
import { getPrisma } from "../../db/prisma.js";
import { requireAuth } from "../../lib/auth-guard.js";
import { getInventory, addItem, refillInventory } from "./inventory.service.js";

export async function inventoryRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrisma();

  // GET /inventory
  app.get("/inventory", { preHandler: requireAuth }, async (req, reply) => {
    const items = await getInventory(prisma, req.userId);
    return reply.send({ items });
  });

  // POST /inventory/refill
  app.post("/inventory/refill", { preHandler: requireAuth }, async (req, reply) => {
    try {
      await refillInventory(prisma, req.userId);
      const items = await getInventory(prisma, req.userId);
      return reply.send({ items });
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });

  // POST /inventory/buy — comprar comida/agua con monedas
  app.post("/inventory/buy", { preHandler: requireAuth }, async (req, reply) => {
    const body = (req.body ?? {}) as { itemKey?: string; quantity?: number };
    const key = body.itemKey;
    const qty = Math.max(1, Math.floor(body.quantity ?? 1));

    const PRICES: Record<string, { type: "FOOD" | "WATER"; coins: number }> = {
      comida_basica:  { type: "FOOD",  coins: 12 },
      comida_premium: { type: "FOOD",  coins: 30 },
      agua:           { type: "WATER", coins: 8  },
    };

    if (!key || !PRICES[key]) return reply.code(400).send({ error: "Item inválido" });
    const { type, coins } = PRICES[key];
    const totalCost = coins * qty;

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.userId },
      select: { coins: true },
    });
    if (user.coins < totalCost) return reply.code(400).send({ error: "Monedas insuficientes" });

    await prisma.$transaction([
      prisma.user.update({ where: { id: req.userId }, data: { coins: { decrement: totalCost } } }),
    ]);
    await addItem(prisma, req.userId, type, key, qty);

    return reply.send({ bought: qty, itemKey: key });
  });
}
