import type { CombatState } from "../../types/api.js";
import styles from "./BattleHpCard.module.css";

interface BattleHpCardProps {
  side: "left" | "right";
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  energy: number;
  state: CombatState;
  shake?: boolean;
}

export function BattleHpCard({
  side,
  name,
  level,
  hp,
  maxHp,
  energy,
  shake,
}: BattleHpCardProps) {
  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const hpColor =
    hpPct > 50 ? "#2ecc71" : hpPct > 25 ? "#f39c12" : "#e74c3c";

  return (
    <div className={[styles.card, styles[side], shake ? styles.shake : ""].join(" ")}>
      <div className={styles.header}>
        <span className={styles.name}>{name}</span>
        <span className={styles.level}>Nv.{level}</span>
      </div>
      <div className={styles.hpBar}>
        <div
          className={styles.hpFill}
          style={{ width: `${hpPct}%`, background: hpColor }}
        />
        <div className={styles.hpGhost} style={{ width: `${hpPct}%` }} />
      </div>
      <span className={styles.hpText}>
        {hp}/{maxHp}
      </span>
      <div className={styles.energyBar}>
        <div
          className={styles.energyFill}
          style={{ width: `${energy}%` }}
        />
      </div>
    </div>
  );
}
