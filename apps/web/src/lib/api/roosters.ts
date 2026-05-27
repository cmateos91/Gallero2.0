import { requestAuth } from "./client.js";
import type { RoosterDto, EggTier, CombatItemShop } from "../../types/api.js";

const API = "/api";

export function fetchRoosters() {
  return requestAuth<{ roosters: RoosterDto[] }>(`${API}/roosters`);
}

export function bootstrapRooster() {
  return requestAuth<{ rooster: RoosterDto }>(`${API}/roosters/bootstrap`, { method: "POST" });
}

export function bootstrapAndHatch() {
  return requestAuth<{ rooster: RoosterDto }>(`${API}/roosters/bootstrap-and-hatch`, {
    method: "POST",
  });
}

export function fuseRoosters(roosterId1: string, roosterId2: string) {
  return requestAuth<{ rooster: RoosterDto }>(`${API}/roosters/fuse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roosterId1, roosterId2 }),
  });
}

export function fetchEggShop() {
  return requestAuth<{ tiers: EggTier[] }>(`${API}/roosters/egg-shop`);
}

export function buyEgg(tier: string) {
  return requestAuth<{ rooster: RoosterDto }>(`${API}/roosters/buy-egg`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier }),
  });
}

export function claimFreeEgg() {
  return requestAuth<{ rooster: RoosterDto }>(`${API}/roosters/claim-free-egg`, {
    method: "POST",
  });
}

export function renameRooster(id: string, name: string) {
  return requestAuth<{ rooster: RoosterDto }>(`${API}/roosters/${id}/rename`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function updateRoosterPosition(
  id: string,
  data: { positionX?: number; positionY?: number; homeScreen?: string },
) {
  return requestAuth<{ rooster: RoosterDto }>(`${API}/roosters/${id}/position`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function updateRoosterColors(id: string, colors: Record<string, string>) {
  return requestAuth<{ rooster: RoosterDto }>(`${API}/roosters/${id}/colors`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(colors),
  });
}

export function careRooster(id: string) {
  return requestAuth<{ rooster: RoosterDto }>(`${API}/roosters/${id}/care`, { method: "POST" });
}

export function trainRooster(id: string) {
  return requestAuth<{ rooster: RoosterDto }>(`${API}/roosters/${id}/train`, { method: "POST" });
}

export function feedRooster(id: string) {
  return requestAuth<{ rooster: RoosterDto }>(`${API}/roosters/${id}/feed`, { method: "POST" });
}

export function drinkRooster(id: string) {
  return requestAuth<{ rooster: RoosterDto }>(`${API}/roosters/${id}/drink`, { method: "POST" });
}

export function sellRooster(id: string) {
  return requestAuth<unknown>(`${API}/roosters/${id}/matadero`, { method: "POST" });
}

export function removeDeadRooster(id: string) {
  return requestAuth<Record<string, never>>(`${API}/roosters/${id}/remove-dead`, { method: "POST" });
}

export function fetchRoosterCombatItems(id: string) {
  return requestAuth<{ items: CombatItemShop[] }>(`${API}/roosters/${id}/combat-items`);
}
