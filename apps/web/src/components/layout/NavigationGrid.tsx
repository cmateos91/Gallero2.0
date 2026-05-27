import { useRouteTransition } from "../../context/route-transition.js";
import styles from "./NavigationGrid.module.css";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const items: NavItem[] = [
  { label: "Granja", path: "/", icon: "🏠" },
  { label: "Combate", path: "/fights", icon: "⚔" },
  { label: "PvP", path: "/fights/pvp", icon: "🏟" },
  { label: "Torre", path: "/torre", icon: "🏰" },
  { label: "Gallinero", path: "/gallinero", icon: "🐔" },
  { label: "Sala Huevos", path: "/roosters", icon: "🥚" },
  { label: "Tienda Huevos", path: "/huevos", icon: "🛒" },
  { label: "Comida", path: "/comida", icon: "🌾" },
  { label: "Bebidas", path: "/bebidas", icon: "💧" },
  { label: "Ranking", path: "/ranking", icon: "🏆" },
  { label: "Amigos", path: "/amigos", icon: "👥" },
  { label: "Perfil", path: "/perfil", icon: "👤" },
  { label: "Ropa", path: "/ropa", icon: "👕" },
  { label: "Ajustes", path: "/ajustes", icon: "⚙" },
];

export function NavigationGrid() {
  const { push } = useRouteTransition();

  return (
    <nav className={styles.grid}>
      {items.map((item) => (
        <button
          key={item.path}
          className={styles.item}
          onClick={() => { push(item.path); }}
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
