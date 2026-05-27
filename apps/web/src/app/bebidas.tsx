import useSWR from "swr";
import { fetchInventory, buyItem } from "../lib/api/inventory.js";
import { ShopItemCard } from "../components/shop/ShopItemCard.js";
import { useToast } from "../context/toast.js";
import styles from "./comida.module.css";

export function Bebidas() {
  const { data, mutate } = useSWR("/api/inventory", () => fetchInventory());
  const { pushToast } = useToast();

  const items = data?.items ?? [];
  const aguaQty = items.find((i) => i.itemKey === "agua")?.quantity ?? 0;

  async function handleBuy() {
    try {
      await buyItem("agua", 1);
      pushToast("Agua comprada", "success");
      void mutate();
    } catch {
      pushToast("Error al comprar", "error");
    }
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Tienda de Bebidas</h2>
      <ShopItemCard
        name="Agua"
        price={8}
        owned={aguaQty}
        icon="💧"
        onBuy={handleBuy}
      />
    </div>
  );
}
