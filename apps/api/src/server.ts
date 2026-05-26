import { fastify } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import compress from "@fastify/compress";
import cookie from "@fastify/cookie";
import websocket from "@fastify/websocket";

import { getPrisma } from "./db/prisma.js";
import { getRedis } from "./db/redis.js";
import { startScheduler } from "./jobs/scheduler.js";

import { authRoutes }       from "./modules/auth/auth.routes.js";
import { roostersRoutes }   from "./modules/roosters/roosters.routes.js";
import { inventoryRoutes }  from "./modules/inventory/inventory.routes.js";
import { shopRoutes }       from "./modules/shop/shop.routes.js";
import { fightsRoutes }     from "./modules/fights/fights.routes.js";
import { towerRoutes }      from "./modules/tower/tower.routes.js";
import { missionsRoutes }   from "./modules/missions/missions.routes.js";
import { rankingRoutes }    from "./modules/ranking/ranking.routes.js";
import { friendsRoutes }    from "./modules/friends/friends.routes.js";
import { cosmeticsRoutes }  from "./modules/cosmetics/cosmetics.routes.js";
import { profileRoutes }    from "./modules/profile/profile.routes.js";
import { opsRoutes }        from "./modules/ops/ops.routes.js";
import { pvpRoutes }        from "./modules/pvp/pvp.routes.js";

const PORT = Number(process.env.PORT) || 3000;

export async function buildServer() {
  const app = fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  await app.register(helmet);

  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",") ?? [
    "http://localhost:5173",
  ];
  await app.register(cors, { origin: allowedOrigins, credentials: true });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  await app.register(compress);
  await app.register(cookie);
  await app.register(websocket);

  // ─── Health checks (sin auth) ────────────────────────────────────────────
  app.get("/health", () => ({ status: "ok", uptime: process.uptime() }));
  app.get("/health/ready", async () => {
    void (await getPrisma().$queryRaw`SELECT 1`);
    void (await getRedis().ping());
    return { status: "ready" };
  });

  // ─── Módulos ──────────────────────────────────────────────────────────────
  await app.register(authRoutes);
  await app.register(roostersRoutes);
  await app.register(inventoryRoutes);
  await app.register(shopRoutes);
  await app.register(fightsRoutes);
  await app.register(towerRoutes);
  await app.register(missionsRoutes);
  await app.register(rankingRoutes);
  await app.register(friendsRoutes);
  await app.register(cosmeticsRoutes);
  await app.register(profileRoutes);
  await app.register(opsRoutes);
  await app.register(pvpRoutes);

  startScheduler(app);

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

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
