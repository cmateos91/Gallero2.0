export interface AuthUserDto {
  id: string;
  email: string;
  username: string;
  mmr: number;
  coins: number;
  streakDays: number;
  towerHighFloor: number;
  createdAt: string;
}

export interface RoosterDto {
  id: string;
  userId: string;
  name: string;
  stage: "HUEVO" | "POLLO" | "ADULTO";
  nature: string | null;
  quality: string;
  attack: number;
  defense: number;
  speed: number;
  resistance: number;
  careCurrent: number;
  bondPoints: number;
  hunger: number;
  thirst: number;
  growthProgress: number;
  hatchReadyAt: string | null;
  diedAt: string | null;
  positionX: number | null;
  positionY: number | null;
  homeScreen: string | null;
  isAtHome: boolean;
  onFence: boolean;
  customColors: Record<string, string> | null;
  paintLayers: Record<string, unknown> | null;
  createdAt: string;
  hungerValue: number;
  thirstValue: number;
  healthValue: number;
  isDead: boolean;
}

export interface CombatState {
  fighterA: {
    hp: number;
    energy: number;
    buffs: { stat: string; value: number; turnsRemaining: number }[];
    consecutiveDefenses: number;
  };
  fighterB: {
    hp: number;
    energy: number;
    buffs: { stat: string; value: number; turnsRemaining: number }[];
    consecutiveDefenses: number;
  };
  momentumFighter: 0 | 1 | null;
  momentumMultiplier: number;
  turnsCount: number;
  isOver: boolean;
  winner: 0 | 1 | null;
}

export interface TurnResult {
  damageA: number;
  damageB: number;
  log: string[];
  isOver: boolean;
  winner: 0 | 1 | null;
}

export interface TowerRunState {
  runId: string;
  userId: string;
  roosterId: string;
  currentFloor: number;
  runSeed: number;
  activeCombatId: string | null;
  coinsEarned: number;
  playerHp: number;
  abandoned: boolean;
}

export interface TowerNpc {
  name: string;
  nature: string;
  attack: number;
  defense: number;
  speed: number;
  resistance: number;
  isBoss: boolean;
  floorColor: string;
}

export interface EggTier {
  tier: string;
  price: number;
  description: string;
}

export interface CombatItemShop {
  id: string;
  type: string;
  name: string;
  description: string;
  price: number;
  turns: number;
  effectValue: number;
  owned: number;
}

export interface InventoryItem {
  id: string;
  itemType: string;
  itemKey: string;
  quantity: number;
}

export interface FriendDto {
  id: string;
  username: string;
  mmr: number;
}

export interface FriendRequestDto {
  id: string;
  sender: { id: string; username: string };
  status: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  mmr: number;
  towerHighFloor: number;
  streakDays: number;
}

export interface DailyMissionDef {
  key: string;
  description: string;
  target: number;
  reward: number;
}

export interface DailyMissionProgress {
  id: string;
  date: string;
  fightsWon: number;
  feedings: number;
  trainings: number;
  claimed: string[];
}

export interface ProfileDto {
  id: string;
  username: string;
  mmr: number;
  coins: number;
  streakDays: number;
  towerHighFloor: number;
  roostersCount: number;
  fightsCount: number;
  createdAt: string;
}

export interface CosmeticItemDto {
  id: string;
  slot: string;
  name: string;
  description: string;
  price: number;
  rarity: string;
}

export interface UserCosmeticDto {
  id: string;
  cosmetic: CosmeticItemDto;
  acquiredAt: string;
}

export interface EquippedCosmeticDto {
  id: string;
  roosterId: string;
  slot: string;
  cosmetic: CosmeticItemDto;
}
