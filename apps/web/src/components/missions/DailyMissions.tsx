import useSWR from "swr";
import { fetchDailyMissions, claimMission } from "../../lib/api/missions.js";
import { Card } from "../ui/Card.js";
import { Button } from "../ui/Button.js";
import { Badge } from "../ui/Badge.js";
import { useToast } from "../../context/toast.js";
import styles from "./DailyMissions.module.css";

export function DailyMissions() {
  const { data, mutate } = useSWR("/api/missions/daily", () => fetchDailyMissions());
  const { pushToast } = useToast();

  if (!data) return null;

  const { missions, progress } = data;
  const claimed = new Set(progress.claimed);

  function getProgress(key: string): number {
    if (key === "WIN_2_FIGHTS") return progress.fightsWon;
    if (key === "FEED_3_TIMES") return progress.feedings;
    if (key === "TRAIN_ONCE") return progress.trainings;
    return 0;
  }

  async function handleClaim(key: string) {
    try {
      const res = await claimMission(key);
      const msg = res.streakBonus > 0
        ? `¡+${res.coinsAwarded} monedas! (Racha +${res.streakBonus})`
        : `¡+${res.coinsAwarded} monedas!`;
      pushToast(msg, "success");
      void mutate();
    } catch {
      pushToast("No puedes reclamar esta misión", "error");
    }
  }

  return (
    <div className={styles.wrapper}>
      {missions.map((m) => {
        const done = getProgress(m.key) >= m.target;
        const isClaimed = claimed.has(m.key);
        return (
          <Card key={m.key} padding="sm" className={styles.card}>
            <div className={styles.info}>
              <span className={styles.desc}>{m.description}</span>
              <span className={styles.progress}>
                {getProgress(m.key)}/{m.target}
              </span>
              {isClaimed && <Badge variant="success">✓</Badge>}
            </div>
            {done && !isClaimed && (
              <Button variant="secondary" onClick={() => handleClaim(m.key)}>
                +{m.reward} 🪙
              </Button>
            )}
            {!done && (
              <div className={styles.bar}>
                <div
                  className={styles.fill}
                  style={{ width: `${Math.min(100, (getProgress(m.key) / m.target) * 100)}%` }}
                />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
