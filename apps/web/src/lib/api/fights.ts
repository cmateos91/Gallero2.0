import { requestAuth } from "./client.js";
import type { CombatState, TurnResult } from "../../types/api.js";

const API = "/api";

export function startSoloCombat(
  challengerRoosterId: string,
  defenderUserId: string,
  defenderRoosterId: string,
) {
  return requestAuth<{ fightId: string; combatId: string; initialState: CombatState }>(
    `${API}/fights/solo/start`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengerRoosterId, defenderUserId, defenderRoosterId }),
    },
  );
}

export function submitTurn(combatId: string, move: string) {
  return requestAuth<{
    turnResult?: TurnResult;
    state: CombatState;
    over: boolean;
    waiting?: boolean;
    mmrDeltaA?: number;
    mmrDeltaB?: number;
  }>(`${API}/fights/solo/${combatId}/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ move }),
  });
}

export function fetchFight(fightId: string) {
  return requestAuth<{ fight: Record<string, unknown> }>(`${API}/fights/${fightId}`);
}
