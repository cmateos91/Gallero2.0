import { z } from "zod";

export const EggTierSchema = z.enum(["MISTERIOSO", "SELECTO", "DORADO"]);
export type EggTier = z.infer<typeof EggTierSchema>;

export type RoosterDto = {
  id:            string;
  userId:        string;
  name:          string;
  stage:         string;
  nature:        string | null;
  quality:       string;
  attack:        number;
  defense:       number;
  speed:         number;
  resistance:    number;
  careCurrent:   number;
  bondPoints:    number;
  hunger:        number;
  thirst:        number;
  growthProgress: number;
  hatchReadyAt:  Date | null;
  diedAt:        Date | null;
  positionX:     number | null;
  positionY:     number | null;
  homeScreen:    string | null;
  isAtHome:      boolean;
  onFence:       boolean;
  customColors:  unknown;
  paintLayers:   unknown;
  createdAt:     Date;
  // campos computados
  hungerValue:   number;
  thirstValue:   number;
  healthValue:   number;
  isDead:        boolean;
};

export const QUALITY_WEIGHTS: Record<EggTier, [number, number, number, number]> = {
  MISTERIOSO: [50, 35, 13, 2],
  SELECTO:    [10, 40, 35, 15],
  DORADO:     [0,  15, 50, 35],
};

export type RoosterQuality = "Común" | "Normal" | "Raro" | "Legendario";

export const HATCH_TIME_MS: Record<RoosterQuality, number> = {
  Común:       30 * 60_000,
  Normal:      60 * 60_000,
  Raro:        2 * 60 * 60_000,
  Legendario:  4 * 60 * 60_000,
};

export const STAT_RANGES: Record<RoosterQuality, { min: number; max: number }> = {
  Común:      { min: 6,  max: 16 },
  Normal:     { min: 10, max: 24 },
  Raro:       { min: 16, max: 35 },
  Legendario: { min: 24, max: 48 },
};

export const EGG_PRICES: Record<EggTier, number> = {
  MISTERIOSO: 80,
  SELECTO:    200,
  DORADO:     500,
};

export const MAX_ROOSTERS = 5;
export const DEAD_RESCUE_WINDOW_MS = 7 * 24 * 3600_000;
