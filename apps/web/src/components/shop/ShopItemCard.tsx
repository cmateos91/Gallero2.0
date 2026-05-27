import { Button } from "../ui/Button.js";
import styles from "./ShopItemCard.module.css";

interface ShopItemCardProps {
  name: string;
  price: number;
  owned: number;
  icon: string;
  onBuy: () => void;
  loading?: boolean;
}

export function ShopItemCard({ name, price, owned, icon, onBuy, loading }: ShopItemCardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.icon}>{icon}</span>
      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        <span className={styles.price}>{price} 🪙</span>
        <span className={styles.owned}>Tienes: {owned}</span>
      </div>
      <Button variant="secondary" onClick={onBuy} loading={loading}>
        +1
      </Button>
    </div>
  );
}
