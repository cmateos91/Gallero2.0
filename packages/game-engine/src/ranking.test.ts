import { describe, it, expect } from "vitest";
import { computeMmrDelta } from "./ranking.js";

describe("computeMmrDelta", () => {
  it("victoria simétrica → +12", () => {
    expect(computeMmrDelta(1000, 1000, "win")).toBe(12);
  });

  it("derrota simétrica → -12", () => {
    expect(computeMmrDelta(1000, 1000, "loss")).toBe(-12);
  });

  it("empate simétrico → 0", () => {
    expect(computeMmrDelta(1000, 1000, "draw")).toBe(0);
  });

  it("upset: jugador débil gana contra fuerte → delta grande positivo", () => {
    const delta = computeMmrDelta(800, 1200, "win");
    expect(delta).toBeGreaterThan(15);
    expect(delta).toBeLessThanOrEqual(24);
  });

  it("favorito pierde → delta grande negativo (~-22)", () => {
    expect(computeMmrDelta(1200, 800, "loss")).toBe(-22);
  });

  it("favorito gana → delta pequeño positivo (~2)", () => {
    expect(computeMmrDelta(1200, 800, "win")).toBe(2);
  });

  it("simetría: win(A,B) === -loss(B,A)", () => {
    expect(computeMmrDelta(1100, 900, "win")).toBe(-computeMmrDelta(900, 1100, "loss"));
  });

  it("retorna entero", () => {
    const delta = computeMmrDelta(1050, 980, "win");
    expect(Number.isInteger(delta)).toBe(true);
  });
});
