import type { RoosterNature } from "./care.js";
import { createSeededRng, type CombatMove, type CombatState } from "./combat.js";

export interface TowerNpc {
  name: string;
  nature: RoosterNature;
  attack: number;
  defense: number;
  speed: number;
  resistance: number;
  isBoss: boolean;
}

const NATURES: RoosterNature[] = ["AGRESIVO", "DEFENSIVO", "VELOZ", "ROBUSTO", "EQUILIBRADO"];

const CAMPAIGN_BOSSES: Record<number, { name: string; nature: RoosterNature }> = {
  5: { name: "Polvorin", nature: "AGRESIVO" },
  10: { name: "Don Gallo", nature: "EQUILIBRADO" },
};

const ROTATING_BOSSES: { name: string; nature: RoosterNature }[] = [
  { name: "Sombra", nature: "VELOZ" },
  { name: "Volcan", nature: "AGRESIVO" },
  { name: "Muralla", nature: "DEFENSIVO" },
  { name: "Titan", nature: "ROBUSTO" },
  { name: "Tormenta", nature: "VELOZ" },
  { name: "Fenix", nature: "EQUILIBRADO" },
];

export function generateTowerNpc(floor: number, runSeed: number): TowerNpc {
  const seed = runSeed + floor * 7919;
  const rng = createSeededRng(seed);

  const isBoss = floor % 5 === 0;
  const statsBase = Math.floor(10 + floor * 1.2);
  const bossMultiplier = isBoss ? 1.15 : 1;

  let name: string;
  let nature: RoosterNature;

  if (isBoss && floor <= 10 && CAMPAIGN_BOSSES[floor]) {
    name = CAMPAIGN_BOSSES[floor].name;
    nature = CAMPAIGN_BOSSES[floor].nature;
  } else if (isBoss) {
    const idx = Math.floor(rng() * ROTATING_BOSSES.length);
    name = ROTATING_BOSSES[idx].name;
    nature = ROTATING_BOSSES[idx].nature;
  } else {
    const adjectives = ["Bravo", "Feroz", "Veloz", "Fiero", "Rudo", "Astuto"];
    name = adjectives[Math.floor(rng() * adjectives.length)] + " " + String(floor);
    nature = NATURES[Math.floor(rng() * NATURES.length)];
  }

  const naturalVariance = () => Math.floor((rng() - 0.5) * 4);

  return {
    name,
    nature,
    attack: Math.max(1, Math.floor((statsBase + naturalVariance()) * bossMultiplier)),
    defense: Math.max(1, Math.floor((statsBase + naturalVariance()) * bossMultiplier)),
    speed: Math.max(1, Math.floor((statsBase + naturalVariance()) * bossMultiplier)),
    resistance: Math.max(1, Math.floor((statsBase + naturalVariance()) * bossMultiplier)),
    isBoss,
  };
}

export function aiPickMoveTower(
  floor: number,
  playerLastMoves: CombatMove[],
  npcNature: RoosterNature,
  rng: () => number,
  combatState?: CombatState,
): CombatMove {
  const roll = rng();

  // Overrides por energía (prioridad máxima)
  if (combatState) {
    const energy = combatState.fighterA.energy;
    const consecutiveDefs = combatState.fighterA.consecutiveDefenses;

    if (energy < 30 && roll < 0.65) return "defender";
    if (consecutiveDefs >= 2 && roll < 0.85) return "atacar";
  }

  // Pisos 21+: 50% counter a últimos 3 movimientos
  if (floor >= 21 && playerLastMoves.length > 0) {
    const last3 = playerLastMoves.slice(-3);
    const mostCommon = last3.reduce<Record<string, number>>((acc, m) => {
      acc[m] = (acc[m] ?? 0) + 1;
      return acc;
    }, {});
    const topMove = Object.entries(mostCommon).sort((a, b) => b[1] - a[1])[0]?.[0] as CombatMove | undefined;
    if (topMove && roll < 0.5) return counterMove(topMove);
  }

  // Pisos 11-20: 40% counter al último movimiento
  if (floor >= 11 && playerLastMoves.length > 0) {
    const lastMove = playerLastMoves[playerLastMoves.length - 1];
    if (roll < 0.4) return counterMove(lastMove);
  }

  // Pisos 6-10: 50% atacar, 25% defender, 25% esquivar
  if (floor >= 6) {
    if (roll < 0.5) return "atacar";
    if (roll < 0.75) return "defender";
    return "esquivar";
  }

  // Pisos 1-5: uniforme con sesgo de naturaleza
  return natureBiasedMove(npcNature, roll);
}

function counterMove(move: CombatMove): CombatMove {
  switch (move) {
    case "atacar": return "defender";
    case "defender": return "atacar";
    case "esquivar": return "atacar";
    default: return "atacar";
  }
}

function natureBiasedMove(nature: RoosterNature, roll: number): CombatMove {
  switch (nature) {
    case "AGRESIVO":
      return roll < 0.65 ? "atacar" : roll < 0.85 ? "defender" : "esquivar";
    case "DEFENSIVO":
      return roll < 0.35 ? "atacar" : roll < 0.75 ? "defender" : "esquivar";
    case "VELOZ":
      return roll < 0.40 ? "atacar" : roll < 0.60 ? "defender" : "esquivar";
    case "ROBUSTO":
      return roll < 0.45 ? "atacar" : roll < 0.80 ? "defender" : "esquivar";
    default:
      return roll < 0.50 ? "atacar" : roll < 0.75 ? "defender" : "esquivar";
  }
}

export function computeTowerFloorCoins(floor: number): number {
  const base = 5 + floor * 2;
  if (floor % 5 === 0) return Math.floor(base * 1.5);
  return base;
}
