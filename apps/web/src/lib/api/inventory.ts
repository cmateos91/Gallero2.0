import { requestAuth } from "./client.js";
import type { InventoryItem } from "../../types/api.js";

const API = "/api";

export function fetchInventory() {
  return requestAuth<{ items: InventoryItem[] }>(`${API}/inventory`);
}

export function refillInventory() {
  return requestAuth<{ items: InventoryItem[] }>(`${API}/inventory/refill`, { method: "POST" });
}

export function buyItem(itemKey: string, quantity?: number) {
  return requestAuth<{ bought: number; itemKey: string }>(`${API}/inventory/buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemKey, quantity }),
  });
}
