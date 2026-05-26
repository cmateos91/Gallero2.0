import { describe, it, expect } from "vitest";
import {
  NATURE_DELTAS,
  CARE_DECAY_INTERVAL_MS,
  computeCareMultiplier,
  computeBondMultiplier,
  trainCareCost,
  getNatureDeltas,
  randomNature,
} from "./care.js";

describe("CARE_DECAY_INTERVAL_MS", () => {
  it("es 2 horas en ms", () => {
    expect(CARE_DECAY_INTERVAL_MS).toBe(7_200_000);
  });
});

describe("NATURE_DELTAS", () => {
  it("AGRESIVO: +3 ATK, +1 DEF, +1 SPD, +0 RES (total 5)", () => {
    const d = NATURE_DELTAS.AGRESIVO;
    expect(d).toEqual({ attack: 3, defense: 1, speed: 1, resistance: 0 });
  });

  it("DEFENSIVO: +0 ATK, +3 DEF, +1 SPD, +1 RES (total 5)", () => {
    const d = NATURE_DELTAS.DEFENSIVO;
    expect(d).toEqual({ attack: 0, defense: 3, speed: 1, resistance: 1 });
  });

  it("VELOZ: +1 ATK, +0 DEF, +3 SPD, +1 RES (total 5)", () => {
    const d = NATURE_DELTAS.VELOZ;
    expect(d).toEqual({ attack: 1, defense: 0, speed: 3, resistance: 1 });
  });

  it("ROBUSTO: +1 ATK, +1 DEF, +0 SPD, +3 RES (total 5)", () => {
    const d = NATURE_DELTAS.ROBUSTO;
    expect(d).toEqual({ attack: 1, defense: 1, speed: 0, resistance: 3 });
  });

  it("EQUILIBRADO: +1 ATK, +1 DEF, +1 SPD, +1 RES (total 4)", () => {
    const d = NATURE_DELTAS.EQUILIBRADO;
    expect(d).toEqual({ attack: 1, defense: 1, speed: 1, resistance: 1 });
  });

  it("todos excepto EQUILIBRADO suman 5 stats totales", () => {
    for (const nature of ["AGRESIVO", "DEFENSIVO", "VELOZ", "ROBUSTO"] as const) {
      const d = NATURE_DELTAS[nature];
      const total = d.attack + d.defense + d.speed + d.resistance;
      expect(total, `${nature} debe sumar 5`).toBe(5);
    }
  });
});

describe("computeCareMultiplier", () => {
  it("care=0 → 0.70", () => {
    expect(computeCareMultiplier(0)).toBeCloseTo(0.70, 5);
  });

  it("care=50 → 0.90", () => {
    expect(computeCareMultiplier(50)).toBeCloseTo(0.90, 5);
  });

  it("care=100 → 1.10", () => {
    expect(computeCareMultiplier(100)).toBeCloseTo(1.10, 5);
  });

  it("no excede 1.10 con care > 100", () => {
    expect(computeCareMultiplier(200)).toBe(1.10);
  });

  it("no baja de 0.70 con care < 0", () => {
    expect(computeCareMultiplier(-50)).toBe(0.70);
  });
});

describe("computeBondMultiplier", () => {
  it("0 puntos → 1.00", () => { expect(computeBondMultiplier(0)).toBe(1.00); });
  it("99 puntos → 1.00", () => { expect(computeBondMultiplier(99)).toBe(1.00); });
  it("100 puntos → 1.01", () => { expect(computeBondMultiplier(100)).toBe(1.01); });
  it("249 puntos → 1.01", () => { expect(computeBondMultiplier(249)).toBe(1.01); });
  it("250 puntos → 1.02", () => { expect(computeBondMultiplier(250)).toBe(1.02); });
  it("499 puntos → 1.02", () => { expect(computeBondMultiplier(499)).toBe(1.02); });
  it("500 puntos → 1.03", () => { expect(computeBondMultiplier(500)).toBe(1.03); });
  it("1000 puntos → 1.03", () => { expect(computeBondMultiplier(1000)).toBe(1.03); });
});

describe("trainCareCost", () => {
  it("avgStats 17 → 5", () => { expect(trainCareCost(17)).toBe(5); });
  it("avgStats 18 → 8", () => { expect(trainCareCost(18)).toBe(8); });
  it("avgStats 25 → 8", () => { expect(trainCareCost(25)).toBe(8); });
  it("avgStats 26 → 12", () => { expect(trainCareCost(26)).toBe(12); });
  it("avgStats 34 → 12", () => { expect(trainCareCost(34)).toBe(12); });
  it("avgStats 35 → 18", () => { expect(trainCareCost(35)).toBe(18); });
  it("avgStats 44 → 18", () => { expect(trainCareCost(44)).toBe(18); });
  it("avgStats 45 → 25", () => { expect(trainCareCost(45)).toBe(25); });
  it("avgStats 60 → 25", () => { expect(trainCareCost(60)).toBe(25); });
});

describe("getNatureDeltas", () => {
  it("retorna los mismos datos que NATURE_DELTAS", () => {
    for (const nature of ["AGRESIVO", "DEFENSIVO", "VELOZ", "ROBUSTO", "EQUILIBRADO"] as const) {
      expect(getNatureDeltas(nature)).toEqual(NATURE_DELTAS[nature]);
    }
  });
});

describe("randomNature", () => {
  it("retorna una naturaleza válida", () => {
    const valid = ["AGRESIVO", "DEFENSIVO", "VELOZ", "ROBUSTO", "EQUILIBRADO"];
    for (let i = 0; i < 20; i++) {
      expect(valid).toContain(randomNature());
    }
  });

  it("acepta un PRNG determinístico", () => {
    let call = 0;
    const fakeRng = () => [0.1, 0.3, 0.5, 0.7, 0.9][call++ % 5];
    const results = Array.from({ length: 5 }, () => randomNature(fakeRng));
    expect(results.every((n) => ["AGRESIVO", "DEFENSIVO", "VELOZ", "ROBUSTO", "EQUILIBRADO"].includes(n))).toBe(true);
  });
});
