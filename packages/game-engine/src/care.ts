export type RoosterNature = "AGRESIVO" | "DEFENSIVO" | "VELOZ" | "ROBUSTO" | "EQUILIBRADO";

export interface NatureDeltas {
  attack: number;
  defense: number;
  speed: number;
  resistance: number;
}

export const CARE_DECAY_INTERVAL_MS = 7_200_000;

export const NATURE_DELTAS: Record<RoosterNature, NatureDeltas> = {
  AGRESIVO:    { attack: 3, defense: 1, speed: 1, resistance: 0 },
  DEFENSIVO:   { attack: 0, defense: 3, speed: 1, resistance: 1 },
  VELOZ:       { attack: 1, defense: 0, speed: 3, resistance: 1 },
  ROBUSTO:     { attack: 1, defense: 1, speed: 0, resistance: 3 },
  EQUILIBRADO: { attack: 1, defense: 1, speed: 1, resistance: 1 },
};

const NATURES: RoosterNature[] = ["AGRESIVO", "DEFENSIVO", "VELOZ", "ROBUSTO", "EQUILIBRADO"];

export function randomNature(rng: () => number = Math.random): RoosterNature {
  return NATURES[Math.floor(rng() * NATURES.length)];
}

export function computeCareMultiplier(care: number): number {
  const clamped = Math.max(0, Math.min(100, care));
  return 0.7 + (clamped / 100) * 0.4;
}

export function computeBondMultiplier(bondPoints: number): number {
  if (bondPoints >= 500) return 1.03;
  if (bondPoints >= 250) return 1.02;
  if (bondPoints >= 100) return 1.01;
  return 1.00;
}

export function trainCareCost(avgStats: number): number {
  if (avgStats >= 45) return 25;
  if (avgStats >= 35) return 18;
  if (avgStats >= 26) return 12;
  if (avgStats >= 18) return 8;
  return 5;
}

export function getNatureDeltas(nature: RoosterNature): NatureDeltas {
  return NATURE_DELTAS[nature];
}
