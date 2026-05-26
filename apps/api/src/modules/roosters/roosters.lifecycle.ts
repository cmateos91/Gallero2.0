import type { PrismaClient, Rooster } from "@prisma/client";
import {
  getRoosterNeedSnapshot,
  getProjectedRoosterGrowth,
  randomNature,
  HUNGER_PER_FEED,
  THIRST_PER_DRINK,
  trainCareCost,
  NATURE_DELTAS,
  computeCareMultiplier,
  computeBondMultiplier,
} from "@gallos/game-engine";
import type { Rooster as EngineRooster } from "@gallos/game-engine";
import type { RoosterDto } from "./roosters.schemas.js";
import { DEAD_RESCUE_WINDOW_MS, STAT_RANGES } from "./roosters.schemas.js";

function toEngineRooster(r: Rooster): EngineRooster {
  return {
    ...r,
    nature:   r.nature ?? undefined,
    updatedAt: r.updatedAt.toISOString(),
    hatchReadyAt: r.hatchReadyAt?.toISOString() ?? null,
    diedAt:    r.diedAt?.toISOString() ?? null,
  } as unknown as EngineRooster;
}

export function toRoosterDto(rooster: Rooster, nowMs: number): RoosterDto {
  const snap = getRoosterNeedSnapshot(toEngineRooster(rooster), nowMs);
  return {
    id:             rooster.id,
    userId:         rooster.userId,
    name:           rooster.name,
    stage:          rooster.stage,
    nature:         rooster.nature ?? null,
    quality:        rooster.quality,
    attack:         rooster.attack,
    defense:        rooster.defense,
    speed:          rooster.speed,
    resistance:     rooster.resistance,
    careCurrent:    rooster.careCurrent,
    bondPoints:     rooster.bondPoints,
    hunger:         rooster.hunger,
    thirst:         rooster.thirst,
    growthProgress: rooster.growthProgress,
    hatchReadyAt:   rooster.hatchReadyAt,
    diedAt:         rooster.diedAt,
    positionX:      rooster.positionX,
    positionY:      rooster.positionY,
    homeScreen:     rooster.homeScreen,
    isAtHome:       rooster.isAtHome,
    onFence:        rooster.onFence,
    customColors:   rooster.customColors,
    paintLayers:    rooster.paintLayers,
    createdAt:      rooster.createdAt,
    hungerValue:    snap.hungerValue,
    thirstValue:    snap.thirstValue,
    healthValue:    snap.healthValue,
    isDead:         snap.healthValue <= 0,
  };
}

export async function syncRoosterLifecycle(
  prisma: PrismaClient,
  rooster: Rooster,
  nowMs: number,
): Promise<Rooster> {
  let updated = rooster;

  // Eclosión
  if (
    rooster.stage === "HUEVO" &&
    rooster.hatchReadyAt !== null &&
    rooster.hatchReadyAt.getTime() <= nowMs
  ) {
    const quality = rooster.quality as keyof typeof STAT_RANGES;
    const range = STAT_RANGES[quality] ?? STAT_RANGES.Común;
    const careBonus = rooster.careCurrent / 100;

    const rollStat = (min: number, max: number): number => {
      const base = min + Math.floor(Math.random() * (max - min + 1));
      const bonus = Math.floor((max - base) * careBonus * 0.5);
      return Math.min(max, base + bonus);
    };

    const nature = randomNature();
    updated = await prisma.rooster.update({
      where: { id: rooster.id },
      data: {
        stage:    "POLLO",
        nature,
        attack:   rollStat(range.min, range.max),
        defense:  rollStat(range.min, range.max),
        speed:    rollStat(range.min, range.max),
        resistance: rollStat(range.min, range.max),
        hunger:   100,
        thirst:   100,
        hatchReadyAt: null,
        growthProgress: 0,
      },
    });
  }

  // Evolución POLLO → ADULTO
  if (updated.stage === "POLLO") {
    const projection = getProjectedRoosterGrowth(toEngineRooster(updated), nowMs);
    if (projection.growthProgress >= 100) {
      updated = await prisma.rooster.update({
        where: { id: rooster.id },
        data: { stage: "ADULTO", growthProgress: 100 },
      });
    }
  }

  // Muerte
  if (updated.stage !== "HUEVO" && updated.diedAt === null) {
    const snap = getRoosterNeedSnapshot(toEngineRooster(updated), nowMs);
    if (snap.healthValue <= 0) {
      updated = await prisma.rooster.update({
        where: { id: rooster.id },
        data: { diedAt: new Date(nowMs) },
      });
    }
  }

  return updated;
}

