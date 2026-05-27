import { requestAuth } from "./client.js";
import type { DailyMissionDef, DailyMissionProgress } from "../../types/api.js";

const API = "/api";

export function fetchDailyMissions() {
  return requestAuth<{ missions: DailyMissionDef[]; progress: DailyMissionProgress }>(
    `${API}/missions/daily`,
  );
}

export function claimMission(key: string) {
  return requestAuth<{ coinsAwarded: number; streakBonus: number }>(
    `${API}/missions/daily/claim/${key}`,
    { method: "POST" },
  );
}
