import type { RoosterDto } from "../../types/api.js";
import { Badge } from "../ui/Badge.js";
import styles from "./RoosterCard.module.css";

const QUALITY_COLORS: Record<string, string> = {
  Común: "#aaa",
  Normal: "#4a9",
  Raro: "#48f",
  Legendario: "#f80",
};

const NATURE_LABELS: Record<string, string> = {
  AGRESIVO: "⚔",
  DEFENSIVO: "🛡",
  VELOZ: "💨",
  ROBUSTO: "💪",
  EQUILIBRADO: "⚖",
};

interface RoosterCardProps {
  rooster: RoosterDto;
  draggable?: boolean;
  onDragStart?: (id: string) => void;
  onClick?: () => void;
  selected?: boolean;
  isFusionTarget?: boolean;
}

export function RoosterCard({
  rooster,
  draggable,
  onDragStart,
  onClick,
  selected,
  isFusionTarget,
}: RoosterCardProps) {
  const qualityColor = QUALITY_COLORS[rooster.quality] ?? "#aaa";
  const avgStats = Math.round((rooster.attack + rooster.defense + rooster.speed + rooster.resistance) / 4);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/plain", rooster.id);
    onDragStart?.(rooster.id);
  }

  return (
    <div
      className={[
        styles.card,
        selected ? styles.selected : "",
        isFusionTarget ? styles.fusionTarget : "",
        rooster.isDead ? styles.dead : "",
      ].join(" ")}
      draggable={draggable}
      onDragStart={handleDragStart}
      onClick={onClick}
    >
      <div className={styles.sprite} style={{ borderColor: qualityColor }}>
        <div className={styles.body} style={{ background: qualityColor }}>
          {rooster.isDead && <span className={styles.skull}>💀</span>}
          {!rooster.isDead && rooster.stage === "HUEVO" && <span className={styles.egg}>🥚</span>}
        </div>
      </div>
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{rooster.name}</span>
          {rooster.nature && (
            <span title={rooster.nature}>{NATURE_LABELS[rooster.nature] ?? rooster.nature}</span>
          )}
        </div>
        <div className={styles.meta}>
          <Badge variant="default">{rooster.stage}</Badge>
          <Badge variant={rooster.quality === "Legendario" ? "warning" : "default"}>
            {rooster.quality}
          </Badge>
          <span className={styles.avg}>⚡{avgStats}</span>
        </div>
        {!rooster.isDead && (
          <div className={styles.needs}>
            <span className={styles.need} title="Hambre">🍞 {rooster.hungerValue}</span>
            <span className={styles.need} title="Sed">💧 {rooster.thirstValue}</span>
          </div>
        )}
        {rooster.isDead && <span className={styles.deadLabel}>Muerto</span>}
      </div>
    </div>
  );
}