export async function listRoostersWithSync(
  prisma: PrismaClient,
  userId: string,
  nowMs: number,
): Promise<RoosterDto[]> {
  const roosters = await prisma.rooster.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  // Limpiar muertos expirados
  const expired = roosters.filter(
    (r) => r.diedAt !== null && nowMs - r.diedAt.getTime() > DEAD_RESCUE_WINDOW_MS,
  );
  if (expired.length > 0) {
    await prisma.rooster.deleteMany({ where: { id: { in: expired.map((r) => r.id) } } });
  }

  const live = roosters.filter((r) => !expired.includes(r));
  const synced = await Promise.all(live.map((r) => syncRoosterLifecycle(prisma, r, nowMs)));
  return synced.map((r) => toRoosterDto(r, nowMs));
}

export async function trainRooster(
  prisma: PrismaClient,
  userId: string,
  roosterId: string,
  nowMs: number,
): Promise<Rooster> {
  const rooster = await prisma.rooster.findFirst({
    where: { id: roosterId, userId, stage: "ADULTO", diedAt: null },
  });
  if (!rooster) throw Object.assign(new Error("Gallo no encontrado o no es adulto"), { status: 404 });
  if (!rooster.nature) throw Object.assign(new Error("Gallo sin naturaleza"), { status: 400 });

  const today = new Date(nowMs).toISOString().slice(0, 10);
  const todayStart = new Date(`${today}T00:00:00.000Z`);

  const avgStats = (rooster.attack + rooster.defense + rooster.speed + rooster.resistance) / 4;
  const careCost = trainCareCost(avgStats);
  if (rooster.careCurrent < careCost) {
    throw Object.assign(new Error(`Care insuficiente (necesitas ${careCost})`), { status: 400 });
  }

  // Max 3 entrenamientos/día (track via DailyMissionProgress)
  const missionProgress = await prisma.dailyMissionProgress.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  if ((missionProgress?.trainings ?? 0) >= 3) {
    throw Object.assign(new Error("Máximo 3 entrenamientos por día"), { status: 429 });
  }

  const deltas = NATURE_DELTAS[rooster.nature as keyof typeof NATURE_DELTAS];

  const updated = await prisma.rooster.update({
    where: { id: roosterId },
    data: {
      attack:     rooster.attack + deltas.attack,
      defense:    rooster.defense + deltas.defense,
      speed:      rooster.speed + deltas.speed,
      resistance: rooster.resistance + deltas.resistance,
      careCurrent: Math.max(0, rooster.careCurrent - careCost),
    },
  });

  await prisma.dailyMissionProgress.upsert({
    where: { userId_date: { userId, date: today } },
    update: { trainings: { increment: 1 } },
    create: { userId, date: today, trainings: 1 },
  });

  void todayStart;
  return updated;
}

export async function careRooster(
  prisma: PrismaClient,
  userId: string,
  roosterId: string,
): Promise<Rooster> {
  const rooster = await prisma.rooster.findFirst({
    where: { id: roosterId, userId, diedAt: null },
  });
  if (!rooster) throw Object.assign(new Error("Gallo no encontrado"), { status: 404 });

  return prisma.rooster.update({
    where: { id: roosterId },
    data: {
      careCurrent: Math.min(100, rooster.careCurrent + 5),
      bondPoints:  rooster.bondPoints + 1,
    },
  });
}

export async function feedRooster(
  prisma: PrismaClient,
  userId: string,
  roosterId: string,
): Promise<Rooster> {
  const rooster = await prisma.rooster.findFirst({
    where: { id: roosterId, userId, diedAt: null },
  });
  if (!rooster) throw Object.assign(new Error("Gallo no encontrado"), { status: 404 });

  const food = await prisma.userInventory.findUnique({
    where: { userId_itemType_itemKey: { userId, itemType: "FOOD", itemKey: "comida_basica" } },
  });
  if (!food || food.quantity < 1) {
    throw Object.assign(new Error("Sin comida en inventario"), { status: 400 });
  }

  const [, updated] = await prisma.$transaction([
    prisma.userInventory.update({
      where: { userId_itemType_itemKey: { userId, itemType: "FOOD", itemKey: "comida_basica" } },
      data: { quantity: { decrement: 1 } },
    }),
    prisma.rooster.update({
      where: { id: roosterId },
      data: { hunger: Math.min(100, rooster.hunger + HUNGER_PER_FEED) },
    }),
    prisma.dailyMissionProgress.upsert({
      where: { userId_date: { userId, date: new Date().toISOString().slice(0, 10) } },
      update: { feedings: { increment: 1 } },
      create: { userId, date: new Date().toISOString().slice(0, 10), feedings: 1 },
    }),
  ]);
  return updated;
}

