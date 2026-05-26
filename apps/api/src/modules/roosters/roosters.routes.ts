import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { getPrisma } from "../../db/prisma.js";
import { requireAuth } from "../../lib/auth-guard.js";
import {
  listRoostersWithSync,
  trainRooster,
  careRooster,
  feedRooster,
  drinkRooster,
  fuseRoosters,
  sellRooster,
  toRoosterDto,
} from "./roosters.lifecycle.js";
import { buyEgg, claimFreeEgg } from "./roosters.eggs.js";
import { EggTierSchema } from "./roosters.schemas.js";

function handleErr(err: unknown, reply: FastifyReply) {
  const e = err as { status?: number; message?: string };
  return reply.code(e.status ?? 500).send({ error: e.message ?? "Error interno" });
}

export async function roostersRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrisma();

  // GET /roosters
  app.get("/roosters", { preHandler: requireAuth }, async (req, reply) => {
    const roosters = await listRoostersWithSync(prisma, req.userId, Date.now());
    return reply.send({ roosters });
  });

  // POST /roosters/bootstrap
  app.post("/roosters/bootstrap", { preHandler: requireAuth }, async (req, reply) => {
    const count = await prisma.rooster.count({ where: { userId: req.userId } });
    if (count > 0) return reply.code(400).send({ error: "Ya tienes gallos" });
    const { createEgg } = await import("./roosters.eggs.js");
    const egg = await createEgg(prisma, req.userId, "Común", Date.now());
    return reply.code(201).send({ rooster: toRoosterDto(egg, Date.now()) });
  });

  // POST /roosters/bootstrap-and-hatch
  app.post("/roosters/bootstrap-and-hatch", { preHandler: requireAuth }, async (req, reply) => {
    const count = await prisma.rooster.count({ where: { userId: req.userId } });
    if (count > 0) return reply.code(400).send({ error: "Ya tienes gallos" });
    const { createEgg } = await import("./roosters.eggs.js");
    const { syncRoosterLifecycle } = await import("./roosters.lifecycle.js");
    const egg = await createEgg(prisma, req.userId, "Común", Date.now() - 60 * 60_000);
    const hatched = await syncRoosterLifecycle(prisma, egg, Date.now());
    return reply.code(201).send({ rooster: toRoosterDto(hatched, Date.now()) });
  });

  // POST /roosters/fuse
  app.post("/roosters/fuse", { preHandler: requireAuth }, async (req, reply) => {
    const body = (req.body ?? {}) as { roosterId1?: string; roosterId2?: string };
    if (!body.roosterId1 || !body.roosterId2) {
      return reply.code(400).send({ error: "roosterId1 y roosterId2 requeridos" });
    }
    try {
      const egg = await fuseRoosters(
        prisma, req.userId, body.roosterId1, body.roosterId2, Date.now(),
      );
      return reply.code(201).send({ rooster: toRoosterDto(egg, Date.now()) });
    } catch (err) { return handleErr(err, reply); }
  });

  // GET /roosters/egg-shop
  app.get("/roosters/egg-shop", { preHandler: requireAuth }, async (_req, reply) => {
    return reply.send({
      tiers: [
        { tier: "MISTERIOSO", price: 80,  description: "50% Común, 35% Normal, 13% Raro, 2% Legendario" },
        { tier: "SELECTO",    price: 200, description: "10% Común, 40% Normal, 35% Raro, 15% Legendario" },
        { tier: "DORADO",     price: 500, description: "0% Común, 15% Normal, 50% Raro, 35% Legendario" },
      ],
    });
  });

  // POST /roosters/buy-egg
  app.post("/roosters/buy-egg", { preHandler: requireAuth }, async (req, reply) => {
    const body = (req.body ?? {}) as { tier?: string };
    const parsed = EggTierSchema.safeParse(body.tier);
    if (!parsed.success) return reply.code(400).send({ error: "tier inválido" });
    try {
      const egg = await buyEgg(prisma, req.userId, parsed.data, Date.now());
      return reply.code(201).send({ rooster: toRoosterDto(egg, Date.now()) });
    } catch (err) { return handleErr(err, reply); }
  });

  // POST /roosters/claim-free-egg
  app.post("/roosters/claim-free-egg", { preHandler: requireAuth }, async (req, reply) => {
    try {
      const egg = await claimFreeEgg(prisma, req.userId, Date.now());
      return reply.code(201).send({ rooster: toRoosterDto(egg, Date.now()) });
    } catch (err) { return handleErr(err, reply); }
  });

  // PATCH /roosters/:id/rename
  app.patch("/roosters/:id/rename", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as { name?: string };
    const name = z.string().min(1).max(30).safeParse(body.name);
    if (!name.success) return reply.code(400).send({ error: "Nombre inválido" });
    const r = await prisma.rooster.findFirst({ where: { id, userId: req.userId } });
    if (!r) return reply.code(404).send({ error: "No encontrado" });
    const updated = await prisma.rooster.update({ where: { id }, data: { name: name.data } });
    return reply.send({ rooster: toRoosterDto(updated, Date.now()) });
  });

  // PATCH /roosters/:id/position
  app.patch("/roosters/:id/position", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as { positionX?: number; positionY?: number; homeScreen?: string };
    const r = await prisma.rooster.findFirst({ where: { id, userId: req.userId } });
    if (!r) return reply.code(404).send({ error: "No encontrado" });
    const updated = await prisma.rooster.update({
      where: { id },
      data: { positionX: body.positionX, positionY: body.positionY, homeScreen: body.homeScreen },
    });
    return reply.send({ rooster: toRoosterDto(updated, Date.now()) });
  });

  // PATCH /roosters/:id/colors
  app.patch("/roosters/:id/colors", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await prisma.rooster.findFirst({ where: { id, userId: req.userId } });
    if (!r) return reply.code(404).send({ error: "No encontrado" });
    const updated = await prisma.rooster.update({ where: { id }, data: { customColors: req.body as object } });
    return reply.send({ rooster: toRoosterDto(updated, Date.now()) });
  });

  // PATCH /roosters/:id/paint-layers
  app.patch("/roosters/:id/paint-layers", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await prisma.rooster.findFirst({ where: { id, userId: req.userId } });
    if (!r) return reply.code(404).send({ error: "No encontrado" });
    const updated = await prisma.rooster.update({ where: { id }, data: { paintLayers: req.body as object } });
    return reply.send({ rooster: toRoosterDto(updated, Date.now()) });
  });

  // POST /roosters/:id/care
  app.post("/roosters/:id/care", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const updated = await careRooster(prisma, req.userId, id);
      return reply.send({ rooster: toRoosterDto(updated, Date.now()) });
    } catch (err) { return handleErr(err, reply); }
  });

  // POST /roosters/:id/train
  app.post("/roosters/:id/train", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const updated = await trainRooster(prisma, req.userId, id, Date.now());
      return reply.send({ rooster: toRoosterDto(updated, Date.now()) });
    } catch (err) { return handleErr(err, reply); }
  });

  // POST /roosters/:id/feed
  app.post("/roosters/:id/feed", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const updated = await feedRooster(prisma, req.userId, id);
      return reply.send({ rooster: toRoosterDto(updated, Date.now()) });
    } catch (err) { return handleErr(err, reply); }
  });

  // POST /roosters/:id/drink
  app.post("/roosters/:id/drink", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const updated = await drinkRooster(prisma, req.userId, id);
      return reply.send({ rooster: toRoosterDto(updated, Date.now()) });
    } catch (err) { return handleErr(err, reply); }
  });

  // POST /roosters/:id/matadero
  app.post("/roosters/:id/matadero", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const result = await sellRooster(prisma, req.userId, id);
      return reply.send(result);
    } catch (err) { return handleErr(err, reply); }
  });

  // POST /roosters/:id/remove-dead
  app.post("/roosters/:id/remove-dead", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await prisma.rooster.findFirst({ where: { id, userId: req.userId, diedAt: { not: null } } });
    if (!r) return reply.code(404).send({ error: "Gallo muerto no encontrado" });
    await prisma.rooster.delete({ where: { id } });
    return reply.code(204).send();
  });

  // GET /roosters/:id/combat-items
  app.get("/roosters/:id/combat-items", { preHandler: requireAuth }, async (req, reply) => {
    const items = await prisma.userCombatItem.findMany({
      where: { userId: req.userId, quantity: { gt: 0 } },
      include: { item: true },
    });
    return reply.send({ items });
  });
}
