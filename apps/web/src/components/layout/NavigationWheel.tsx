import { useRouteTransition } from "../../context/route-transition.js";
import styles from "./NavigationWheel.module.css";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const items: NavItem[] = [
  { label: "Combate", path: "/fights", icon: "⚔" },
  { label: "Granja", path: "/", icon: "🏠" },
  { label: "Mochila", path: "/comida", icon: "🎒" },
  { label: "Huevos", path: "/roosters", icon: "🥚" },
  { label: "Tienda", path: "/huevos", icon: "🛒" },
  { label: "Ajustes", path: "/ajustes", icon: "⚙" },
];

export function NavigationWheel() {
  const { push } = useRouteTransition();

  return (
    <nav className={styles.wheel}>
      {items.map((item) => (
        <button
          key={item.path}
          className={styles.item}
          onClick={() => { push(item.path); }}
          title={item.label}
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
