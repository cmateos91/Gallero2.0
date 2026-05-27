import useSWR from "swr";
import { fetchProfile, claimWeeklyReward } from "../lib/api/profile.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge } from "../components/ui/Badge.js";
import { useToast } from "../context/toast.js";
import styles from "./perfil.module.css";

export function Perfil() {
  const { data, mutate } = useSWR("/api/profile/me", () => fetchProfile());
  const { pushToast } = useToast();

  if (!data) {
    return <div className={styles.loading}><div className={styles.spinner} /></div>;
  }

  async function handleClaimWeekly() {
    try {
      await claimWeeklyReward();
      pushToast("¡Premio semanal reclamado! +100 monedas", "success");
      void mutate();
    } catch {
      pushToast("Ya reclamaste el premio esta semana", "error");
    }
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.avatar}>
          {data.username.charAt(0).toUpperCase()}
        </div>
        <h2 className={styles.username}>{data.username}</h2>
      </Card>

      <div className={styles.grid}>
        <Card padding="sm" className={styles.stat}>
          <span className={styles.statValue}>{data.mmr}</span>
          <span className={styles.statLabel}>MMR</span>
        </Card>
        <Card padding="sm" className={styles.stat}>
          <span className={styles.statValue}>{data.coins}</span>
          <span className={styles.statLabel}>Monedas</span>
        </Card>
        <Card padding="sm" className={styles.stat}>
          <span className={styles.statValue}>{data.roostersCount}</span>
          <span className={styles.statLabel}>Gallos</span>
        </Card>
        <Card padding="sm" className={styles.stat}>
          <span className={styles.statValue}>{data.fightsCount}</span>
          <span className={styles.statLabel}>Combates</span>
        </Card>
        <Card padding="sm" className={styles.stat}>
          <span className={styles.statValue}>{data.towerHighFloor}</span>
          <span className={styles.statLabel}>Piso récord</span>
        </Card>
        <Card padding="sm" className={styles.stat}>
          <div className={styles.streakRow}>
            <span className={styles.statValue}>{data.streakDays}</span>
            <Badge variant={data.streakDays >= 7 ? "success" : "default"}>🔥</Badge>
          </div>
          <span className={styles.statLabel}>Racha (días)</span>
        </Card>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={handleClaimWeekly}>
          Premio semanal (+100 🪙)
        </Button>
      </div>

      <p className={styles.member}>
        Miembro desde {new Date(data.createdAt).toLocaleDateString("es-ES")}
      </p>
    </div>
  );
}
