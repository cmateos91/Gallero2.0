import type { FastifyInstance } from "fastify";
import { getPrisma } from "../db/prisma.js";
import { runCareDecay } from "./careDecay.job.js";

const CARE_DECAY_INTERVAL_MS = 15 * 60_000;

export function startScheduler(app: FastifyInstance): void {
  const prisma = getPrisma();

  const careDecayTimer = setInterval(async () => {
    const start = Date.now();
    try {
      const affected = await runCareDecay(prisma);
      app.log.info({ job: "careDecay", affected, durationMs: Date.now() - start }, "Care decay ejecutado");
    } catch (err) {
      app.log.error({ job: "careDecay", err }, "Error en care decay");
    }
  }, CARE_DECAY_INTERVAL_MS);

  app.addHook("onClose", async () => {
    clearInterval(careDecayTimer);
  });

  app.log.info("Scheduler iniciado (careDecay cada 15 min)");
}
