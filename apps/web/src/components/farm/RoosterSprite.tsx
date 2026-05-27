import type { RoosterDto } from "../../types/api.js";
import styles from "./RoosterSprite.module.css";

const QUALITY_COLORS: Record<string, string> = {
  Común: "#aaa", Normal: "#4a9", Raro: "#48f", Legendario: "#f80",
};

interface RoosterSpriteProps {
  rooster: RoosterDto;
  size?: number;
  sleeping?: boolean;
  style?: React.CSSProperties;
}

export function RoosterSprite({ rooster, size = 80, sleeping, style }: RoosterSpriteProps) {
  const color = (rooster.customColors as Record<string, string>)?.body ?? QUALITY_COLORS[rooster.quality] ?? "#aaa";
  const crestColor = (rooster.customColors as Record<string, string>)?.cresta ?? "#e74c3c";

  return (
    <div
      className={[styles.sprite, sleeping ? styles.sleeping : ""].join(" ")}
      style={{ width: size, height: size, ...style }}
    >
      <div className={styles.crest} style={{ background: crestColor }} />
      <div className={styles.body} style={{ background: color }}>
        <div className={styles.eyes}>
          <div className={[styles.eye, sleeping ? styles.eyeClosed : ""].join(" ")} />
          <div className={[styles.eye, sleeping ? styles.eyeClosed : ""].join(" ")} />
        </div>
        <div className={styles.beak} />
      </div>
      <div className={styles.legs}>
        <div className={styles.leg} />
        <div className={styles.leg} />
      </div>
    </div>
  );
}
