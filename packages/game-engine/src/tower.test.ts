import { describe, it, expect } from "vitest";
import {
  generateTowerNpc,
  aiPickMoveTower,
  computeTowerFloorCoins,
} from "./tower.js";
import { initCombatState, createSeededRng } from "./combat.js";

describe("generateTowerNpc", () => {
  it("piso 5 → boss Polvorin AGRESIVO", () => {
    const npc = generateTowerNpc(5, 1);
    expect(npc.isBoss).toBe(true);
    expect(npc.name).toBe("Polvorin");
    expect(npc.nature).toBe("AGRESIVO");
  });

  it("piso 10 → boss Don Gallo EQUILIBRADO", () => {
    const npc = generateTowerNpc(10, 1);
    expect(npc.isBoss).toBe(true);
    expect(npc.name).toBe("Don Gallo");
    expect(npc.nature).toBe("EQUILIBRADO");
  });

  it("piso 3 (no boss) → isBoss=false", () => {
    const npc = generateTowerNpc(3, 1);
    expect(npc.isBoss).toBe(false);
  });

  it("boss stats > non-boss stats en el mismo piso aproximado", () => {
    const boss = generateTowerNpc(5, 1);
    const normal = generateTowerNpc(4, 1);
    const bossTotal = boss.attack + boss.defense + boss.speed + boss.resistance;
    const normalTotal = normal.attack + normal.defense + normal.speed + normal.resistance;
    expect(bossTotal).toBeGreaterThan(normalTotal);
  });

  it("determinístico: misma seed y piso → mismo NPC", () => {
    const npc1 = generateTowerNpc(7, 42);
    const npc2 = generateTowerNpc(7, 42);
    expect(npc1).toEqual(npc2);
  });

  it("diferente seed → diferente naturaleza (probabilístico)", () => {
    const npcs = Array.from({ length: 20 }, (_, i) => generateTowerNpc(3, i * 1000));
    const natures = new Set(npcs.map((n) => n.nature));
    expect(natures.size).toBeGreaterThan(1);
  });

  it("stats aumentan con el piso", () => {
    const npc1 = generateTowerNpc(1, 1);
    const npc10 = generateTowerNpc(9, 1);
    const total1 = npc1.attack + npc1.defense + npc1.speed + npc1.resistance;
    const total10 = npc10.attack + npc10.defense + npc10.speed + npc10.resistance;
    expect(total10).toBeGreaterThan(total1);
  });

  it("pisos >10: boss rotativo (no es Polvorin ni Don Gallo)", () => {
    const npc = generateTowerNpc(15, 1);
    expect(npc.isBoss).toBe(true);
    expect(["Sombra", "Volcan", "Muralla", "Titan", "Tormenta", "Fenix"]).toContain(npc.name);
  });

  it("todos los stats son enteros positivos", () => {
    for (let floor = 1; floor <= 20; floor++) {
      const npc = generateTowerNpc(floor, 1);
      expect(npc.attack).toBeGreaterThan(0);
      expect(npc.defense).toBeGreaterThan(0);
      expect(npc.speed).toBeGreaterThan(0);
      expect(npc.resistance).toBeGreaterThan(0);
      expect(Number.isInteger(npc.attack)).toBe(true);
    }
  });
});

describe("computeTowerFloorCoins", () => {
  it("piso 1 (no boss) → 7 monedas", () => {
    expect(computeTowerFloorCoins(1)).toBe(7);
  });

  it("piso 2 → 9 monedas", () => {
    expect(computeTowerFloorCoins(2)).toBe(9);
  });

  it("piso 5 (boss) → floor(15 * 1.5) = 22", () => {
    expect(computeTowerFloorCoins(5)).toBe(22);
  });

  it("piso 10 (boss) → floor(25 * 1.5) = 37", () => {
    expect(computeTowerFloorCoins(10)).toBe(37);
  });

  it("boss siempre da más que el piso anterior", () => {
    for (let f = 5; f <= 20; f += 5) {
      expect(computeTowerFloorCoins(f)).toBeGreaterThan(computeTowerFloorCoins(f - 1));
    }
  });
});

describe("aiPickMoveTower", () => {
  it("retorna un movimiento válido", () => {
    const valid = ["atacar", "defender", "esquivar", "huir", "usar_objeto"];
    for (let i = 0; i < 20; i++) {
      let c = i;
      const rng = () => ((c++ * 0.137) % 1);
      expect(valid).toContain(aiPickMoveTower(3, [], "AGRESIVO", rng));
    }
  });

  it("con energía < 30 → predomina defender (override)", () => {
    const state = initCombatState(
      { attack: 10, defense: 10, speed: 10, resistance: 10, careMultiplier: 1, bondMultiplier: 1 },
      { attack: 10, defense: 10, speed: 10, resistance: 10, careMultiplier: 1, bondMultiplier: 1 },
    );
    const lowEnergyState = { ...state, fighterA: { ...state.fighterA, energy: 20 } };
    const rng = createSeededRng(1);
    const moves = Array.from({ length: 20 }, () => aiPickMoveTower(3, [], "AGRESIVO", rng, lowEnergyState));
    const defendCount = moves.filter((m) => m === "defender").length;
    expect(defendCount).toBeGreaterThan(8);
  });
});
