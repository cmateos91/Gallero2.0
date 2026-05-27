import { useState } from "react";
import useSWR from "swr";
import { fetchRoosters } from "../lib/api/roosters.js";
import { usePvp } from "../context/pvp.js";
import { BattleArena } from "../components/battle/BattleArena.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import { Badge } from "../components/ui/Badge.js";
import type { RoosterDto } from "../types/api.js";
import styles from "./fights.module.css";

export function Pvp() {
  const { data: roostersData } = useSWR("/api/roosters", () => fetchRoosters());
  const {
    state,
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
  } = usePvp();

  const [targetUser, setTargetUser] = useState("");
  const [selectedRooster, setSelectedRooster] = useState<string | null>(null);

  const adults = (roostersData?.roosters ?? []).filter((r) => r.stage === "ADULTO" && !r.isDead);
  const myRooster: RoosterDto | null = selectedRooster
    ? (adults.find((r) => r.id === selectedRooster) ?? null)
    : null;

  function handleSendChallenge() {
    if (!selectedRooster || !targetUser.trim()) return;
    sendChallenge(targetUser.trim(), selectedRooster);
  }

  if (fightOver) {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>Resultado</h2>
        <Card className={styles.resultCard}>
          <p>Ganador: {fightOver.winner}</p>
          <p>MMR: {fightOver.mmrDelta >= 0 ? "+" : ""}{fightOver.mmrDelta}</p>
          <p>Monedas: +{fightOver.coins} 🪙</p>
        </Card>
        <Button onClick={dismissResult}>Cerrar</Button>
      </div>
    );
  }

  if (fightStart) {
    const my: RoosterDto | null = (roostersData?.roosters ?? []).find((r) => r.id === selectedRooster) ?? null;
    return (
      <BattleArena
        myFighter={{
          name: my?.name ?? "Tú",
          level: my ? Math.round((my.attack + my.defense + my.speed + my.resistance) / 4) : 1,
          maxHp: (my?.resistance ?? 20) * 3,
        }}
        oppFighter={{
          name: "Rival",
          level: 5,
          maxHp: 60,
        }}
        state={turnResult?.state ?? fightStart.initialState}
        onMove={(move) => sendMove(fightStart.roomId, move)}
        disabled={state !== "in-combat"}
        waiting={waiting}
        result={turnResult ? { damageA: 0, damageB: 0, log: turnResult.log, isOver: false, winner: null } : null}
      />
    );
  }

  if (challengeReceived) {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>¡Desafío recibido!</h2>
        <Card className={styles.resultCard}>
          <p>{challengeReceived.challengerUsername} te desafía</p>
          <p>Gallo: {challengeReceived.roosterName}</p>
        </Card>
        <Button onClick={() => acceptChallenge(challengeReceived.inviteId)}>Aceptar</Button>
        <Button variant="danger" onClick={() => declineChallenge(challengeReceived.inviteId)}>Rechazar</Button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Combate PvP</h2>
      <Badge variant={state === "connected" ? "success" : "warning"}>
        {state === "connected" ? "Conectado" : state === "connecting" ? "Conectando..." : state}
      </Badge>

      <div className={styles.list}>
        <p className={styles.sub}>Selecciona tu gallo:</p>
        {adults.map((r) => (
          <Card
            key={r.id}
            padding="sm"
            className={[styles.opponentCard, selectedRooster === r.id ? styles.selected : ""].join(" ")}
            onClick={() => setSelectedRooster(r.id)}
          >
            <span>{r.name}</span>
            <Badge>{Math.round((r.attack + r.defense + r.speed + r.resistance) / 4)} avg</Badge>
          </Card>
        ))}
      </div>

      <Input
        placeholder="Nombre del rival..."
        value={targetUser}
        onChange={(e) => { setTargetUser(e.target.value); }}
      />

      <Button onClick={handleSendChallenge} disabled={!selectedRooster || !targetUser || state !== "connected"}>
        Desafiar
      </Button>
    </div>
  );
}
