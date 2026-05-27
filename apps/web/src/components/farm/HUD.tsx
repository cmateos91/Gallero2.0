import styles from "./HUD.module.css";

interface HUDProps {
  coins: number;
  selectedName: string;
  hunger: number;
  thirst: number;
  health: number;
  growth: number;
}

export function HUD({ coins, selectedName, hunger, thirst, health, growth }: HUDProps) {
  return (
    <div className={styles.hud}>
      <div className={styles.coins}>🪙 {coins}</div>
      {selectedName && (
        <div className={styles.bars}>
          <span className={styles.name}>{selectedName}</span>
          <div className={styles.barRow}><span>🍞</span><div className={styles.bar}><div className={styles.fill} style={{ width: `${hunger}%`, background: "#e67e22" }} /></div></div>
          <div className={styles.barRow}><span>💧</span><div className={styles.bar}><div className={styles.fill} style={{ width: `${thirst}%`, background: "#3498db" }} /></div></div>
          <div className={styles.barRow}><span>❤</span><div className={styles.bar}><div className={styles.fill} style={{ width: `${health}%`, background: "#e74c3c" }} /></div></div>
          {growth < 100 && (
            <div className={styles.barRow}><span>🌱</span><div className={styles.bar}><div className={styles.fill} style={{ width: `${growth}%`, background: "#2ecc71" }} /></div></div>
          )}
        </div>
      )}
    </div>
  );
}
