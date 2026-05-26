import { fastify } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import compress from "@fastify/compress";
import cookie from "@fastify/cookie";
import websocket from "@fastify/websocket";

import { getPrisma } from "./db/prisma.js";
import { getRedis } from "./db/redis.js";

const PORT = Number(process.env.PORT) || 3000;

export async function buildServer() {
  const app = fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  // Security
  await app.register(helmet);

  // CORS
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",") ?? [
    "http://localhost:5173",
  ];
  await app.register(cors, { origin: allowedOrigins, credentials: true });

  // Rate limiting
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  // Compression
  await app.register(compress);

  // Cookies (for httpOnly refresh tokens)
  await app.register(cookie);

  // WebSocket (only /ws/pvp)
  await app.register(websocket);

  // Health check (no auth required)
  app.get("/health", () => ({ status: "ok", uptime: process.uptime() }));

  app.get("/health/ready", async () => {
    void (await getPrisma().$queryRaw`SELECT 1`);
    void (await getRedis().ping());
    return { status: "ready" };
  });

  return app;
}

async function main() {
  const app = await buildServer();
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`Server listening on port ${String(PORT)}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
