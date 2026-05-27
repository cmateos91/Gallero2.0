import { useState } from "react";
import useSWR from "swr";
import { fetchRoosters } from "../lib/api/roosters.js";
import { startTowerRun, fetchTowerRun, startTowerFloor, submitTowerTurn, advanceTowerFloor, abandonTowerRun } from "../lib/api/tower.js";
import { BattleArena } from "../components/battle/BattleArena.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge } from "../components/ui/Badge.js";
import type { RoosterDto, CombatState, TowerRunState, TowerNpc, TurnResult } from "../types/api.js";
import { useToast } from "../context/toast.js";
import styles from "./torre.module.css";

type Phase = "intro" | "select-rooster" | "preview" | "combat" | "over";

export function Torre() {
  const { data: roostersData } = useSWR("/api/roosters", () => fetchRoosters());
  const { pushToast } = useToast();

  const [phase, setPhase] = useState<Phase>("intro");
  const [run, setRun] = useState<TowerRunState | null>(null);
  const [npc, setNpc] = useState<TowerNpc | null>(null);
  const [combatId, setCombatId] = useState("");
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [turnResult, setTurnResult] = useState<TurnResult | null>(null);
  const [playerWon, setPlayerWon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultCoins, setResultCoins] = useState(0);
  const [resultFloor, setResultFloor] = useState(0);

  const adults = (roostersData?.roosters ?? []).filter((r) => r.stage === "ADULTO" && !r.isDead);

  async function handleStart(roosterId: string) {
    setLoading(true);
    try {
      const res = await startTowerRun(roosterId);
      setRun(res.run);
      await loadFloor(res.run.runId);
    } catch { pushToast("Error al iniciar torre", "error"); }
    finally { setLoading(false); }
  }

  async function loadFloor(runId: string) {
    try {
      const res = await startTowerFloor(runId);
      setCombatId(res.combatId);
      setNpc(res.npc);
      setCombatState(res.initialState);
      setPhase("combat");
    } catch { pushToast("Error al cargar piso", "error"); }
  }

  async function handleMove(move: "atacar" | "defender" | "esquivar" | "huir") {
    if (!run) return;
    setLoading(true);
    try {
      const res = await submitTowerTurn(run.runId, combatId, move);
      setCombatState(res.state);
      if (res.turnResult) setTurnResult(res.turnResult);
      if (res.over) {
        if (res.playerWon) {
          setPlayerWon(true);
          if (run) {
            const updated = await advanceTowerFloor(run.runId, res.state.fighterA.hp);
            setRun(updated.run);
            pushToast(`¡Piso ${updated.run.currentFloor - 1} superado! +${updated.run.coinsEarned} 🪙`, "success");
          }
        } else {
          pushToast("Derrotado", "error");
        }
        setPhase("over");
      }
    } catch { pushToast("Error en el turno", "error"); }
    finally { setLoading(false); }
  }

  async function handleAdvance() {
    if (!run) return;
    setPlayerWon(false);
    setTurnResult(null);
    await loadFloor(run.runId);
  }

  async function handleAbandon() {
    if (!run) return;
    try {
      const res = await abandonTowerRun(run.runId);
      setResultCoins(res.coinsEarned);
      setResultFloor(res.floorReached);
      pushToast(`Torre abandonada. ${res.coinsEarned} monedas`, "info");
    } catch { /* ignore */ }
    setPhase("over");
  }

  function reset() {
    setPhase("intro");
    setRun(null); setNpc(null); setCombatState(null); setTurnResult(null);
    setPlayerWon(false); setResultCoins(0); setResultFloor(0);
  }

  if (phase === "intro") {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>Torre</h2>
        <Card className={styles.card}>
          <p>Enfrenta NPCs generados proceduralmente. Bosses cada 5 pisos.</p>
          <p>¡Avanza tanto como puedas y acumula monedas!</p>
        </Card>
        <Button onClick={() => setPhase("select-rooster")}>Empezar</Button>
      </div>
    );
  }

  if (phase === "select-rooster") {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>Elige tu guerrero</h2>
        {adults.map((r: RoosterDto) => (
          <Card key={r.id} padding="sm" className={styles.roosterCard} onClick={() => handleStart(r.id)}>
            <span className={styles.roosterName}>{r.name}</span>
            <Badge>{Math.round((r.attack + r.defense + r.speed + r.resistance) / 4)} avg</Badge>
          </Card>
        ))}
      </div>
    );
  }

  if (phase === "combat" && combatState && npc) {
    return (
      <BattleArena
        myFighter={{
          name: "Tú",
          level: run?.currentFloor ?? 1,
          maxHp: (adults[0]?.resistance ?? 20) * 3,
        }}
        oppFighter={{
          name: npc.name,
          level: run?.currentFloor ?? 1,
          maxHp: (npc.resistance * 3) || 60,
        }}
        state={combatState}
        onMove={handleMove}
        disabled={loading || combatState.isOver}
        result={turnResult}
      />
    );
  }

  if (phase === "over") {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>Fin de torre</h2>
        <Card className={styles.card}>
          <p>Pisos: {resultFloor || (run?.currentFloor ?? 0)}</p>
          <p>Monedas: {resultCoins || (run?.coinsEarned ?? 0)} 🪙</p>
        </Card>
        {playerWon && (
          <Button onClick={handleAdvance} loading={loading}>Siguiente piso →</Button>
        )}
        {!playerWon && run && !run.abandoned && (
          <Button variant="danger" onClick={handleAbandon}>Abandonar (cobrar monedas)</Button>
        )}
        <Button variant="ghost" onClick={reset}>Salir</Button>
      </div>
    );
  }

  return null;
}
