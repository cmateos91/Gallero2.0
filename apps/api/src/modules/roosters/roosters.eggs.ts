import type { PrismaClient, Rooster } from "@prisma/client";
import type { EggTier, RoosterQuality } from "./roosters.schemas.js";
import {
  QUALITY_WEIGHTS,
  HATCH_TIME_MS,
  STAT_RANGES,
  EGG_PRICES,
  MAX_ROOSTERS,
} from "./roosters.schemas.js";

function rollQuality(tier: EggTier): RoosterQuality {
  const weights = QUALITY_WEIGHTS[tier];
  const roll = Math.random() * 100;
  let cum = 0;
  const qualities: RoosterQuality[] = ["Común", "Normal", "Raro", "Legendario"];
  for (let i = 0; i < weights.length; i++) {
    cum += weights[i];
    if (roll < cum) return qualities[i];
  }
  return "Común";
}

export async function countActiveEggs(prisma: PrismaClient, userId: string): Promise<number> {
  return prisma.rooster.count({ where: { userId, stage: { in: ["HUEVO", "POLLO"] } } });
}

export async function createEgg(
  prisma: PrismaClient,
  userId: string,
  quality: RoosterQuality,
  nowMs: number,
): Promise<Rooster> {
  const existing = await prisma.rooster.count({ where: { userId, diedAt: null } });
  if (existing >= MAX_ROOSTERS) {
    throw Object.assign(new Error(`Máximo ${MAX_ROOSTERS} gallos activos`), { status: 400 });
  }

  const hatchReadyAt = new Date(nowMs + HATCH_TIME_MS[quality]);
  const range = STAT_RANGES[quality];

  return prisma.rooster.create({
    data: {
      userId,
      name:    `Huevo ${quality}`,
      stage:   "HUEVO",
      nature:  null,
      quality,
      attack:       range.min,
      defense:      range.min,
      speed:        range.min,
      resistance:   range.min,
      eggStatRanges: { min: range.min, max: range.max },
      hatchReadyAt,
      careCurrent:  50,
      bondPoints:   0,
      hunger:       100,
      thirst:       100,
      growthProgress: 0,
    },
  });
}

export async function buyEgg(
  prisma: PrismaClient,
  userId: string,
  tier: EggTier,
  nowMs: number,
): Promise<Rooster> {
  const price = EGG_PRICES[tier];
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { coins: true } });
  if (user.coins < price) throw Object.assign(new Error("Monedas insuficientes"), { status: 400 });

  const quality = rollQuality(tier);
  const [, egg] = await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { coins: { decrement: price } } }),
    prisma.rooster.create({
      data: {
        userId,
        name:    `Huevo ${quality}`,
        stage:   "HUEVO",
        nature:  null,
        quality,
        attack:       STAT_RANGES[quality].min,
        defense:      STAT_RANGES[quality].min,
        speed:        STAT_RANGES[quality].min,
        resistance:   STAT_RANGES[quality].min,
        eggStatRanges: { min: STAT_RANGES[quality].min, max: STAT_RANGES[quality].max },
        hatchReadyAt:  new Date(nowMs + HATCH_TIME_MS[quality]),
        careCurrent:   50,
        bondPoints:    0,
        hunger:        100,
        thirst:        100,
        growthProgress: 0,
      },
    }),
  ]);
  return egg;
}

export async function claimFreeEgg(
  prisma: PrismaClient,
  userId: string,
  nowMs: number,
): Promise<Rooster> {
  const activeEggs = await countActiveEggs(prisma, userId);
  if (activeEggs >= 3) {
    throw Object.assign(new Error("Necesitas menos de 3 huevos/pollos activos"), { status: 400 });
  }

  const today = new Date(nowMs).toISOString().slice(0, 10);
  const alreadyClaimed = await prisma.rewardTransaction.findFirst({
    where: {
      userId,
      type: "STREAK",
      createdAt: { gte: new Date(`${today}T00:00:00.000Z`) },
    },
  });
  if (alreadyClaimed) throw Object.assign(new Error("Ya reclamaste el huevo gratis hoy"), { status: 429 });

  const quality = rollQuality("MISTERIOSO");
  const egg = await createEgg(prisma, userId, quality, nowMs);
  await prisma.rewardTransaction.create({
    data: { userId, type: "STREAK", amount: 0 },
  });
  return egg;
}

export { rollQuality };
