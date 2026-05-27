import { requestAuth } from "./client.js";
import type { CosmeticItemDto, UserCosmeticDto, EquippedCosmeticDto } from "../../types/api.js";

const API = "/api";

export function fetchCosmeticsCatalog() {
  return requestAuth<{ catalog: CosmeticItemDto[] }>(`${API}/cosmetics`);
}

export function fetchMyCosmetics() {
  return requestAuth<{ owned: UserCosmeticDto[]; equipped: EquippedCosmeticDto[] }>(
    `${API}/cosmetics/mine`,
  );
}

export function buyCosmetic(cosmeticId: string) {
  return requestAuth<{ ok: true }>(`${API}/cosmetics/${cosmeticId}/buy`, { method: "POST" });
}

export function equipCosmetic(cosmeticId: string, roosterId: string) {
  return requestAuth<{ ok: true }>(`${API}/cosmetics/${cosmeticId}/equip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roosterId }),
  });
}

export function unequipCosmetic(cosmeticId: string, roosterId: string, slot: string) {
  return requestAuth<{ ok: true }>(`${API}/cosmetics/${cosmeticId}/unequip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roosterId, slot }),
  });
}
