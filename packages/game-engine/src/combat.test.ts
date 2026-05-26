import { describe, it, expect } from "vitest";
import {
  ENERGY_MAX,
  ENERGY_START,
  ENERGY_ATTACK_COST,
  ENERGY_DEFEND_RECOVER,
  ENERGY_DODGE_COST,
  createSeededRng,
  initCombatState,
  resolveTurn,
  aiPickMove,
  applyCombatItem,
  type Fighter,
  type CombatState,
} from "./combat.js";

function makeFighter(overrides: Partial<Fighter> = {}): Fighter {
  return {
    attack: 20,
    defense: 15,
    speed: 15,
    resistance: 20,
    careMultiplier: 1.0,
    bondMultiplier: 1.0,
    ...overrides,
  };
}

describe("constantes", () => {
  it("ENERGY_MAX = 100", () => expect(ENERGY_MAX).toBe(100));
  it("ENERGY_START = 50", () => expect(ENERGY_START).toBe(50));
  it("ENERGY_ATTACK_COST = 30", () => expect(ENERGY_ATTACK_COST).toBe(30));
  it("ENERGY_DEFEND_RECOVER = 25", () => expect(ENERGY_DEFEND_RECOVER).toBe(25));
  it("ENERGY_DODGE_COST = 10", () => expect(ENERGY_DODGE_COST).toBe(10));
});

