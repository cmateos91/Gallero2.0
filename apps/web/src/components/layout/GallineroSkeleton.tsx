import { Card } from "../ui/Card.js";
import styles from "./GallineroSkeleton.module.css";

export function GallineroSkeleton() {
  return (
    <div className={styles.wrapper}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} padding="sm" className={styles.card}>
          <div className={styles.circle} />
          <div className={styles.lines}>
            <div className={styles.line} />
            <div className={styles.lineShort} />
          </div>
        </Card>
      ))}
    </div>
  );
}
