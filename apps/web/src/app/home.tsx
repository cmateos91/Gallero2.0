import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { fetchRoosters, careRooster, feedRooster, drinkRooster, updateRoosterPosition } from "../lib/api/roosters.js";
import { rollFeather, collectFeather } from "../lib/api/auth.js";
import { FarmBackground } from "../components/farm/FarmBackground.js";
import { RoosterSprite } from "../components/farm/RoosterSprite.js";
import { DropItem } from "../components/farm/DropItem.js";
import { HUD } from "../components/farm/HUD.js";
import { DailyMissions } from "../components/missions/DailyMissions.js";
import { useAuth } from "../context/auth.js";
import { useToast } from "../context/toast.js";
import type { RoosterDto } from "../types/api.js";
import styles from "./home.module.css";

interface Drop {
  id: string;
  type: "feather" | "grasshopper" | "poop";
  x: number;
  y: number;
  featherId?: string;
}

export function Home() {
  const { user } = useAuth();
  const { data, mutate } = useSWR("/api/roosters", () => fetchRoosters());
  const { pushToast } = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [isNight, setIsNight] = useState(false);

  const roosters = data?.roosters ?? [];
  const homeRoosters = roosters.filter((r) => r.isAtHome && !r.isDead);
  const selected = roosters.find((r) => r.id === selectedId) ?? null;

  useEffect(() => {
    const t = setInterval(() => {
      const h = new Date().getHours();
      setIsNight(h < 6 || h >= 22);
    }, 60000);
    setIsNight(new Date().getHours() < 6 || new Date().getHours() >= 22);
    return () => clearInterval(t);
  }, []);

  const spawnFeatherDrop = useCallback(async () => {
    try {
      const res = await rollFeather("home");
      if (res.spawned && res.id) {
        setDrops((prev) => [
          ...prev,
          { id: res.id as string, type: "feather" as const, x: res.xPct ?? 50, y: res.yPct ?? 50, featherId: res.id },
        ]);
      }
    } catch { /* cooldown */ }
  }, []);

  useEffect(() => {
    const t = setInterval(spawnFeatherDrop, 95000);
    void spawnFeatherDrop();
    return () => clearInterval(t);
  }, [spawnFeatherDrop]);

  useEffect(() => {
    if (homeRoosters.length === 0) return;
    const t = setInterval(() => {
      setDrops((prev) => {
        const newDrop: Drop = {
          id: `gh-${Date.now()}`,
          type: Math.random() > 0.4 ? "poop" : "grasshopper",
          x: 10 + Math.random() * 80,
          y: 50 + Math.random() * 40,
        };
        return [...prev, newDrop].slice(-9);
      });
    }, 30000); // 30s for demo
    return () => clearInterval(t);
  }, [homeRoosters.length]);

  function handleTapRooster(rooster: RoosterDto) {
    setSelectedId(rooster.id);
    careRooster(rooster.id).then(() => {
      pushToast(`Acariciaste a ${rooster.name}`, "success");
      void mutate();
    }).catch(() => {});
  }

  function handleDropClick(drop: Drop) {
    setDrops((prev) => prev.filter((d) => d.id !== drop.id));
    if (drop.type === "feather" && drop.featherId) {
      collectFeather(drop.featherId).then(() => {
        pushToast("+1 moneda", "success");
        void mutate();
      }).catch(() => {});
    } else if (drop.type === "grasshopper") {
      pushToast("+1 saltamontes", "info");
    }
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const rect = (e.target as HTMLElement).closest(`.${styles.ground}`)?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    updateRoosterPosition(id, { positionX: x, positionY: y, homeScreen: "center" })
      .then(() => mutate())
      .catch(() => {});
  }

  return (
    <div className={styles.page}>
      <FarmBackground />
      <div className={styles.swipeContainer}>
        <div className={styles.screen}>
          <HUD
            coins={user?.coins ?? 0}
            selectedName={selected?.name ?? ""}
            hunger={selected?.hungerValue ?? 0}
            thirst={selected?.thirstValue ?? 0}
            health={selected?.healthValue ?? 0}
            growth={selected?.growthProgress ?? 0}
          />
          <div
            className={styles.ground}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {homeRoosters.map((r) => (
              <div
                key={r.id}
                className={styles.rooster}
                style={{
                  left: `${r.positionX ?? 50}%`,
                  top: `${r.positionY ?? 60}%`,
                  transform: r.id === selectedId ? "scale(1.2)" : "scale(1)",
                  zIndex: r.id === selectedId ? 5 : 1,
                }}
                draggable
                onDragStart={(e) => handleDragStart(e, r.id)}
                onClick={(e) => { e.stopPropagation(); handleTapRooster(r); }}
              >
                <RoosterSprite rooster={r} sleeping={isNight} />
                <span className={styles.label}>{r.name}</span>
              </div>
            ))}
            {drops.map((d) => (
              <DropItem key={d.id} type={d.type} x={d.x} y={d.y} onClick={() => handleDropClick(d)} />
            ))}
          </div>
        </div>
      </div>
      {selected && (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => {
              feedRooster(selected.id).then(() => { void mutate(); pushToast("Alimentado", "success"); }).catch(() => {});
            }}
          >
            🌾
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => {
              drinkRooster(selected.id).then(() => { void mutate(); pushToast("Hidratado", "success"); }).catch(() => {});
            }}
          >
            💧
          </button>
        </div>
      )}
      <div className={styles.missions}>
        <DailyMissions />
      </div>
    </div>
  );
}
