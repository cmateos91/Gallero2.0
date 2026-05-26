import type { FastifyInstance } from "fastify";

export async function opsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health/heartbeat", () => ({ status: "alive", timestamp: Date.now() }));
}
