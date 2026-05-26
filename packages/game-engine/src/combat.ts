import type { CombatItemType } from "./combat-items.js";
import { findCombatItemDescriptor } from "./combat-items.js";

export type CombatMove = "atacar" | "defender" | "esquivar" | "huir" | "usar_objeto";
export type PRNG = () => number;

export interface CombatBuff {
  stat: "attack" | "defense" | "speed";
  value: number;
  turnsRemaining: number;
  isSwap?: boolean;
  targetStat?: "attack" | "defense" | "speed";
}

export interface Fighter {
  attack: number;
  defense: number;
  speed: number;
  resistance: number;
  careMultiplier: number;
  bondMultiplier: number;
}

export interface CombatFighterState {
  hp: number;
  energy: number;
  buffs: CombatBuff[];
  consecutiveDefenses: number;
}

export interface CombatState {
  fighterA: CombatFighterState;
  fighterB: CombatFighterState;
  momentumFighter: 0 | 1 | null;
  momentumMultiplier: number;
  turnsCount: number;
  isOver: boolean;
  winner: 0 | 1 | null;
}

export interface TurnResult {
  damageA: number;
  damageB: number;
  log: string[];
  isOver: boolean;
  winner: 0 | 1 | null;
}

export const ENERGY_MAX = 100;
export const ENERGY_START = 50;
export const ENERGY_ATTACK_COST = 30;
export const ENERGY_DEFEND_RECOVER = 25;
export const ENERGY_DODGE_COST = 10;

