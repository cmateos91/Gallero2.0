import useSWR from "swr";
import { fetchInventory, buyItem, refillInventory } from "../lib/api/inventory.js";
import { ShopItemCard } from "../components/shop/ShopItemCard.js";
import { Button } from "../components/ui/Button.js";
import { useToast } from "../context/toast.js";
import styles from "./comida.module.css";

const FOODS = [
  { key: "comida_basica", name: "Pienso básico", price: 12, icon: "🌾" },
  { key: "comida_premium", name: "Pienso premium", price: 30, icon: "🌽" },
];

export function Comida() {
  const { data, mutate } = useSWR("/api/inventory", () => fetchInventory());
  const { pushToast } = useToast();

  const items = data?.items ?? [];
  function getQty(key: string) {
    return items.find((i) => i.itemKey === key)?.quantity ?? 0;
  }

  async function handleBuy(key: string) {
    try {
      await buyItem(key, 1);
      pushToast("Comprado", "success");
      void mutate();
    } catch {
      pushToast("Error al comprar. ¿Monedas?", "error");
    }
  }

  async function handleRefill() {
    try {
      await refillInventory();
      pushToast("Reabastecimiento diario (+3 básico, +2 agua)", "success");
      void mutate();
    } catch {
      pushToast("Ya reclamaste hoy", "error");
    }
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Tienda de Comida</h2>

      <Button variant="ghost" onClick={handleRefill}>
        Reabastecer gratis (diario)
      </Button>

      {FOODS.map((f) => (
        <ShopItemCard
          key={f.key}
          name={f.name}
          price={f.price}
          owned={getQty(f.key)}
          icon={f.icon}
          onBuy={() => handleBuy(f.key)}
        />
      ))}
    </div>
  );
}
