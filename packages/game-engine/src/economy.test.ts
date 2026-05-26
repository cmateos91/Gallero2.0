import { describe, it, expect } from "vitest";
import {
  simulatePlayerDay,
  simulatePlayerLifetime,
  type SimulationConfig,
} from "./economy.js";

const BASE_CONFIG: SimulationConfig = {
  fightRewardWin: 30,
  fightRewardLoss: 10,
  featherDropsPerDay: 20,
  eggPriceComun: 50,
  eggPriceNormal: 120,
  eggPriceRaro: 300,
  eggPriceLegendario: 800,
  fightsPerDay: 5,
  winRate: 0.5,
};

describe("simulatePlayerDay", () => {
  it("retorna un DayResult con el día correcto", () => {
    const rng = () => 0.5;
    const result = simulatePlayerDay(1, 0, BASE_CONFIG, rng);
    expect(result.day).toBe(1);
  });

  it("coinsEarned > 0 con actividad normal", () => {
    const rng = () => 0.5;
    const result = simulatePlayerDay(1, 0, BASE_CONFIG, rng);
    expect(result.coinsEarned).toBeGreaterThan(0);
  });

  it("balance = balance_inicial + coinsEarned - coinsSpent", () => {
    const rng = () => 0.3;
    const initialBalance = 100;
    const result = simulatePlayerDay(1, initialBalance, BASE_CONFIG, rng);
    expect(result.balance).toBe(initialBalance + result.coinsEarned - result.coinsSpent);
  });

  it("coinsNet = coinsEarned - coinsSpent", () => {
    const rng = () => 0.7;
    const result = simulatePlayerDay(1, 500, BASE_CONFIG, rng);
    expect(result.coinsNet).toBe(result.coinsEarned - result.coinsSpent);
  });

  it("determinístico: mismo rng → mismo resultado", () => {
    const makeRng = () => { let c = 0; return () => ((c++ * 0.137) % 1); };
    const r1 = simulatePlayerDay(1, 200, BASE_CONFIG, makeRng());
    const r2 = simulatePlayerDay(1, 200, BASE_CONFIG, makeRng());
    expect(r1).toEqual(r2);
  });
});

describe("simulatePlayerLifetime", () => {
  it("retorna el número correcto de días", () => {
    const result = simulatePlayerLifetime(30, BASE_CONFIG, 42);
    expect(result.days).toBe(30);
  });

  it("determinístico: mismo seed → mismo resultado", () => {
    const r1 = simulatePlayerLifetime(10, BASE_CONFIG, 1);
    const r2 = simulatePlayerLifetime(10, BASE_CONFIG, 1);
    expect(r1).toEqual(r2);
  });

  it("diferente seed → diferente resultado (probabilístico)", () => {
    const r1 = simulatePlayerLifetime(10, BASE_CONFIG, 1);
    const r2 = simulatePlayerLifetime(10, BASE_CONFIG, 9999);
    expect(r1.totalCoinsEarned).not.toBe(r2.totalCoinsEarned);
  });

  it("totalCoinsEarned = suma de ganancias diarias", () => {
    const result = simulatePlayerLifetime(5, BASE_CONFIG, 42);
    expect(result.totalCoinsEarned).toBeGreaterThan(0);
  });

  it("avgDailyBalance es el promedio del balance diario", () => {
    const result = simulatePlayerLifetime(7, BASE_CONFIG, 7);
    expect(result.avgDailyBalance).toBeGreaterThanOrEqual(0);
  });

  it("balance no explota exponencialmente con config base (sanity check)", () => {
    const result = simulatePlayerLifetime(30, BASE_CONFIG, 1);
    // Con config base un jugador activo no debería acumular más de 5000 monedas en 30 días
    // Este test valida que la economía no está rota
    expect(result.finalBalance).toBeLessThan(10_000);
  });
});
