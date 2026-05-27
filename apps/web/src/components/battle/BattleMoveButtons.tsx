import { Button } from "../ui/Button.js";
import styles from "./BattleMoveButtons.module.css";

interface BattleMoveButtonsProps {
  onMove: (move: "atacar" | "defender" | "esquivar" | "huir") => void;
  disabled?: boolean;
  waiting?: boolean;
}

export function BattleMoveButtons({ onMove, disabled, waiting }: BattleMoveButtonsProps) {
  if (waiting) {
    return (
      <div className={styles.waiting}>
        <span>Esperando oponente...</span>
      </div>
    );
  }

  return (
    <div className={styles.buttons}>
      <Button
        variant="danger"
        onClick={() => onMove("atacar")}
        disabled={disabled}
      >
        ⚔ Atacar
      </Button>
      <Button
        variant="secondary"
        onClick={() => onMove("defender")}
        disabled={disabled}
      >
        🛡 Defender
      </Button>
      <Button
        variant="secondary"
        onClick={() => onMove("esquivar")}
        disabled={disabled}
      >
        💨 Esquivar
      </Button>
      <Button
        variant="ghost"
        onClick={() => onMove("huir")}
        disabled={disabled}
      >
        🏃 Huir
      </Button>
    </div>
  );
}
