import type { FastifyInstance } from "fastify";
import { getPrisma } from "../../db/prisma.js";
import { requireAuth } from "../../lib/auth-guard.js";
import {
  getFriends,
  searchPlayers,
  getPendingRequests,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
} from "./friends.service.js";

export async function friendsRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrisma();

  app.get("/friends", { preHandler: requireAuth }, async (req, reply) => {
    const friends = await getFriends(prisma, req.userId);
    return reply.send({ friends });
  });

  app.get("/friends/search", { preHandler: requireAuth }, async (req, reply) => {
    const { q } = req.query as { q?: string };
    if (!q || q.length < 2) return reply.code(400).send({ error: "q requerido (mín 2 chars)" });
    const players = await searchPlayers(prisma, q, req.userId);
    return reply.send({ players });
  });

  app.get("/friends/requests", { preHandler: requireAuth }, async (req, reply) => {
    const requests = await getPendingRequests(prisma, req.userId);
    return reply.send({ requests });
  });

  app.post("/friends", { preHandler: requireAuth }, async (req, reply) => {
    const body = (req.body ?? {}) as { receiverId?: string };
    if (!body.receiverId) return reply.code(400).send({ error: "receiverId requerido" });
    try {
      await sendFriendRequest(prisma, req.userId, body.receiverId);
      return reply.code(201).send({ ok: true });
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });

  app.post("/friends/requests/:id/accept", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await respondFriendRequest(prisma, req.userId, id, true);
      return reply.send({ ok: true });
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });

  app.post("/friends/requests/:id/reject", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await respondFriendRequest(prisma, req.userId, id, false);
      return reply.send({ ok: true });
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply.code(e.status ?? 500).send({ error: e.message });
    }
  });

  app.delete("/friends/:friendId", { preHandler: requireAuth }, async (req, reply) => {
    const { friendId } = req.params as { friendId: string };
    await removeFriend(prisma, req.userId, friendId);
    return reply.code(204).send();
  });
}
