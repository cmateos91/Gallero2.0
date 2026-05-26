// version
export { GAME_ENGINE_VERSION } from "./version.js";

// ranking
export type { MmrResult } from "./ranking.js";
export { MMR_K, computeMmrDelta } from "./ranking.js";

// rewards
export { computeFightReward } from "./rewards.js";

// missions
export type { DailyMission, StreakBonus } from "./missions.js";
export {
  DAILY_MISSIONS,
  STREAK_BONUSES,
  getStreakBonus,
  todayUtc,
  yesterdayUtc,
} from "./missions.js";

// care
export type { RoosterNature, NatureDeltas } from "./care.js";
export {
  CARE_DECAY_INTERVAL_MS,
  NATURE_DELTAS,
  randomNature,
  computeCareMultiplier,
  computeBondMultiplier,
  trainCareCost,
  getNatureDeltas,
} from "./care.js";

// combat-items
export type { CombatItemType, CombatItemDescriptor } from "./combat-items.js";
export { COMBAT_ITEM_CATALOG, findCombatItemDescriptor } from "./combat-items.js";

// rooster-needs
export type {
  RoosterStage,
  RoosterQuality,
  Rooster,
  RoosterNeedSnapshot,
  RoosterGrowthProjection,
} from "./rooster-needs.js";
export {
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
} from "./rooster-needs.js";

// combat
export type {
  CombatMove,
  PRNG,
  CombatBuff,
  Fighter,
  CombatFighterState,
  CombatState,
  TurnResult,
} from "./combat.js";
export {
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
} from "./combat.js";

// tower
export type { TowerNpc } from "./tower.js";
export { generateTowerNpc, aiPickMoveTower, computeTowerFloorCoins } from "./tower.js";

// economy
export type { SimulationConfig, DayResult, LifetimeResult } from "./economy.js";
export { simulatePlayerDay, simulatePlayerLifetime } from "./economy.js";
