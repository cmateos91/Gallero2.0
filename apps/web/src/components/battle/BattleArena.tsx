import { useEffect, useState } from "react";
import type { CombatState, TurnResult } from "../../types/api.js";
import { BattleHpCard } from "./BattleHpCard.js";
import { BattleMoveButtons } from "./BattleMoveButtons.js";
import { Card } from "../ui/Card.js";
import styles from "./BattleArena.module.css";

interface FighterInfo {
  name: string;
  level: number;
  maxHp: number;
}

interface BattleArenaProps {
  myFighter: FighterInfo;
  oppFighter: FighterInfo;
  state: CombatState;
  onMove: (move: "atacar" | "defender" | "esquivar" | "huir") => void;
  disabled?: boolean;
  waiting?: boolean;
  result?: TurnResult | null;
}

export function BattleArena({
  myFighter,
  oppFighter,
  state,
  onMove,
  disabled,
  waiting,
  result,
}: BattleArenaProps) {
  const [shakeLeft, setShakeLeft] = useState(false);
  const [shakeRight, setShakeRight] = useState(false);
  const [damageNum, setDamageNum] = useState<{ side: string; value: number; key: number } | null>(null);

  useEffect(() => {
    if (!result) return;
    if (result.damageA > 0) {
      setShakeLeft(true);
      setDamageNum({ side: "left", value: result.damageA, key: Date.now() });
      setTimeout(() => setShakeLeft(false), 300);
      setTimeout(() => setDamageNum(null), 1200);
    }
    if (result.damageB > 0) {
      setShakeRight(true);
      setDamageNum({ side: "right", value: result.damageB, key: Date.now() });
      setTimeout(() => setShakeRight(false), 300);
      setTimeout(() => setDamageNum(null), 1200);
    }
  }, [result]);

  const fi = state.fighterA;
  const fo = state.fighterB;
  const turnLog = (result?.log ?? []).slice(-3);

  return (
    <div className={styles.arena}>
      <div className={styles.fighters}>
        <BattleHpCard
          side="left"
          name={oppFighter.name}
          level={oppFighter.level}
          hp={fo.hp}
          maxHp={oppFighter.maxHp}
          energy={fo.energy}
          state={state}
          shake={shakeLeft}
        />
        {damageNum && (
          <span
            key={damageNum.key}
            className={[styles.damageNum, styles[damageNum.side]].join(" ")}
          >
            -{damageNum.value}
          </span>
        )}
        <BattleHpCard
          side="right"
          name={myFighter.name}
          level={myFighter.level}
          hp={fi.hp}
          maxHp={myFighter.maxHp}
          energy={fi.energy}
          state={state}
          shake={shakeRight}
        />
      </div>

      <Card className={styles.log}>
        {turnLog.map((l, i) => (
          <p key={i} className={styles.logLine}>{l}</p>
        ))}
      </Card>

      <BattleMoveButtons
        onMove={onMove}
        disabled={disabled}
        waiting={waiting}
      />
    </div>
  );
}
