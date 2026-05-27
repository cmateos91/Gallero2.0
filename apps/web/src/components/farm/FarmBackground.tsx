import { useEffect, useState } from "react";
import styles from "./FarmBackground.module.css";

export function FarmBackground() {
  const [hour, setHour] = useState(new Date().getHours());

  useEffect(() => {
    const t = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(t);
  }, []);

  const isDay = hour >= 6 && hour < 18;
  const isDusk = hour >= 18 && hour < 20;
  const bg = isDay
    ? "linear-gradient(180deg, #87CEEB 0%, #E0F0E0 100%)"
    : isDusk
    ? "linear-gradient(180deg, #FF7F50 0%, #8B4513 100%)"
    : "linear-gradient(180deg, #191970 0%, #2C3E50 100%)";

  return <div className={styles.bg} style={{ background: bg }} />;
}
