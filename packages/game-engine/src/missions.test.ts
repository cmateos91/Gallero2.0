import { describe, it, expect } from "vitest";
import {
  DAILY_MISSIONS,
  STREAK_BONUSES,
  getStreakBonus,
  todayUtc,
  yesterdayUtc,
} from "./missions.js";

describe("DAILY_MISSIONS", () => {
  it("tiene exactamente 3 misiones", () => {
    expect(DAILY_MISSIONS).toHaveLength(3);
  });

  it("WIN_2_FIGHTS: target=2, reward=50, field=fightsWon", () => {
    const m = DAILY_MISSIONS.find((m) => m.key === "WIN_2_FIGHTS");
    expect(m).toBeDefined();
    expect(m!.target).toBe(2);
    expect(m!.reward).toBe(50);
    expect(m!.field).toBe("fightsWon");
  });

  it("FEED_3_TIMES: target=3, reward=30, field=feedings", () => {
    const m = DAILY_MISSIONS.find((m) => m.key === "FEED_3_TIMES");
    expect(m).toBeDefined();
    expect(m!.target).toBe(3);
    expect(m!.reward).toBe(30);
    expect(m!.field).toBe("feedings");
  });

  it("TRAIN_ONCE: target=1, reward=25, field=trainings", () => {
    const m = DAILY_MISSIONS.find((m) => m.key === "TRAIN_ONCE");
    expect(m).toBeDefined();
    expect(m!.target).toBe(1);
    expect(m!.reward).toBe(25);
    expect(m!.field).toBe("trainings");
  });
});

describe("STREAK_BONUSES", () => {
  it("tiene 4 niveles de racha", () => {
    expect(STREAK_BONUSES).toHaveLength(4);
  });

  it("contiene los bonuses correctos", () => {
    const bonuses = STREAK_BONUSES.map((s) => ({ days: s.days, bonus: s.bonus }));
    expect(bonuses).toEqual(
      expect.arrayContaining([
        { days: 3, bonus: 20 },
        { days: 7, bonus: 75 },
        { days: 14, bonus: 150 },
        { days: 30, bonus: 300 },
      ])
    );
  });
});

describe("getStreakBonus", () => {
  it("0 días → 0", () => { expect(getStreakBonus(0)).toBe(0); });
  it("2 días → 0", () => { expect(getStreakBonus(2)).toBe(0); });
  it("3 días → 20", () => { expect(getStreakBonus(3)).toBe(20); });
  it("6 días → 20", () => { expect(getStreakBonus(6)).toBe(20); });
  it("7 días → 75", () => { expect(getStreakBonus(7)).toBe(75); });
  it("13 días → 75", () => { expect(getStreakBonus(13)).toBe(75); });
  it("14 días → 150", () => { expect(getStreakBonus(14)).toBe(150); });
  it("29 días → 150", () => { expect(getStreakBonus(29)).toBe(150); });
  it("30 días → 300", () => { expect(getStreakBonus(30)).toBe(300); });
  it("100 días → 300", () => { expect(getStreakBonus(100)).toBe(300); });
});

describe("todayUtc / yesterdayUtc", () => {
  it("todayUtc tiene formato YYYY-MM-DD", () => {
    expect(todayUtc()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("yesterdayUtc tiene formato YYYY-MM-DD", () => {
    expect(yesterdayUtc()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("yesterday es un día antes que today", () => {
    const today = new Date(todayUtc());
    const yesterday = new Date(yesterdayUtc());
    const diff = today.getTime() - yesterday.getTime();
    expect(diff).toBe(24 * 60 * 60 * 1000);
  });
});
