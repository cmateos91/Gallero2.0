import { useState } from "react";
import useSWR from "swr";
import { fetchRoosters } from "../lib/api/roosters.js";
import { fetchLeaderboard } from "../lib/api/ranking.js";
import { startSoloCombat, submitTurn } from "../lib/api/fights.js";
import { BattleArena } from "../components/battle/BattleArena.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge } from "../components/ui/Badge.js";
import type { CombatState, RoosterDto, LeaderboardEntry, TurnResult } from "../types/api.js";
import { useToast } from "../context/toast.js";
import styles from "./fights.module.css";

type Phase = "select-opponent" | "select-rooster" | "confirm" | "combat" | "result";

export function Fights() {
  const { data: roostersData } = useSWR("/api/roosters", () => fetchRoosters());
  const { data: lbData } = useSWR("/api/ranking/leaderboard", () => fetchLeaderboard());
  const { pushToast } = useToast();

  const [phase, setPhase] = useState<Phase>("select-opponent");
  const [opponent, setOpponent] = useState<LeaderboardEntry | null>(null);
  const [myRooster, setMyRooster] = useState<RoosterDto | null>(null);
  const [combatId, setCombatId] = useState("");
  const [state, setState] = useState<CombatState | null>(null);
  const [turnResult, setTurnResult] = useState<TurnResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [finalDelta, setFinalDelta] = useState(0);
  const [finalCoins, setFinalCoins] = useState(0);

  const adults = (roostersData?.roosters ?? []).filter((r) => r.stage === "ADULTO" && !r.isDead);
  const opponents = (lbData?.leaderboard ?? []).slice(0, 10);

  async function handleStart() {
    if (!myRooster || !opponent) return;
    setLoading(true);
    try {
      const res = await startSoloCombat(myRooster.id, opponent.id, adults[0]?.id ?? opponent.id);
      setCombatId(res.combatId);
      setState(res.initialState);
      setPhase("combat");
    } catch {
      pushToast("Error al iniciar combate", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleMove(move: "atacar" | "defender" | "esquivar" | "huir") {
    setLoading(true);
    try {
      const res = await submitTurn(combatId, move);
      setState(res.state);
      if (res.turnResult) setTurnResult(res.turnResult);
      if (res.over) {
        setFinalDelta(res.mmrDeltaA ?? 0);
        setFinalCoins(15);
        setPhase("result");
      }
    } catch {
      pushToast("Error en el turno", "error");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPhase("select-opponent");
    setOpponent(null);
    setMyRooster(null);
    setState(null);
    setTurnResult(null);
    setFinalDelta(0);
    setFinalCoins(0);
  }

  if (phase === "select-opponent") {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>Selecciona rival</h2>
        <div className={styles.list}>
          {opponents.map((o) => (
            <Card
              key={o.id}
              padding="sm"
              className={styles.opponentCard}
              onClick={() => { setOpponent(o); setPhase("select-rooster"); }}
            >
              <span className={styles.oppName}>{o.username}</span>
              <Badge>{o.mmr} MMR</Badge>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "select-rooster") {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>Elige tu gallo</h2>
        <p className={styles.sub}>Rival: {opponent?.username} ({opponent?.mmr} MMR)</p>
        <div className={styles.list}>
          {adults.map((r) => (
            <Card
              key={r.id}
              padding="sm"
              className={[styles.opponentCard, myRooster?.id === r.id ? styles.selected : ""].join(" ")}
              onClick={() => { setMyRooster(r); setPhase("confirm"); }}
            >
              <span>{r.name}</span>
              <Badge>{Math.round((r.attack + r.defense + r.speed + r.resistance) / 4)} avg</Badge>
            </Card>
          ))}
        </div>
        {myRooster && (
          <Button onClick={handleStart} loading={loading}>
            ¡Pelear!
          </Button>
        )}
      </div>
    );
  }

  if (phase === "confirm" || (phase === "combat" && state)) {
    const my = myRooster!;
    const opp = opponent!;
    return (
      <BattleArena
        myFighter={{ name: my.name, level: Math.round((my.attack + my.defense + my.speed + my.resistance) / 4), maxHp: my.resistance * 3 }}
        oppFighter={{ name: opp.username, level: opp.mmr, maxHp: 60 }}
        state={state!}
        onMove={handleMove}
        disabled={loading || state?.isOver}
      />
    );
  }

  if (phase === "result") {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>Resultado</h2>
        <Card className={styles.resultCard}>
          <p>MMR: {finalDelta >= 0 ? "+" : ""}{finalDelta}</p>
          <p>Monedas: +{finalCoins} 🪙</p>
        </Card>
        <Button onClick={reset}>Nuevo combate</Button>
      </div>
    );
  }

  return null;
}
