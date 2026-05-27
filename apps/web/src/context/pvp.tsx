import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "./auth.js";
import type { CombatState, RoosterDto } from "../types/api.js";

type PvpState = "disconnected" | "connecting" | "connected" | "challenging" | "in-combat";

interface ChallengeInfo {
  inviteId: string;
  challengerUsername: string;
  roosterName: string;
}

interface FightStartInfo {
  roomId: string;
  role: "challenger" | "defender";
  initialState: CombatState;
}

interface FightOverInfo {
  winner: string;
  mmrDelta: number;
  coins: number;
}

interface PvpContextValue {
  state: PvpState;
  challengeReceived: ChallengeInfo | null;
  fightStart: FightStartInfo | null;
  fightOver: FightOverInfo | null;
  waiting: boolean;
  turnResult: { state: CombatState; log: string[] } | null;
  sendChallenge: (targetUsername: string, roosterId: string) => void;
  acceptChallenge: (inviteId: string) => void;
  declineChallenge: (inviteId: string) => void;
  sendMove: (roomId: string, move: string) => void;
  dismissResult: () => void;
}

const PvpContext = createContext<PvpContextValue | null>(null);

function getWsUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
  return apiUrl.replace(/^http/, "ws") + "/ws/pvp";
}

let reconnectDelay = 1000;

export function PvpProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const [pvpState, setPvpState] = useState<PvpState>("disconnected");
  const [challengeReceived, setChallengeReceived] = useState<ChallengeInfo | null>(null);
  const [fightStart, setFightStart] = useState<FightStartInfo | null>(null);
  const [fightOver, setFightOver] = useState<FightOverInfo | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [turnResult, setTurnResult] = useState<{ state: CombatState; log: string[] } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
    pingTimerRef.current = null;
    pongTimeoutRef.current = null;
  }, []);

  const connect = useCallback(() => {
    if (!accessToken) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setPvpState("connecting");
    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", payload: { token: accessToken } }));
      pingTimerRef.current = setInterval(() => {
        ws.send(JSON.stringify({ type: "ping" }));
        pongTimeoutRef.current = setTimeout(() => {
          ws.close();
        }, 10000);
      }, 25000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(String(event.data)) as { type: string; payload: Record<string, unknown> };
      switch (msg.type) {
        case "connected":
          setPvpState("connected");
          reconnectDelay = 1000;
          break;
        case "pong":
          if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
          break;
        case "challenge:sent":
          setPvpState("challenging");
          break;
        case "challenge:received":
          setChallengeReceived({
            inviteId: msg.payload.inviteId as string,
            challengerUsername: msg.payload.challengerUsername as string,
            roosterName: msg.payload.roosterName as string,
          });
          break;
        case "challenge:expired":
          setPvpState("connected");
          break;
        case "challenge:declined":
          setPvpState("connected");
          break;
        case "fight:start":
          setFightStart({
            roomId: msg.payload.roomId as string,
            role: msg.payload.role as "challenger" | "defender",
            initialState: msg.payload.initialState as unknown as CombatState,
          });
          setPvpState("in-combat");
          setChallengeReceived(null);
          break;
        case "turn:result":
          setTurnResult(msg.payload as unknown as { state: CombatState; log: string[] });
          setWaiting(false);
          break;
        case "fight:over":
          setFightOver(msg.payload as unknown as FightOverInfo);
          setFightStart(null);
          setPvpState("connected");
          break;
        case "fight:cancelled":
          setFightStart(null);
          setPvpState("connected");
          break;
      }
    };

    ws.onclose = () => {
      cleanup();
      if (fightStart) {
        setFightStart(null);
      }
      setPvpState("disconnected");
      wsRef.current = null;
      if (accessToken) {
        setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, 30000);
          connect();
        }, reconnectDelay);
      }
    };
  }, [accessToken, cleanup, fightStart]);

  useEffect(() => {
    if (accessToken) connect();
    return cleanup;
  }, [accessToken, connect, cleanup]);

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const sendChallenge = useCallback((targetUsername: string, roosterId: string) => {
    send({ type: "challenge:send", payload: { targetUsername, roosterId } });
  }, [send]);

  const acceptChallenge = useCallback((inviteId: string) => {
    send({ type: "challenge:accept", payload: { inviteId } });
    setChallengeReceived(null);
  }, [send]);

  const declineChallenge = useCallback((inviteId: string) => {
    send({ type: "challenge:decline", payload: { inviteId } });
    setChallengeReceived(null);
    setPvpState("connected");
  }, [send]);

  const sendMove = useCallback((roomId: string, move: string) => {
    send({ type: "turn:move", payload: { roomId, move } });
    setWaiting(true);
  }, [send]);

  const dismissResult = useCallback(() => {
    setFightOver(null);
  }, []);

  return (
    <PvpContext.Provider
      value={{
        state: pvpState,
        challengeReceived,
        fightStart,
        fightOver,
        waiting,
        turnResult,
        sendChallenge,
        acceptChallenge,
        declineChallenge,
        sendMove,
        dismissResult,
      }}
    >
      {children}
    </PvpContext.Provider>
  );
}

export function usePvp(): PvpContextValue {
  const ctx = useContext(PvpContext);
  if (!ctx) throw new Error("usePvp must be used within PvpProvider");
  return ctx;
}
