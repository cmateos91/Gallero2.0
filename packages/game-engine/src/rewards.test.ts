import { describe, it, expect } from "vitest";
import { computeFightReward } from "./rewards.js";

describe("computeFightReward", () => {
  it("victoria → 30 monedas", () => {
    expect(computeFightReward("win")).toBe(30);
  });

  it("empate → 15 monedas", () => {
    expect(computeFightReward("draw")).toBe(15);
  });

  it("derrota → 10 monedas", () => {
    expect(computeFightReward("loss")).toBe(10);
  });
});
