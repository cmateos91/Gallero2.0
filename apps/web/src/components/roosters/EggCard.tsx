import type { RoosterDto } from "../../types/api.js";
import { EggCountdown } from "./EggCountdown.js";
import { Button } from "../ui/Button.js";
import { Badge } from "../ui/Badge.js";
import { careRooster } from "../../lib/api/roosters.js";
import { useToast } from "../../context/toast.js";
import styles from "./EggCard.module.css";

const QUALITY_COLORS: Record<string, string> = {
  Común: "#aaa",
  Normal: "#4a9",
  Raro: "#48f",
  Legendario: "#f80",
};

interface EggCardProps {
  egg: RoosterDto;
  onUpdated: () => void;
}

export function EggCard({ egg, onUpdated }: EggCardProps) {
  const { pushToast } = useToast();
  const color = QUALITY_COLORS[egg.quality] ?? "#aaa";
  const proximity = egg.hatchReadyAt
    ? Math.max(0, 1 - (new Date(egg.hatchReadyAt).getTime() - Date.now()) / 3600000)
    : 0;
  const wobbleIntensity = Math.min(3, proximity * 8);

  async function handleCare() {
    try {
      await careRooster(egg.id);
      pushToast("+1 Cuidado", "success");
      onUpdated();
    } catch {
      pushToast("Error al cuidar", "error");
    }
  }

  return (
    <div className={styles.card}>
      <div
        className={styles.egg}
        style={{
          borderColor: color,
          animation: proximity > 0 ? `wobble ${String(1 - proximity * 0.8)}s ease-in-out infinite` : "none",
        }}
      >
        <div
          className={styles.inner}
          style={{
            background: color,
            transform: `scale(${1 + wobbleIntensity * 0.05})`,
          }}
        >
          🥚
        </div>
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{egg.name}</span>
        <Badge>{egg.quality}</Badge>
        {egg.hatchReadyAt && (
          <span className={styles.countdown}>
            <EggCountdown hatchReadyAt={egg.hatchReadyAt} />
          </span>
        )}
        <div className={styles.careBar}>
          <div className={styles.careFill} style={{ width: `${egg.careCurrent}%` }} />
        </div>
        <Button variant="secondary" onClick={handleCare}>
          ♥ Cuidar (+{egg.careCurrent})
        </Button>
      </div>
    </div>
  );
}
