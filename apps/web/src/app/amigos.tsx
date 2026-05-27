import { useState } from "react";
import useSWR from "swr";
import {
  fetchFriends,
  fetchFriendRequests,
  searchPlayers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from "../lib/api/friends.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import { Badge } from "../components/ui/Badge.js";
import { useToast } from "../context/toast.js";
import styles from "./amigos.module.css";

export function Amigos() {
  const { data: friendsData, mutate: mutateFriends } = useSWR(
    "/api/friends",
    () => fetchFriends(),
  );
  const { data: requestsData, mutate: mutateRequests } = useSWR(
    "/api/friends/requests",
    () => fetchFriendRequests(),
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; username: string; mmr: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const { pushToast } = useToast();

  async function handleSearch() {
    if (query.length < 2) return;
    setSearching(true);
    try {
      const res = await searchPlayers(query);
      setResults(res.players);
    } catch {
      pushToast("Error al buscar", "error");
    } finally {
      setSearching(false);
    }
  }

  async function handleSendRequest(userId: string) {
    try {
      await sendFriendRequest(userId);
      pushToast("Solicitud enviada", "success");
    } catch {
      pushToast("Error al enviar solicitud", "error");
    }
  }

  async function handleAccept(requestId: string) {
    try {
      await acceptFriendRequest(requestId);
      pushToast("Solicitud aceptada", "success");
      void mutateFriends();
      void mutateRequests();
    } catch {
      pushToast("Error al aceptar", "error");
    }
  }

  async function handleReject(requestId: string) {
    try {
      await rejectFriendRequest(requestId);
      void mutateRequests();
    } catch {
      pushToast("Error al rechazar", "error");
    }
  }

  async function handleRemove(friendId: string) {
    try {
      await removeFriend(friendId);
      pushToast("Amigo eliminado", "info");
      void mutateFriends();
    } catch {
      pushToast("Error al eliminar", "error");
    }
  }

  const friends = friendsData?.friends ?? [];
  const requests = requestsData?.requests ?? [];

  return (
    <div className={styles.page}>
      <Card className={styles.searchBox}>
        <Input
          placeholder="Buscar jugador..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); }}
        />
        <Button variant="secondary" onClick={handleSearch} loading={searching}>
          Buscar
        </Button>
        {results.length > 0 && (
          <div className={styles.results}>
            {results.map((p) => (
              <div key={p.id} className={styles.resultRow}>
                <span>{p.username}</span>
                <span className={styles.mmr}>{p.mmr} MMR</span>
                <Button variant="ghost" onClick={() => handleSendRequest(p.id)}>+</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {requests.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>
            Solicitudes <Badge variant="warning">{requests.length}</Badge>
          </h3>
          {requests.map((r) => (
            <Card key={r.id} padding="sm" className={styles.row}>
              <span className={styles.name}>{r.sender.username}</span>
              <div className={styles.rowActions}>
                <Button variant="secondary" onClick={() => handleAccept(r.id)}>✓</Button>
                <Button variant="danger" onClick={() => handleReject(r.id)}>✕</Button>
              </div>
            </Card>
          ))}
        </section>
      )}

      <section>
        <h3 className={styles.sectionTitle}>Amigos ({friends.length})</h3>
        {friends.length === 0 && (
          <p className={styles.empty}>No tienes amigos aún. ¡Busca jugadores!</p>
        )}
        {friends.map((f) => (
          <Card key={f.id} padding="sm" className={styles.row}>
            <span className={styles.name}>{f.username}</span>
            <span className={styles.mmr}>{f.mmr} MMR</span>
            <Button variant="danger" onClick={() => handleRemove(f.id)}>✕</Button>
          </Card>
        ))}
      </section>
    </div>
  );
}
