import { requestAuth } from "./client.js";
import type { ProfileDto } from "../../types/api.js";

const API = "/api";

export function fetchProfile() {
  return requestAuth<ProfileDto>(`${API}/profile/me`);
}

export function claimWeeklyReward() {
  return requestAuth<{ coins: number }>(`${API}/rewards/claim-weekly`, { method: "POST" });
}
