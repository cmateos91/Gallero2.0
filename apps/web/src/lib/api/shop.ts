import { requestAuth } from "./client.js";
import type { CombatItemShop } from "../../types/api.js";

const API = "/api";

export function fetchShopCombatItems() {
  return requestAuth<{ items: CombatItemShop[] }>(`${API}/shop/combat-items`);
}

export function buyCombatItem(itemId: string, quantity?: number) {
  return requestAuth<{ bought: number }>(`${API}/shop/combat-items/${itemId}/buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });
}
