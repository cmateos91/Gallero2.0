import type { FastifyInstance } from "fastify";
import { getPrisma } from "../../db/prisma.js";
import { requireAuth } from "../../lib/auth-guard.js";
import { getCatalog, getMineWithEquipped, buyCosmeticItem, equipCosmetic, unequipCosmetic } from "./cosmetics.service.js";

export async function cosmeticsRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrisma();

  app.get("/cosmetics", { preHandler: requireAuth }, async (_req, reply) => {
    const catalog = await getCatalog(prisma);
    return reply.send({ catalog });
  });

  app.get("/cosmetics/mine", { preHandler: requireAuth }, async (req, reply) => {
    const data = await getMineWithEquipped(prisma, req.userId);
    return reply.send(data);
  });

  app.post("/cosmetics/:id/buy", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await buyCosmeticItem(prisma, req.userId, id);
      return reply.send({ ok: true });
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });

  app.post("/cosmetics/:id/equip", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as { roosterId?: string };
    if (!body.roosterId) return reply.code(400).send({ error: "roosterId requerido" });
    try {
      await equipCosmetic(prisma, req.userId, body.roosterId, id);
      return reply.send({ ok: true });
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });

  app.post("/cosmetics/:id/unequip", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as { roosterId?: string; slot?: string };
    if (!body.roosterId || !body.slot) return reply.code(400).send({ error: "roosterId y slot requeridos" });
    await unequipCosmetic(prisma, req.userId, body.roosterId, body.slot);
    return reply.send({ ok: true });
  });
}
