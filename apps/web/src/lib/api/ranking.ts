import { requestAuth } from "./client.js";
import type { LeaderboardEntry } from "../../types/api.js";

const API = "/api";

export function fetchLeaderboard() {
  return requestAuth<{ leaderboard: LeaderboardEntry[] }>(`${API}/ranking/leaderboard`);
}
