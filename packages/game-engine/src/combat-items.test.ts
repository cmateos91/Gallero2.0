import { describe, it, expect } from "vitest";
import { COMBAT_ITEM_CATALOG, findCombatItemDescriptor } from "./combat-items.js";

describe("COMBAT_ITEM_CATALOG", () => {
  it("tiene exactamente 8 items", () => {
    expect(COMBAT_ITEM_CATALOG).toHaveLength(8);
  });

  it("todos los IDs son únicos", () => {
    const ids = COMBAT_ITEM_CATALOG.map((i) => i.id);
    expect(new Set(ids).size).toBe(8);
  });

  it("contiene los 3 tipos de pociones HP", () => {
    const ids = COMBAT_ITEM_CATALOG.map((i) => i.id);
    expect(ids).toContain("hp_potion_small");
    expect(ids).toContain("hp_potion_medium");
    expect(ids).toContain("hp_potion_large");
  });

  it("contiene los 3 buffs de stat", () => {
    const ids = COMBAT_ITEM_CATALOG.map((i) => i.id);
    expect(ids).toContain("frenzy");
    expect(ids).toContain("fortress");
    expect(ids).toContain("speed_boost");
  });

  it("contiene los 2 swaps", () => {
    const ids = COMBAT_ITEM_CATALOG.map((i) => i.id);
    expect(ids).toContain("swap_attack_speed");
    expect(ids).toContain("swap_defense_attack");
  });

  it("todos tienen price > 0", () => {
    expect(COMBAT_ITEM_CATALOG.every((i) => i.price > 0)).toBe(true);
  });

  it("todos tienen name y description no vacíos", () => {
    expect(COMBAT_ITEM_CATALOG.every((i) => i.name.length > 0 && i.description.length > 0)).toBe(true);
  });

  it("pociones HP: effectValue representa porcentaje de cura (25/50/100)", () => {
    const small = COMBAT_ITEM_CATALOG.find((i) => i.id === "hp_potion_small")!;
    const medium = COMBAT_ITEM_CATALOG.find((i) => i.id === "hp_potion_medium")!;
    const large = COMBAT_ITEM_CATALOG.find((i) => i.id === "hp_potion_large")!;
    expect(small.effectValue).toBe(25);
    expect(medium.effectValue).toBe(50);
    expect(large.effectValue).toBe(100);
  });
});

describe("findCombatItemDescriptor", () => {
  it("retorna el item correcto para un ID válido", () => {
    const item = findCombatItemDescriptor("frenzy");
    expect(item).toBeDefined();
    expect(item!.id).toBe("frenzy");
  });

  it("retorna undefined para un ID inexistente", () => {
    // @ts-expect-error — test intencional de ID inválido
    expect(findCombatItemDescriptor("no_existe")).toBeUndefined();
  });
});
