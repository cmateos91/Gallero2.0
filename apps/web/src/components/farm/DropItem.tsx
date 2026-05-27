import styles from "./DropItem.module.css";

interface DropItemProps {
  type: "feather" | "grasshopper" | "poop";
  x: number;
  y: number;
  onClick: () => void;
}

const ICONS: Record<string, string> = {
  feather: "🪶",
  grasshopper: "🦗",
  poop: "💩",
};

export function DropItem({ type, x, y, onClick }: DropItemProps) {
  return (
    <button
      className={styles.drop}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={onClick}
    >
      {ICONS[type]}
    </button>
  );
}
