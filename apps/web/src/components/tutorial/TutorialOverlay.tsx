import type { ReactNode } from "react";
import { Card } from "../ui/Card.js";
import styles from "./TutorialOverlay.module.css";

interface TutorialOverlayProps {
  scene: string;
  title: string;
  text: string;
  children: ReactNode;
  onDismiss: () => void;
}

export function TutorialOverlay({ title, text, children, onDismiss }: TutorialOverlayProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onDismiss} />
      <div className={styles.content}>
        {children}
        <Card className={styles.card}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.text}>{text}</p>
          <button className={styles.dismiss} onClick={onDismiss}>
            ¡Entendido!
          </button>
        </Card>
      </div>
    </div>
  );
}
