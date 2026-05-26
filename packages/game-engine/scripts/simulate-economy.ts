import { simulatePlayerLifetime, type SimulationConfig } from "../src/economy.js";

const BASE: SimulationConfig = {
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

const PROFILES: { name: string; config: SimulationConfig }[] = [
  {
    name: "Casual (3 peleas/día, 40% winrate)",
    config: { ...BASE, fightsPerDay: 3, winRate: 0.4, featherDropsPerDay: 10 },
  },
  {
    name: "Activo (5 peleas/día, 50% winrate)",
    config: { ...BASE },
  },
  {
    name: "Hardcore (10 peleas/día, 60% winrate)",
    config: { ...BASE, fightsPerDay: 10, winRate: 0.6, featherDropsPerDay: 40 },
  },
];

const DAYS = 30;
const INFLATION_THRESHOLD = 8_000;

console.log(`\n=== Simulación de Economía — ${String(DAYS)} días ===\n`);

for (const profile of PROFILES) {
  const result = simulatePlayerLifetime(DAYS, profile.config, 42);

  const status =
    result.finalBalance < 0
      ? "⚠ DEFLACIÓN"
      : result.finalBalance > INFLATION_THRESHOLD
        ? "⚠ INFLACIÓN"
        : "✓ OK";

  console.log(`[${profile.name}]`);
  console.log(`  Balance final:     ${String(result.finalBalance)} monedas  ${status}`);
  console.log(`  Total ganado:      ${String(result.totalCoinsEarned)} monedas`);
  console.log(`  Total gastado:     ${String(result.totalCoinsSpent)} monedas`);
  console.log(`  Gallos comprados:  ${String(result.totalRoostersBought)}`);
  console.log(`  Balance medio/día: ${String(result.avgDailyBalance)} monedas`);
  console.log();
}