describe("createSeededRng", () => {
  it("misma seed → misma secuencia", () => {
    const rng1 = createSeededRng(42);
    const rng2 = createSeededRng(42);
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("diferente seed → diferente secuencia", () => {
    const rng1 = createSeededRng(1);
    const rng2 = createSeededRng(2);
    const vals1 = Array.from({ length: 5 }, () => rng1());
    const vals2 = Array.from({ length: 5 }, () => rng2());
    expect(vals1).not.toEqual(vals2);
  });

  it("retorna valores en [0, 1)", () => {
    const rng = createSeededRng(99);
    for (let i = 0; i < 20; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("initCombatState", () => {
  it("HP = resistance * 3", () => {
    const a = makeFighter({ resistance: 20 });
    const b = makeFighter({ resistance: 15 });
    const state = initCombatState(a, b);
    expect(state.fighterA.hp).toBe(60);
    expect(state.fighterB.hp).toBe(45);
  });

  it("energía inicial = ENERGY_START", () => {
    const state = initCombatState(makeFighter(), makeFighter());
    expect(state.fighterA.energy).toBe(ENERGY_START);
    expect(state.fighterB.energy).toBe(ENERGY_START);
  });

  it("estado inicial: isOver=false, winner=null, turnsCount=0", () => {
    const state = initCombatState(makeFighter(), makeFighter());
    expect(state.isOver).toBe(false);
    expect(state.winner).toBeNull();
    expect(state.turnsCount).toBe(0);
  });

  it("buffs iniciales vacíos", () => {
    const state = initCombatState(makeFighter(), makeFighter());
    expect(state.fighterA.buffs).toHaveLength(0);
    expect(state.fighterB.buffs).toHaveLength(0);
  });
});

describe("resolveTurn — atacar vs atacar", () => {
  it("ambos atacan → HP baja en ambos", () => {
    const a = makeFighter();
    const b = makeFighter();
    const state = initCombatState(a, b);
    const rng = createSeededRng(1);
    const { state: next } = resolveTurn(state, a, b, "atacar", "atacar", rng);
    expect(next.fighterA.hp).toBeLessThan(state.fighterA.hp);
    expect(next.fighterB.hp).toBeLessThan(state.fighterB.hp);
  });

  it("atacar consume ENERGY_ATTACK_COST de energía", () => {
    const a = makeFighter();
    const b = makeFighter();
    const state = initCombatState(a, b);
    const rng = createSeededRng(1);
    const { state: next } = resolveTurn(state, a, b, "atacar", "defender", rng);
    expect(next.fighterA.energy).toBe(ENERGY_START - ENERGY_ATTACK_COST);
  });

  it("mismo seed → mismo resultado determinístico", () => {
    const a = makeFighter();
    const b = makeFighter();
    const { state: s1 } = resolveTurn(initCombatState(a, b), a, b, "atacar", "atacar", createSeededRng(7));
    const { state: s2 } = resolveTurn(initCombatState(a, b), a, b, "atacar", "atacar", createSeededRng(7));
    expect(s1.fighterA.hp).toBe(s2.fighterA.hp);
    expect(s1.fighterB.hp).toBe(s2.fighterB.hp);
  });

  it("turnsCount aumenta en 1", () => {
    const a = makeFighter();
    const b = makeFighter();
    const state = initCombatState(a, b);
    const { state: next } = resolveTurn(state, a, b, "atacar", "atacar", createSeededRng(1));
    expect(next.turnsCount).toBe(1);
  });
});

describe("resolveTurn — ataque débil (energía < 30)", () => {
  it("daño con energía plena > daño con energía baja", () => {
    const a = makeFighter({ attack: 30 });
    const b = makeFighter({ defense: 5 });

    const stateNormal = initCombatState(a, b);
    const rng1 = createSeededRng(5);
    const { turnResult: r1 } = resolveTurn(stateNormal, a, b, "atacar", "defender", rng1);

    // Estado con energía baja (<30)
    const stateLow = {
      ...initCombatState(a, b),
      fighterA: { ...initCombatState(a, b).fighterA, energy: 20 },
    };
    const rng2 = createSeededRng(5);
    const { turnResult: r2 } = resolveTurn(stateLow, a, b, "atacar", "defender", rng2);

    expect(r1.damageB).toBeGreaterThan(r2.damageB);
  });
});

describe("resolveTurn — defender", () => {
  it("defender recupera ENERGY_DEFEND_RECOVER", () => {
    const a = makeFighter();
    const b = makeFighter();
    const state = {
      ...initCombatState(a, b),
      fighterB: { ...initCombatState(a, b).fighterB, energy: 20 },
    };
    const rng = createSeededRng(1);
    const { state: next } = resolveTurn(state, a, b, "atacar", "defender", rng);
    expect(next.fighterB.energy).toBeGreaterThanOrEqual(20);
  });

  it("defensor recibe menos daño que si no defiende", () => {
    const a = makeFighter({ attack: 40 });
    const b = makeFighter({ defense: 10 });
    const init = initCombatState(a, b);

    const { turnResult: withDefend } = resolveTurn(init, a, b, "atacar", "defender", createSeededRng(3));
    const { turnResult: withAttack } = resolveTurn(init, a, b, "atacar", "atacar", createSeededRng(3));

    expect(withDefend.damageB).toBeLessThan(withAttack.damageB);
  });
});

describe("resolveTurn — huir", () => {
  it("huir termina el combate", () => {
    const a = makeFighter();
    const b = makeFighter();
    const state = initCombatState(a, b);
    const { state: next, turnResult } = resolveTurn(state, a, b, "huir", "atacar", createSeededRng(1));
    expect(next.isOver).toBe(true);
    expect(turnResult.isOver).toBe(true);
  });
});

describe("resolveTurn — combate completo no hace loop infinito", () => {
  it("un combate termina en menos de 100 turnos", () => {
    const a = makeFighter({ attack: 25, resistance: 10 });
    const b = makeFighter({ attack: 20, resistance: 10 });
    let state = initCombatState(a, b);
    const rng = createSeededRng(42);
    let turns = 0;
    while (!state.isOver && turns < 100) {
      ({ state } = resolveTurn(state, a, b, "atacar", "atacar", rng));
      turns++;
    }
    expect(state.isOver).toBe(true);
  });
});

describe("aiPickMove", () => {
  it("retorna un movimiento válido", () => {
    const valid = ["atacar", "defender", "esquivar", "huir", "usar_objeto"];
    const rng = createSeededRng(1);
    for (let i = 0; i < 20; i++) {
      expect(valid).toContain(aiPickMove(rng));
    }
  });
});

describe("applyCombatItem — pociones HP", () => {
  it("hp_potion_small cura 25% del HP máximo", () => {
    const a = makeFighter({ resistance: 20 }); // maxHP = 60
    const b = makeFighter();
    const state = {
      ...initCombatState(a, b),
      fighterA: { ...initCombatState(a, b).fighterA, hp: 30 }, // mitad de HP
    };
    const { newState } = applyCombatItem("hp_potion_small", state, 0, a);
    const healed = newState.fighterA.hp - 30;
    expect(healed).toBeCloseTo(60 * 0.25, 0); // +15 HP
  });

  it("hp_potion_large cura HP completo", () => {
    const a = makeFighter({ resistance: 20 });
    const b = makeFighter();
    const maxHp = a.resistance * 3;
    const state = {
      ...initCombatState(a, b),
      fighterA: { ...initCombatState(a, b).fighterA, hp: 1 },
    };
    const { newState } = applyCombatItem("hp_potion_large", state, 0, a);
    expect(newState.fighterA.hp).toBe(maxHp);
  });

  it("HP no supera el máximo (resistance * 3)", () => {
    const a = makeFighter({ resistance: 20 });
    const b = makeFighter();
    const state = initCombatState(a, b); // HP ya está al máximo
    const { newState } = applyCombatItem("hp_potion_small", state, 0, a);
    expect(newState.fighterA.hp).toBeLessThanOrEqual(a.resistance * 3);
  });
});
