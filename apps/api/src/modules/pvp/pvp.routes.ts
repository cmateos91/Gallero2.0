import type { FastifyInstance } from "fastify";
import { getPrisma } from "../../db/prisma.js";
import { getRedis } from "../../db/redis.js";
import { PvpManager } from "./pvp.manager.js";

export async function pvpRoutes(app: FastifyInstance): Promise<void> {
  const pvpManager = new PvpManager(getPrisma(), getRedis(), app);

  app.get("/ws/pvp", { websocket: true }, (socket) => {
    pvpManager.handleConnection(socket);
  });
}
