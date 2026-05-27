import useSWR from "swr";
import { fetchLeaderboard } from "../lib/api/ranking.js";
import { sendFriendRequest } from "../lib/api/friends.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { useToast } from "../context/toast.js";
import styles from "./ranking.module.css";

const MEDALS = ["🥇", "🥈", "🥉"];

export function Ranking() {
  const { data, mutate } = useSWR("/api/ranking/leaderboard", () => fetchLeaderboard());
  const { pushToast } = useToast();

  if (!data) {
    return <div className={styles.loading}><div className={styles.spinner} /></div>;
  }

  const top3 = data.leaderboard.slice(0, 3);
  const rest = data.leaderboard.slice(3);

  async function handleAddFriend(userId: string) {
    try {
      await sendFriendRequest(userId);
      pushToast("Solicitud enviada", "success");
      void mutate();
    } catch {
      pushToast("No se pudo enviar la solicitud", "error");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.podium}>
        {top3.map((p, i) => (
          <Card key={p.id} className={styles.podiumCard}>
            <span className={styles.medal}>{MEDALS[i]}</span>
            <p className={styles.podiumName}>{p.username}</p>
            <p className={styles.podiumMmr}>{p.mmr} MMR</p>
          </Card>
        ))}
      </div>

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span>#</span><span>Jugador</span><span>MMR</span><span>Torre</span><span></span>
        </div>
        {rest.map((p, i) => (
          <div key={p.id} className={styles.tableRow}>
            <span className={styles.rank}>{i + 4}</span>
            <span className={styles.name}>{p.username}</span>
            <span className={styles.mmr}>{p.mmr}</span>
            <span className={styles.tower}>🏰 {p.towerHighFloor}</span>
            <Button variant="ghost" onClick={() => handleAddFriend(p.id)}>
              +
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
