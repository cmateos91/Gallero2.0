import type { FastifyInstance } from "fastify";
import { getPrisma } from "../db/prisma.js";
import { getRedis } from "../db/redis.js";
import { runCareDecay } from "./careDecay.job.js";

export function startScheduler(app: FastifyInstance): void {
  const prisma = getPrisma();
  const redis  = getRedis();

  const careDecayTimer = setInterval(() => {
    const start = Date.now();
    runCareDecay(prisma, redis)
      .then((affected) => {
        if (affected > 0) {
          app.log.info({ job: "careDecay", affected, durationMs: Date.now() - start }, "Care decay ejecutado");
        }
      })
      .catch((err: unknown) => {
        app.log.error({ job: "careDecay", err }, "Error en care decay");
      });
  }, 15 * 60_000);

  app.addHook("onClose", () => {
    clearInterval(careDecayTimer);
  });

  app.log.info("Scheduler iniciado (careDecay check cada 15 min, ejecución real cada 2h)");
}