export async function drinkRooster(
  prisma: PrismaClient,
  userId: string,
  roosterId: string,
): Promise<Rooster> {
  const rooster = await prisma.rooster.findFirst({
    where: { id: roosterId, userId, diedAt: null },
  });
  if (!rooster) throw Object.assign(new Error("Gallo no encontrado"), { status: 404 });

  const water = await prisma.userInventory.findUnique({
    where: { userId_itemType_itemKey: { userId, itemType: "WATER", itemKey: "agua" } },
  });
  if (!water || water.quantity < 1) {
    throw Object.assign(new Error("Sin agua en inventario"), { status: 400 });
  }

  const [, updated] = await prisma.$transaction([
    prisma.userInventory.update({
      where: { userId_itemType_itemKey: { userId, itemType: "WATER", itemKey: "agua" } },
      data: { quantity: { decrement: 1 } },
    }),
    prisma.rooster.update({
      where: { id: roosterId },
      data: { thirst: Math.min(100, rooster.thirst + THIRST_PER_DRINK) },
    }),
  ]);
  return updated;
}

export async function fuseRoosters(
  prisma: PrismaClient,
  userId: string,
  id1: string,
  id2: string,
  nowMs: number,
): Promise<Rooster> {
  if (id1 === id2) throw Object.assign(new Error("No puedes fusionar el mismo gallo"), { status: 400 });

  const [r1, r2] = await Promise.all([
    prisma.rooster.findFirst({ where: { id: id1, userId, stage: "ADULTO", diedAt: null } }),
    prisma.rooster.findFirst({ where: { id: id2, userId, stage: "ADULTO", diedAt: null } }),
  ]);
  if (!r1 || !r2) throw Object.assign(new Error("Ambos gallos deben ser adultos y tuyo"), { status: 400 });

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const spread = () => Math.floor(Math.random() * 5) - 2;

  const avgAtk = Math.floor((r1.attack  + r2.attack)  / 2);
  const avgDef = Math.floor((r1.defense + r2.defense) / 2);
  const avgSpd = Math.floor((r1.speed   + r2.speed)   / 2);
  const avgRes = Math.floor((r1.resistance + r2.resistance) / 2);

  const newAtk = clamp(avgAtk + spread(), 9, 34);
  const newDef = clamp(avgDef + spread(), 9, 34);
  const newSpd = clamp(avgSpd + spread(), 9, 34);
  const newRes = clamp(avgRes + spread(), 9, 34);

  const avgTotal = (newAtk + newDef + newSpd + newRes) / 4;
  const quality = avgTotal >= 30 ? "Legendario" : avgTotal >= 22 ? "Raro" : avgTotal >= 16 ? "Normal" : "Común";

  const hatchReadyAt = new Date(nowMs + 60 * 60_000);

  const [egg] = await prisma.$transaction([
    prisma.rooster.create({
      data: {
        userId,
        name: `Huevo de ${r1.name} × ${r2.name}`.slice(0, 40),
        stage: "HUEVO",
        nature: null,
        quality,
        attack: newAtk,
        defense: newDef,
        speed: newSpd,
        resistance: newRes,
        hatchReadyAt,
        careCurrent: 50,
        bondPoints: 0,
        hunger: 100,
        thirst: 100,
        growthProgress: 0,
      },
    }),
    prisma.rooster.delete({ where: { id: id1 } }),
    prisma.rooster.delete({ where: { id: id2 } }),
  ]);

  return egg;
}

export async function sellRooster(
  prisma: PrismaClient,
  userId: string,
  roosterId: string,
): Promise<{ coins: number }> {
  const rooster = await prisma.rooster.findFirst({ where: { id: roosterId, userId } });
  if (!rooster) throw Object.assign(new Error("Gallo no encontrado"), { status: 404 });

  const avgStats = (rooster.attack + rooster.defense + rooster.speed + rooster.resistance) / 4;
  const baseCoins = Math.max(5, Math.floor(avgStats * 2));
  const dead = rooster.diedAt !== null;
  const coins = dead ? Math.floor(baseCoins * 0.08) : baseCoins;

  await prisma.$transaction([
    prisma.rooster.delete({ where: { id: roosterId } }),
    prisma.user.update({ where: { id: userId }, data: { coins: { increment: coins } } }),
  ]);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { coins: true } });
  return { coins: user.coins };
}

export { computeCareMultiplier, computeBondMultiplier };
