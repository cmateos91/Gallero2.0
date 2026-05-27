import { requestAuth } from "./client.js";
import type { TowerRunState, TowerNpc, CombatState, TurnResult } from "../../types/api.js";

const API = "/api";

export function startTowerRun(roosterId: string) {
  return requestAuth<{ run: TowerRunState }>(`${API}/tower/runs/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roosterId }),
  });
}

export function fetchTowerRun(runId: string) {
  return requestAuth<{ run: TowerRunState }>(`${API}/tower/runs/${runId}`);
}

export function startTowerFloor(runId: string) {
  return requestAuth<{
    combatId: string;
    npc: TowerNpc;
    initialState: CombatState;
  }>(`${API}/tower/runs/${runId}/start-floor`, { method: "POST" });
}

export function submitTowerTurn(runId: string, combatId: string, move: string) {
  return requestAuth<{
    turnResult?: TurnResult;
    state: CombatState;
    over: boolean;
    playerWon?: boolean;
  }>(`${API}/tower/runs/${runId}/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ combatId, move }),
  });
}

export function advanceTowerFloor(runId: string, playerHp?: number) {
  return requestAuth<{ run: TowerRunState }>(`${API}/tower/runs/${runId}/advance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerHp }),
  });
}

export function abandonTowerRun(runId: string) {
  return requestAuth<{ coinsEarned: number; floorReached: number }>(
    `${API}/tower/runs/${runId}/abandon`,
    { method: "POST" },
  );
}
