import { useState } from "react";
import useSWR from "swr";
import { fetchEggShop, buyEgg, claimFreeEgg, fetchRoosters } from "../lib/api/roosters.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge } from "../components/ui/Badge.js";
import { useToast } from "../context/toast.js";
import type { EggTier } from "../types/api.js";
import styles from "./huevos.module.css";

const PROBABILITIES: Record<string, Record<string, number>> = {
  MISTERIOSO: { Común: 50, Normal: 35, Raro: 13, Legendario: 2 },
  SELECTO: { Común: 10, Normal: 40, Raro: 35, Legendario: 15 },
  DORADO: { Común: 0, Normal: 15, Raro: 50, Legendario: 35 },
};

const QUALITY_COLORS: Record<string, string> = { Común: "#aaa", Normal: "#4a9", Raro: "#48f", Legendario: "#f80" };

export function Huevos() {
  const { data: shopData } = useSWR("/api/roosters/egg-shop", () => fetchEggShop());
  const { data: roostersData, mutate: mutateRoosters } = useSWR("/api/roosters", () => fetchRoosters());
  const [buying, setBuying] = useState("");
  const { pushToast } = useToast();

  const tierNames: Record<string, string> = {
    MISTERIOSO: "Misterioso",
    SELECTO: "Selecto",
    DORADO: "Dorado",
  };

  const roosterCount = (roostersData?.roosters ?? []).filter((r) => !r.isDead).length;
  const eggCount = (roostersData?.roosters ?? []).filter((r) => r.stage === "HUEVO").length;

  async function handleBuy(tier: string) {
    setBuying(tier);
    try {
      const res = await buyEgg(tier);
      pushToast(`¡Huevo ${tierNames[tier] ?? tier} comprado!`, "success");
      void res;
      void mutateRoosters();
    } catch {
      pushToast("Error al comprar. ¿Tienes monedas suficientes?", "error");
    } finally {
      setBuying("");
    }
  }

  async function handleFree() {
    setBuying("free");
    try {
      const res = await claimFreeEgg();
      pushToast("¡Huevo gratis reclamado!", "success");
      void res;
      void mutateRoosters();
    } catch {
      pushToast("No puedes reclamar huevo gratis ahora", "error");
    } finally {
      setBuying("");
    }
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Tienda de Huevos</h2>
      <p className={styles.subtitle}>
        {roosterCount} gallos · {eggCount} huevos activos · Máx 5 huevos
      </p>

      <div className={styles.eggs}>
        {(shopData?.tiers ?? []).map((tier: EggTier) => {
          const probs = PROBABILITIES[tier.tier] ?? {};
          const maxReached = eggCount >= 5;
          return (
            <Card key={tier.tier} className={styles.eggCard}>
              <h3 className={styles.tierName}>{tierNames[tier.tier] ?? tier.tier}</h3>
              <div className={styles.price}>{tier.price} 🪙</div>
              <div className={styles.probs}>
                {Object.entries(probs).map(([q, p]) => (
                  <div key={q} className={styles.probRow}>
                    <span className={styles.qualityName}>{q}</span>
                    <div className={styles.probBar}>
                      <div className={styles.probFill} style={{ width: `${p}%`, background: QUALITY_COLORS[q] ?? "#aaa" }} />
                    </div>
                    <span className={styles.probNum}>{p}%</span>
                  </div>
                ))}
              </div>
              <Button
                variant="primary"
                onClick={() => handleBuy(tier.tier)}
                loading={buying === tier.tier}
                disabled={maxReached}
              >
                {maxReached ? "Máx huevos" : "Comprar"}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className={styles.free}>
        <Badge variant="success">Diario</Badge>
        <Button
          variant="secondary"
          onClick={handleFree}
          loading={buying === "free"}
          disabled={eggCount >= 3}
        >
          Huevo gratis
        </Button>
        {eggCount >= 3 && <span className={styles.note}>(&lt;3 huevos requerido)</span>}
      </div>
    </div>
  );
}