export function createSeededRng(seed: number): PRNG {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function initCombatState(fighterA: Fighter, fighterB: Fighter): CombatState {
  return {
    fighterA: {
      hp: fighterA.resistance * 3,
      energy: ENERGY_START,
      buffs: [],
      consecutiveDefenses: 0,
    },
    fighterB: {
      hp: fighterB.resistance * 3,
      energy: ENERGY_START,
      buffs: [],
      consecutiveDefenses: 0,
    },
    momentumFighter: null,
    momentumMultiplier: 1,
    turnsCount: 0,
    isOver: false,
    winner: null,
  };
}

function getEffectiveStat(
  base: number,
  stat: "attack" | "defense" | "speed",
  fighter: Fighter,
  fighterState: CombatFighterState,
): number {
  const multiplier = fighter.careMultiplier * fighter.bondMultiplier;
  let value = base * multiplier;
  for (const buff of fighterState.buffs) {
    if (buff.stat === stat) value += buff.value;
  }
  return Math.max(1, value);
}

function computeDamage(
  attacker: Fighter,
  attackerState: CombatFighterState,
  defender: Fighter,
  defenderState: CombatFighterState,
  isDefending: boolean,
  extraMultiplier: number,
  rng: PRNG,
  preDeductionEnergy: number,
): number {
  const effectiveAtk = getEffectiveStat(attacker.attack, "attack", attacker, attackerState);
  const baseDefense = getEffectiveStat(defender.defense, "defense", defender, defenderState);
  const effectiveDef = isDefending ? baseDefense * 2 : baseDefense;

  const isWeak = preDeductionEnergy < ENERGY_ATTACK_COST;
  const weakMultiplier = isWeak ? 0.5 : 1;
  const variance = 0.85 + rng() * 0.3;

  const raw = Math.max(
    1,
    Math.floor((effectiveAtk / Math.max(1, effectiveDef)) * 8 * variance * weakMultiplier * extraMultiplier),
  );
  return raw;
}

function decrementBuffs(buffs: CombatBuff[]): CombatBuff[] {
  return buffs
    .map((b) => ({ ...b, turnsRemaining: b.turnsRemaining - 1 }))
    .filter((b) => b.turnsRemaining > 0);
}

export function resolveTurn(
  state: CombatState,
  fighterA: Fighter,
  fighterB: Fighter,
  moveA: CombatMove,
  moveB: CombatMove,
  rng: PRNG,
): { state: CombatState; turnResult: TurnResult } {
  if (state.isOver) return { state, turnResult: { damageA: 0, damageB: 0, log: [], isOver: true, winner: state.winner } };

  let fsA = { ...state.fighterA, buffs: [...state.fighterA.buffs] };
  let fsB = { ...state.fighterB, buffs: [...state.fighterB.buffs] };
  const log: string[] = [];
  let damageA = 0;
  let damageB = 0;

  // Huir
  if (moveA === "huir") {
    return {
      state: { ...state, isOver: true, winner: 1 },
      turnResult: { damageA: 0, damageB: 0, log: ["A huye"], isOver: true, winner: 1 },
    };
  }
  if (moveB === "huir") {
    return {
      state: { ...state, isOver: true, winner: 0 },
      turnResult: { damageA: 0, damageB: 0, log: ["B huye"], isOver: true, winner: 0 },
    };
  }

  const isADefending = moveA === "defender";
  const isBDefending = moveB === "defender";

  // Ataque de A sobre B
  if (moveA === "atacar") {
    const energyABefore = fsA.energy;
    fsA.energy = Math.max(0, fsA.energy - ENERGY_ATTACK_COST);
    const hasMomentum = state.momentumFighter === 0;
    const isCharged = fsA.consecutiveDefenses >= 2;
    const atkMulti = (hasMomentum ? state.momentumMultiplier : 1) * (isCharged ? 1.8 : 1);

    if (moveB === "esquivar") {
      fsB.energy = Math.max(0, fsB.energy - ENERGY_DODGE_COST);
      const dodgeProb = Math.min(0.75, fighterB.speed / (fighterB.speed + fighterA.speed));
      if (rng() < dodgeProb) {
        log.push("B esquiva");
        fsB.consecutiveDefenses = 0;
      } else {
        const dmg = computeDamage(fighterA, fsA, fighterB, fsB, false, atkMulti * 1.3, rng, energyABefore);
        fsB.hp = Math.max(0, fsB.hp - dmg);
        damageB = dmg;
        log.push(`A ataca (fallo esquiva): ${String(dmg)}`);
        fsB.consecutiveDefenses = 0;
      }
    } else {
      const dmg = computeDamage(fighterA, fsA, fighterB, fsB, isBDefending, atkMulti, rng, energyABefore);
      fsB.hp = Math.max(0, fsB.hp - dmg);
      damageB = dmg;
      log.push(`A ataca: ${String(dmg)}`);

      if (isBDefending && dmg > 0) {
        const counter = Math.floor(dmg * 0.4);
        fsA.hp = Math.max(0, fsA.hp - counter);
        damageA += counter;
        log.push(`B contraataca: ${String(counter)}`);
      }
      fsB.consecutiveDefenses = 0;
    }

    fsA.consecutiveDefenses = 0;
  }

  // Ataque de B sobre A
  if (moveB === "atacar") {
    const energyBBefore = fsB.energy;
    fsB.energy = Math.max(0, fsB.energy - ENERGY_ATTACK_COST);
    const hasMomentum = state.momentumFighter === 1;
    const isCharged = fsB.consecutiveDefenses >= 2;
    const atkMulti = (hasMomentum ? state.momentumMultiplier : 1) * (isCharged ? 1.8 : 1);

    if (moveA === "esquivar") {
      fsA.energy = Math.max(0, fsA.energy - ENERGY_DODGE_COST);
      const dodgeProb = Math.min(0.75, fighterA.speed / (fighterA.speed + fighterB.speed));
      if (rng() < dodgeProb) {
        log.push("A esquiva");
        fsA.consecutiveDefenses = 0;
      } else {
        const dmg = computeDamage(fighterB, fsB, fighterA, fsA, false, atkMulti * 1.3, rng, energyBBefore);
        fsA.hp = Math.max(0, fsA.hp - dmg);
        damageA += dmg;
        log.push(`B ataca (fallo esquiva): ${String(dmg)}`);
        fsA.consecutiveDefenses = 0;
      }
    } else {
      const dmg = computeDamage(fighterB, fsB, fighterA, fsA, isADefending, atkMulti, rng, energyBBefore);
      fsA.hp = Math.max(0, fsA.hp - dmg);
      damageA += dmg;
      log.push(`B ataca: ${String(dmg)}`);

      if (isADefending && dmg > 0) {
        const counter = Math.floor(dmg * 0.4);
        fsB.hp = Math.max(0, fsB.hp - counter);
        damageB += counter;
        log.push(`A contraataca: ${String(counter)}`);
      }
      fsA.consecutiveDefenses = 0;
    }

    fsB.consecutiveDefenses = 0;
  }

  // Defender recupera energía y acumula defensas consecutivas
  if (isADefending) {
    fsA.energy = Math.min(ENERGY_MAX, fsA.energy + ENERGY_DEFEND_RECOVER);
    fsA.consecutiveDefenses = (state.fighterA.consecutiveDefenses ?? 0) + 1;
  }
  if (isBDefending) {
    fsB.energy = Math.min(ENERGY_MAX, fsB.energy + ENERGY_DEFEND_RECOVER);
    fsB.consecutiveDefenses = (state.fighterB.consecutiveDefenses ?? 0) + 1;
  }

  // Esquivar solo gasta energía (ya manejado arriba si el rival ataca)
  if (moveA === "esquivar" && moveB !== "atacar") {
    fsA.energy = Math.max(0, fsA.energy - ENERGY_DODGE_COST);
  }
  if (moveB === "esquivar" && moveA !== "atacar") {
    fsB.energy = Math.max(0, fsB.energy - ENERGY_DODGE_COST);
  }

  // Decrementar buffs
  fsA.buffs = decrementBuffs(fsA.buffs);
  fsB.buffs = decrementBuffs(fsB.buffs);

  // Limpiar momentum usado
  const newMomentum: { fighter: 0 | 1 | null; mult: number } = { fighter: null, mult: 1 };

  // Comprobar fin de combate
  let isOver = false;
  let winner: 0 | 1 | null = null;
  if (fsA.hp <= 0 && fsB.hp <= 0) {
    isOver = true;
    winner = null;
  } else if (fsA.hp <= 0) {
    isOver = true;
    winner = 1;
  } else if (fsB.hp <= 0) {
    isOver = true;
    winner = 0;
  }

  const newState: CombatState = {
    fighterA: fsA,
    fighterB: fsB,
    momentumFighter: newMomentum.fighter,
    momentumMultiplier: newMomentum.mult,
    turnsCount: state.turnsCount + 1,
    isOver,
    winner,
  };

  return {
    state: newState,
    turnResult: { damageA, damageB, log, isOver, winner },
  };
}

export function aiPickMove(rng: PRNG, state?: CombatState): CombatMove {
  const roll = rng();
  if (state) {
    const fs = state.fighterA;
    if (fs.energy < 30 && roll < 0.65) return "defender";
    if (fs.consecutiveDefenses >= 2 && roll < 0.85) return "atacar";
  }
  if (roll < 0.55) return "atacar";
  if (roll < 0.75) return "defender";
  if (roll < 0.90) return "esquivar";
  return "atacar";
}

export function applyCombatItem(
  itemType: CombatItemType,
  state: CombatState,
  fighter: 0 | 1,
  fighterData: Fighter,
): { newState: CombatState; result: string } {
  const descriptor = findCombatItemDescriptor(itemType);
  if (!descriptor) return { newState: state, result: "Item no encontrado" };

  const fsKey = fighter === 0 ? "fighterA" : "fighterB";
  const fs = { ...state[fsKey], buffs: [...state[fsKey].buffs] };
  const maxHp = fighterData.resistance * 3;
  let result = "";

  if (itemType === "hp_potion_small" || itemType === "hp_potion_medium" || itemType === "hp_potion_large") {
    const heal = Math.floor(maxHp * (descriptor.effectValue / 100));
    fs.hp = Math.min(maxHp, fs.hp + heal);
    result = `+${String(heal)} HP`;
  } else if (itemType === "frenzy" || itemType === "fortress" || itemType === "speed_boost") {
    const stat = itemType === "frenzy" ? "attack" : itemType === "fortress" ? "defense" : "speed";
    fs.buffs.push({ stat, value: descriptor.effectValue, turnsRemaining: descriptor.turns });
    result = `+${String(descriptor.effectValue)} ${stat} por ${String(descriptor.turns)} turnos`;
  } else if (itemType === "swap_attack_speed" || itemType === "swap_defense_attack") {
    fs.buffs.push({
      stat: itemType === "swap_attack_speed" ? "attack" : "defense",
      value: 0,
      turnsRemaining: descriptor.turns,
      isSwap: true,
      targetStat: itemType === "swap_attack_speed" ? "speed" : "attack",
    });
    result = "Swap aplicado";
  }

  return {
    newState: { ...state, [fsKey]: fs },
    result,
  };
}
