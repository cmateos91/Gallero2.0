import type { CombatState } from "@gallos/game-engine";

export type PvpMessage =
  | { type: "auth";              payload: { token: string } }
  | { type: "ping" }
  | { type: "pong";             payload: { serverTime: number } }
  | { type: "connected";        payload: { userId: string; username: string } }
  | { type: "challenge:send";   payload: { targetUsername: string; roosterId: string } }
  | { type: "challenge:sent" }
  | { type: "challenge:received"; payload: { challengerUsername: string; roosterName: string; inviteId: string } }
  | { type: "challenge:expired" }
  | { type: "challenge:accept"; payload: { inviteId: string } }
  | { type: "challenge:decline";payload: { inviteId: string } }
  | { type: "challenge:declined" }
  | { type: "fight:start";      payload: { roomId: string; role: "challenger" | "defender"; initialState: CombatState } }
  | { type: "turn:move";        payload: { roomId: string; move: string } }
  | { type: "turn:result";      payload: unknown }
  | { type: "fight:over";       payload: { winner: string; mmrDelta: number; coins: number } }
  | { type: "fight:cancelled" }
  | { type: "fight:error";      payload: { message: string } };

export type PvpChallenge = {
  inviteId:          string;
  challengerUserId:  string;
  challengerUsername: string;
  roosterId:         string;
  roosterName:       string;
  targetUserId:      string;
  createdAt:         number;
};

export type PvpRoom = {
  roomId:            string;
  challengerUserId:  string;
  defenderUserId:    string;
  challengerRoosterId: string;
  defenderRoosterId: string;
  fightId:           string;
  combatId:          string;
  createdAt:         number;
};
