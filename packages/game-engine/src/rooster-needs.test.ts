import { describe, it, expect } from "vitest";
import {
  HUNGER_DECAY_PER_HOUR,
  THIRST_DECAY_PER_HOUR,
  HUNGER_PER_FEED,
  THIRST_PER_DRINK,
  CARE_DECAY_PER_HOUR,
  DEAD_RESCUE_WINDOW_MS,
  GROWTH_MIN_RESOURCE,
  computeGrowthPerHour,
  getRoosterNeedSnapshot,
  getProjectedRoosterGrowth,
  getTimeToEvolution,
  type Rooster,
} from "./rooster-needs.js";

// Helper para construir un Rooster de test
function makeRooster(overrides: Partial<Rooster> = {}): Rooster {
  return {
    stage: "ADULTO",
    nature: "EQUILIBRADO",
    quality: "Común",
    attack: 15,
    defense: 15,
    speed: 15,
    resistance: 15,
    careCurrent: 50,
    bondPoints: 0,
    hunger: 100,
    thirst: 100,
    growthProgress: 100,
    updatedAt: new Date(0).toISOString(),
    hatchReadyAt: null,
    diedAt: null,
    ...overrides,
  };
}

const NOW = 3_600_000; // 1 hora después del epoch

describe("constantes", () => {
  it("HUNGER_DECAY_PER_HOUR = 4", () => expect(HUNGER_DECAY_PER_HOUR).toBe(4));
  it("THIRST_DECAY_PER_HOUR = 8", () => expect(THIRST_DECAY_PER_HOUR).toBe(8));
  it("HUNGER_PER_FEED = 20", () => expect(HUNGER_PER_FEED).toBe(20));
  it("THIRST_PER_DRINK = 25", () => expect(THIRST_PER_DRINK).toBe(25));
  it("CARE_DECAY_PER_HOUR = 0.5", () => expect(CARE_DECAY_PER_HOUR).toBe(0.5));
  it("DEAD_RESCUE_WINDOW_MS = 7 días", () => expect(DEAD_RESCUE_WINDOW_MS).toBe(7 * 24 * 60 * 60 * 1000));
  it("GROWTH_MIN_RESOURCE = 50", () => expect(GROWTH_MIN_RESOURCE).toBe(50));
});

describe("computeGrowthPerHour", () => {
  it("avgStats=0 → clamp máximo 8.0", () => {
    expect(computeGrowthPerHour(0)).toBe(8.0);
  });

  it("avgStats=5 → ~6.0 (dentro del rango)", () => {
    const val = computeGrowthPerHour(5);
    expect(val).toBeGreaterThan(5.5);
    expect(val).toBeLessThan(6.5);
  });

  it("avgStats=50 → clamp mínimo 1.5", () => {
    expect(computeGrowthPerHour(50)).toBe(1.5);
  });

  it("avgStats=100 → clamp mínimo 1.5", () => {
    expect(computeGrowthPerHour(100)).toBe(1.5);
  });

  it("monotónicamente decreciente (mayor stats → menor growth)", () => {
    expect(computeGrowthPerHour(10)).toBeGreaterThan(computeGrowthPerHour(20));
  });
});

describe("getRoosterNeedSnapshot — salud perfecta", () => {
  it("hunger=100, thirst=100, sin tiempo transcurrido → health=100", () => {
    const rooster = makeRooster({ updatedAt: new Date(NOW).toISOString() });
    const snap = getRoosterNeedSnapshot(rooster, NOW);
    expect(snap.hungerValue).toBe(0);
    expect(snap.thirstValue).toBe(0);
    expect(snap.healthValue).toBe(100);
  });

  it("tras 1 hora: hunger decae 4, thirst decae 8", () => {
    const rooster = makeRooster({ updatedAt: new Date(NOW).toISOString() });
    const snap = getRoosterNeedSnapshot(rooster, NOW + 3_600_000);
    expect(snap.hungerValue).toBeCloseTo(4, 1);
    expect(snap.thirstValue).toBeCloseTo(8, 1);
  });
});

