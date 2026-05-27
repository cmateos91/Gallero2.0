import useSWR from "swr";
import { fetchRoosters } from "../lib/api/roosters.js";
import { EggCard } from "../components/roosters/EggCard.js";
import styles from "./roosters.module.css";

export function Roosters() {
  const { data, mutate } = useSWR("/api/roosters", () => fetchRoosters());
  const eggs = (data?.roosters ?? []).filter((r) => r.stage === "HUEVO");

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Sala de Huevos</h2>
      {eggs.length === 0 && (
        <p className={styles.empty}>No tienes huevos. ¡Compra en la tienda!</p>
      )}
      <div className={styles.tray}>
        {eggs.map((egg) => (
          <EggCard key={egg.id} egg={egg} onUpdated={() => void mutate()} />
        ))}
      </div>
    </div>
  );
}
