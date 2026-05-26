import { computeFightReward } from "./rewards.js";
import { createSeededRng, type PRNG } from "./combat.js";

export interface SimulationConfig {
  fightRewardWin: number;
  fightRewardLoss: number;
  featherDropsPerDay: number;
  eggPriceComun: number;
  eggPriceNormal: number;
  eggPriceRaro: number;
  eggPriceLegendario: number;
  fightsPerDay: number;
  winRate: number;
}

export interface DayResult {
  day: number;
  coinsEarned: number;
  coinsSpent: number;
  coinsNet: number;
  roostersBought: number;
  balance: number;
}

export interface LifetimeResult {
  days: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  totalRoostersBought: number;
  finalBalance: number;
  avgDailyBalance: number;
}

export function simulatePlayerDay(
  day: number,
  balance: number,
  config: SimulationConfig,
  rng: PRNG,
): DayResult {
  let coinsEarned = 0;
  let coinsSpent = 0;
  let roostersBought = 0;

  // Peleas del día
  for (let i = 0; i < config.fightsPerDay; i++) {
    const won = rng() < config.winRate;
    coinsEarned += won ? computeFightReward("win") : computeFightReward("loss");
  }

  // Plumas recogidas (~70% del máximo diario)
  const feathersCollected = Math.floor(config.featherDropsPerDay * (0.5 + rng() * 0.5));
  coinsEarned += feathersCollected;

  // Misiones diarias (50% probabilidad de completar cada una)
  if (rng() < 0.5) coinsEarned += 50; // WIN_2_FIGHTS
  if (rng() < 0.7) coinsEarned += 30; // FEED_3_TIMES
  if (rng() < 0.8) coinsEarned += 25; // TRAIN_ONCE

  // Gasto en huevos si tiene suficiente balance
  const currentBalance = balance + coinsEarned;
  if (currentBalance >= config.eggPriceComun && rng() < 0.3) {
    coinsSpent += config.eggPriceComun;
    roostersBought++;
  }

  return {
    day,
    coinsEarned,
    coinsSpent,
    coinsNet: coinsEarned - coinsSpent,
    roostersBought,
    balance: balance + coinsEarned - coinsSpent,
  };
}

export function simulatePlayerLifetime(
  days: number,
  config: SimulationConfig,
  seed = 0,
): LifetimeResult {
  const rng = createSeededRng(seed);
  let balance = 0;
  let totalCoinsEarned = 0;
  let totalCoinsSpent = 0;
  let totalRoostersBought = 0;
  let sumBalance = 0;

  for (let day = 1; day <= days; day++) {
    const result = simulatePlayerDay(day, balance, config, rng);
    balance = result.balance;
    totalCoinsEarned += result.coinsEarned;
    totalCoinsSpent += result.coinsSpent;
    totalRoostersBought += result.roostersBought;
    sumBalance += balance;
  }

  return {
    days,
    totalCoinsEarned,
    totalCoinsSpent,
    totalRoostersBought,
    finalBalance: balance,
    avgDailyBalance: Math.round(sumBalance / days),
  };
}
