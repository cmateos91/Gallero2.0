import type { RoosterNature } from "./care.js";

export type { RoosterNature };
export type RoosterStage = "HUEVO" | "POLLO" | "ADULTO";
export type RoosterQuality = "Común" | "Normal" | "Raro" | "Legendario";

export interface Rooster {
  stage: RoosterStage;
  nature: RoosterNature | null;
  quality: RoosterQuality;
  attack: number;
  defense: number;
  speed: number;
  resistance: number;
  careCurrent: number;
  bondPoints: number;
  hunger: number;
  thirst: number;
  growthProgress: number;
  updatedAt: string;
  hatchReadyAt: string | null;
  diedAt: string | null;
}

export interface RoosterNeedSnapshot {
  hungerValue: number;
  thirstValue: number;
  healthValue: number;
}

export interface RoosterGrowthProjection extends RoosterNeedSnapshot {
  growthProgress: number;
  isDead: boolean;
  stage: RoosterStage;
}

export const HUNGER_DECAY_PER_HOUR = 4;
export const THIRST_DECAY_PER_HOUR = 8;
export const HUNGER_PER_FEED = 20;
export const THIRST_PER_DRINK = 25;
export const CARE_DECAY_PER_HOUR = 0.5;
export const DEAD_RESCUE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const GROWTH_MIN_RESOURCE = 50;

export function computeGrowthPerHour(avgStats: number): number {
  const raw = 9.0 * Math.pow(0.92, avgStats);
  return Math.max(1.5, Math.min(8.0, raw));
}

function computeHealthValue(hungerValue: number, thirstValue: number): number {
  const avg = (hungerValue + thirstValue) / 2;
  const dualPenalty = Math.max(0, Math.min(hungerValue, thirstValue) - 50) * 2;
  return 100 - avg - dualPenalty;
}

export function getRoosterNeedSnapshot(rooster: Rooster, nowMs: number): RoosterNeedSnapshot {
  const elapsedHours = (nowMs - Date.parse(rooster.updatedAt)) / 3_600_000;

  const currentHunger = Math.max(0, rooster.hunger - HUNGER_DECAY_PER_HOUR * elapsedHours);
  const currentThirst = Math.max(0, rooster.thirst - THIRST_DECAY_PER_HOUR * elapsedHours);

  const hungerValue = Math.max(0, Math.min(100, 100 - currentHunger));
  const thirstValue = Math.max(0, Math.min(100, 100 - currentThirst));
  const healthValue = computeHealthValue(hungerValue, thirstValue);

  return { hungerValue, thirstValue, healthValue };
}

export function getProjectedRoosterGrowth(rooster: Rooster, nowMs: number): RoosterGrowthProjection {
  const snap = getRoosterNeedSnapshot(rooster, nowMs);
  const isDead = snap.healthValue <= 0 && snap.hungerValue > 50 && snap.thirstValue > 50;

  if (rooster.stage !== "POLLO" || isDead) {
    return {
      ...snap,
      growthProgress: rooster.growthProgress,
      isDead,
      stage: isDead ? rooster.stage : rooster.stage,
    };
  }

  const elapsedHours = (nowMs - Date.parse(rooster.updatedAt)) / 3_600_000;
  const avgStats = (rooster.attack + rooster.defense + rooster.speed + rooster.resistance) / 4;

  const currentHunger = Math.max(0, rooster.hunger - HUNGER_DECAY_PER_HOUR * elapsedHours);
  const currentThirst = Math.max(0, rooster.thirst - THIRST_DECAY_PER_HOUR * elapsedHours);
  const canGrow = currentHunger >= GROWTH_MIN_RESOURCE && currentThirst >= GROWTH_MIN_RESOURCE;

  let growthProgress = rooster.growthProgress;
  if (canGrow) {
    const growthPerHour = computeGrowthPerHour(avgStats);
    growthProgress = Math.min(100, rooster.growthProgress + growthPerHour * elapsedHours);
  }

  const stage: RoosterStage = growthProgress >= 100 ? "ADULTO" : "POLLO";

  return { ...snap, growthProgress, isDead: false, stage };
}

export function getTimeToEvolution(rooster: Rooster, nowMs: number): number | null {
  if (rooster.stage !== "POLLO") return null;

  const snap = getRoosterNeedSnapshot(rooster, nowMs);
  const currentHunger = Math.max(0, rooster.hunger - HUNGER_DECAY_PER_HOUR * ((nowMs - Date.parse(rooster.updatedAt)) / 3_600_000));
  const currentThirst = Math.max(0, rooster.thirst - THIRST_DECAY_PER_HOUR * ((nowMs - Date.parse(rooster.updatedAt)) / 3_600_000));
  const canGrow = currentHunger >= GROWTH_MIN_RESOURCE && currentThirst >= GROWTH_MIN_RESOURCE;

  if (!canGrow || snap.healthValue <= 0) return null;

  const avgStats = (rooster.attack + rooster.defense + rooster.speed + rooster.resistance) / 4;
  const growthPerHour = computeGrowthPerHour(avgStats);
  const remaining = 100 - rooster.growthProgress;

  if (remaining <= 0) return 0;

  return Math.ceil((remaining / growthPerHour) * 3_600_000);
}
