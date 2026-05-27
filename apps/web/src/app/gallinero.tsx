import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetchRoosters } from "../lib/api/roosters.js";
import { RoosterCard } from "../components/gallinero/RoosterCard.js";
import { RoosterDetailModal } from "../components/gallinero/RoosterDetailModal.js";
import { FusionModal } from "../components/gallinero/FusionModal.js";
import { Input } from "../components/ui/Input.js";
import { Button } from "../components/ui/Button.js";
import styles from "./gallinero.module.css";

type SortKey = "createdAt" | "name" | "nature" | "avgStats" | "stage";

export function Gallinero() {
  const { data, mutate } = useSWR("/api/roosters", () => fetchRoosters());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [fusionOpen, setFusionOpen] = useState(false);

  const roosters = data?.roosters ?? [];

  const filtered = useMemo(() => {
    let list = [...roosters];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "nature") return (a.nature ?? "").localeCompare(b.nature ?? "");
      if (sort === "stage") return a.stage.localeCompare(b.stage);
      if (sort === "avgStats") {
        const avgA = (a.attack + a.defense + a.speed + a.resistance) / 4;
        const avgB = (b.attack + b.defense + b.speed + b.resistance) / 4;
        return avgB - avgA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [roosters, search, sort]);

  const pageSize = 6;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageItems = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const selectedRooster = roosters.find((r) => r.id === selected) ?? null;
  const adults = roosters.filter((r) => r.stage === "ADULTO" && !r.isDead);

  function handleDragStart(id: string) {
    /* drag handled via HTML5 DnD */
    void id;
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    /* reorder handled via position update API */
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Input
          placeholder="Buscar gallo..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
        <select
          className={styles.sort}
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="createdAt">Creación</option>
          <option value="name">Nombre</option>
          <option value="nature">Naturaleza</option>
          <option value="avgStats">Stats</option>
          <option value="stage">Etapa</option>
        </select>
        {adults.length >= 2 && (
          <Button variant="secondary" onClick={() => setFusionOpen(true)}>
            Fusionar
          </Button>
        )}
      </div>

      {filtered.length === 0 && (
        <p className={styles.empty}>No hay gallos. ¡Consigue huevos en la tienda!</p>
      )}

      <div className={styles.shelf} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        {pageItems.map((r) => (
          <RoosterCard
            key={r.id}
            rooster={r}
            draggable
            onDragStart={handleDragStart}
            onClick={() => setSelected(r.id)}
            selected={selected === r.id}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>
            ←
          </Button>
          <span className={styles.pageNum}>{page + 1} / {totalPages}</span>
          <Button variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            →
          </Button>
        </div>
      )}

      {selectedRooster && (
        <RoosterDetailModal
          rooster={selectedRooster}
          open={selected !== null}
          onClose={() => setSelected(null)}
          onUpdated={() => void mutate()}
          onFusionSelect={() => { setFusionOpen(true); }}
        />
      )}

      <FusionModal
        adults={adults}
        open={fusionOpen}
        onClose={() => setFusionOpen(false)}
        onFused={() => { setFusionOpen(false); void mutate(); }}
      />
    </div>
  );
}
