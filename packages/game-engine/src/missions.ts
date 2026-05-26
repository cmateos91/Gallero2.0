export interface DailyMission {
  key: "WIN_2_FIGHTS" | "FEED_3_TIMES" | "TRAIN_ONCE";
  description: string;
  field: "fightsWon" | "feedings" | "trainings";
  target: number;
  reward: number;
}

export interface StreakBonus {
  days: number;
  bonus: number;
}

export const DAILY_MISSIONS: DailyMission[] = [
  {
    key: "WIN_2_FIGHTS",
    description: "Gana 2 combates",
    field: "fightsWon",
    target: 2,
    reward: 50,
  },
  {
    key: "FEED_3_TIMES",
    description: "Alimenta a tus gallos 3 veces",
    field: "feedings",
    target: 3,
    reward: 30,
  },
  {
    key: "TRAIN_ONCE",
    description: "Entrena a un gallo",
    field: "trainings",
    target: 1,
    reward: 25,
  },
];

export const STREAK_BONUSES: StreakBonus[] = [
  { days: 3, bonus: 20 },
  { days: 7, bonus: 75 },
  { days: 14, bonus: 150 },
  { days: 30, bonus: 300 },
];

export function getStreakBonus(streakDays: number): number {
  const sorted = [...STREAK_BONUSES].sort((a, b) => b.days - a.days);
  const match = sorted.find((s) => streakDays >= s.days);
  return match?.bonus ?? 0;
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayUtc(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
