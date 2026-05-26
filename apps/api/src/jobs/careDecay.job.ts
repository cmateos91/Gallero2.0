import type { PrismaClient } from "@prisma/client";
import type { Redis } from "ioredis";

const CARE_DECAY_GUARD_KEY = "care:lastDecay";
const CARE_DECAY_INTERVAL_MS = 7_200_000; // 2 horas

export async function runCareDecay(prisma: PrismaClient, redis: Redis): Promise<number> {
  const now = Date.now();
  const lastRaw = await redis.get(CARE_DECAY_GUARD_KEY);
  const lastDecay = lastRaw ? Number(lastRaw) : 0;

  if (now - lastDecay < CARE_DECAY_INTERVAL_MS) return 0;

  const result = await prisma.$executeRaw`
    UPDATE "Rooster"
    SET "careCurrent" = GREATEST(0, "careCurrent" - 1)
    WHERE stage != 'HUEVO' AND "diedAt" IS NULL
  `;

  await redis.set(CARE_DECAY_GUARD_KEY, String(now));
  return result;
}