describe("getRoosterNeedSnapshot — sistema dual-need", () => {
  it("solo hambre (thirst=100, hunger=0) → isDead=false en proyección", () => {
    const rooster = makeRooster({ hunger: 0, thirst: 100, updatedAt: new Date(NOW).toISOString() });
    const snap = getRoosterNeedSnapshot(rooster, NOW);
    // hungerValue=100, thirstValue=0 → dualPenalty=0 → health no llega a 0
    expect(snap.healthValue).toBeGreaterThan(0);
  });

  it("solo sed (hunger=100, thirst=0) → isDead=false en proyección", () => {
    const rooster = makeRooster({ hunger: 100, thirst: 0, updatedAt: new Date(NOW).toISOString() });
    const snap = getRoosterNeedSnapshot(rooster, NOW);
    expect(snap.healthValue).toBeGreaterThan(0);
  });

  it("ambas al mínimo (hunger=0, thirst=0) → healthValue=0", () => {
    const rooster = makeRooster({ hunger: 0, thirst: 0, updatedAt: new Date(NOW).toISOString() });
    const snap = getRoosterNeedSnapshot(rooster, NOW);
    expect(snap.healthValue).toBeLessThanOrEqual(0);
  });

  it("valores no bajan de 0 (clamped)", () => {
    const rooster = makeRooster({ hunger: 0, thirst: 0, updatedAt: new Date(0).toISOString() });
    const snap = getRoosterNeedSnapshot(rooster, NOW + 100 * 3_600_000);
    expect(snap.hungerValue).toBeLessThanOrEqual(100);
    expect(snap.thirstValue).toBeLessThanOrEqual(100);
  });
});

describe("getProjectedRoosterGrowth", () => {
  it("ADULTO: isDead=false con valores normales", () => {
    const rooster = makeRooster({ updatedAt: new Date(NOW).toISOString() });
    const proj = getProjectedRoosterGrowth(rooster, NOW);
    expect(proj.isDead).toBe(false);
    expect(proj.stage).toBe("ADULTO");
    expect(proj.growthProgress).toBe(100);
  });

  it("ADULTO con ambas necesidades en 0 → isDead=true", () => {
    const rooster = makeRooster({
      hunger: 0,
      thirst: 0,
      updatedAt: new Date(NOW).toISOString(),
    });
    const proj = getProjectedRoosterGrowth(rooster, NOW);
    expect(proj.isDead).toBe(true);
  });

  it("POLLO con buenas necesidades → growthProgress aumenta con el tiempo", () => {
    const rooster = makeRooster({
      stage: "POLLO",
      growthProgress: 0,
      hunger: 100,
      thirst: 100,
      updatedAt: new Date(NOW).toISOString(),
    });
    const proj = getProjectedRoosterGrowth(rooster, NOW + 5 * 3_600_000);
    expect(proj.growthProgress).toBeGreaterThan(0);
    expect(proj.growthProgress).toBeLessThanOrEqual(100);
  });

  it("POLLO que alcanza 100 de growthProgress → stage=ADULTO", () => {
    // avgStats=10 → computeGrowthPerHour ≈ 3.9/h. Desde 90 se necesitan ~3h para llegar a 100.
    const rooster = makeRooster({
      stage: "POLLO",
      growthProgress: 90,
      attack: 10,
      defense: 10,
      speed: 10,
      resistance: 10,
      hunger: 100,
      thirst: 100,
      updatedAt: new Date(NOW).toISOString(),
    });
    const proj = getProjectedRoosterGrowth(rooster, NOW + 4 * 3_600_000);
    expect(proj.stage).toBe("ADULTO");
    expect(proj.growthProgress).toBe(100);
  });

  it("POLLO con necesidades bajas (< 50) → no crece", () => {
    const rooster = makeRooster({
      stage: "POLLO",
      growthProgress: 20,
      hunger: 30,
      thirst: 30,
      updatedAt: new Date(NOW).toISOString(),
    });
    const proj = getProjectedRoosterGrowth(rooster, NOW + 3_600_000);
    expect(proj.growthProgress).toBe(20);
  });
});

describe("getTimeToEvolution", () => {
  it("ADULTO → null", () => {
    const rooster = makeRooster({ stage: "ADULTO", updatedAt: new Date(NOW).toISOString() });
    expect(getTimeToEvolution(rooster, NOW)).toBeNull();
  });

  it("HUEVO → null", () => {
    const rooster = makeRooster({ stage: "HUEVO", updatedAt: new Date(NOW).toISOString() });
    expect(getTimeToEvolution(rooster, NOW)).toBeNull();
  });

  it("POLLO con buenas necesidades → retorna ms positivos", () => {
    const rooster = makeRooster({
      stage: "POLLO",
      growthProgress: 0,
      attack: 10, defense: 10, speed: 10, resistance: 10,
      hunger: 100,
      thirst: 100,
      updatedAt: new Date(NOW).toISOString(),
    });
    const ms = getTimeToEvolution(rooster, NOW);
    expect(ms).not.toBeNull();
    expect(ms!).toBeGreaterThan(0);
  });

  it("POLLO ya en growthProgress=100 → 0 o null (ya evolucionó)", () => {
    const rooster = makeRooster({
      stage: "POLLO",
      growthProgress: 100,
      hunger: 100,
      thirst: 100,
      updatedAt: new Date(NOW).toISOString(),
    });
    const ms = getTimeToEvolution(rooster, NOW);
    expect(ms === null || ms === 0).toBe(true);
  });
});
