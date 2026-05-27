import useSWR from "swr";
import { fetchCosmeticsCatalog, fetchMyCosmetics, buyCosmetic, equipCosmetic, unequipCosmetic } from "../lib/api/cosmetics.js";
import { fetchRoosters } from "../lib/api/roosters.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge } from "../components/ui/Badge.js";
import { useToast } from "../context/toast.js";
import type { CosmeticItemDto, EquippedCosmeticDto, RoosterDto } from "../types/api.js";
import styles from "./ropa.module.css";

const SLOTS = ["CRESTA", "ALAS", "BARBA", "CUERPO", "COLA"];
const SLOT_ICONS: Record<string, string> = {
  CRESTA: "👑", ALAS: "🪶", BARBA: "🧔", CUERPO: "🎨", COLA: "🪶",
};

export function Ropa() {
  const { data: catalogData } = useSWR("/api/cosmetics", () => fetchCosmeticsCatalog());
  const { data: myData, mutate: mutateMy } = useSWR("/api/cosmetics/mine", () => fetchMyCosmetics());
  const { data: roostersData } = useSWR("/api/roosters", () => fetchRoosters());
  const { pushToast } = useToast();

  const catalog = catalogData?.catalog ?? [];
  const owned = new Set((myData?.owned ?? []).map((o) => o.cosmetic.id));
  const equippedByRooster: Map<string, EquippedCosmeticDto[]> = new Map();
  (myData?.equipped ?? []).forEach((eq) => {
    const arr = equippedByRooster.get(eq.roosterId) ?? [];
    arr.push(eq);
    equippedByRooster.set(eq.roosterId, arr);
  });
  const roosters = (roostersData?.roosters ?? []).filter((r) => !r.isDead);

  async function handleBuy(item: CosmeticItemDto) {
    try {
      await buyCosmetic(item.id);
      pushToast(`${item.name} comprado`, "success");
      void mutateMy();
    } catch {
      pushToast("Error al comprar", "error");
    }
  }

  async function handleEquip(item: CosmeticItemDto, rooster: RoosterDto) {
    try {
      await equipCosmetic(item.id, rooster.id);
      pushToast(`${item.name} equipado en ${rooster.name}`, "success");
      void mutateMy();
    } catch {
      pushToast("Error al equipar", "error");
    }
  }

  async function handleUnequip(item: CosmeticItemDto, roosterId: string) {
    try {
      await unequipCosmetic(item.id, roosterId, item.slot);
      pushToast(`${item.name} desequipado`, "success");
      void mutateMy();
    } catch {
      pushToast("Error al desequipar", "error");
    }
  }

  function isEquippedOn(cosmeticId: string, roosterId: string) {
    return (equippedByRooster.get(roosterId) ?? []).some((e) => e.cosmetic.id === cosmeticId);
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Tienda de Ropa</h2>

      {SLOTS.map((slot) => {
        const items = catalog.filter((c) => c.slot === slot);
        if (items.length === 0) return null;
        return (
          <section key={slot}>
            <h3 className={styles.slotTitle}>{SLOT_ICONS[slot]} {slot}</h3>
            <div className={styles.items}>
              {items.map((item) => (
                <Card key={item.id} padding="sm" className={styles.itemCard}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemPrice}>{item.price} 🪙</span>
                    <Badge>{item.rarity}</Badge>
                  </div>
                  {owned.has(item.id) ? (
                    <div className={styles.equipSection}>
                      <select
                        className={styles.roosterSelect}
                        onChange={(e) => {
                          const r = roosters.find((r) => r.id === e.target.value);
                          if (r) handleEquip(item, r);
                        }}
                        value=""
                      >
                        <option value="">Equipar en...</option>
                        {roosters.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} {isEquippedOn(item.id, r.id) ? "✓" : ""}
                          </option>
                        ))}
                      </select>
                      {roosters.map((r) =>
                        isEquippedOn(item.id, r.id) ? (
                          <Button key={r.id} variant="ghost" onClick={() => handleUnequip(item, r.id)}>
                            Quitar de {r.name}
                          </Button>
                        ) : null,
                      )}
                    </div>
                  ) : (
                    <Button variant="secondary" onClick={() => handleBuy(item)}>
                      Comprar
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
