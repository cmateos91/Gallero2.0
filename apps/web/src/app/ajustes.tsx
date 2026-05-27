import { useAuth } from "../context/auth.js";
import { useSettings } from "../lib/settings.js";
import { useToast } from "../context/toast.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import styles from "./ajustes.module.css";

export function Ajustes() {
  const { user, logout } = useAuth();
  const { settings, updateSetting } = useSettings();
  const { pushToast } = useToast();

  async function handleLogout() {
    await logout();
    pushToast("Sesión cerrada", "info");
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <p className={styles.username}>{user?.username}</p>
        <p className={styles.email}>{user?.email}</p>
      </Card>

      <Card className={styles.card}>
        <div className={styles.row}>
          <span>Sonido</span>
          <button
            className={styles.toggle}
            onClick={() => updateSetting("sound", !settings.sound)}
          >
            {settings.sound ? "🔊 ON" : "🔇 OFF"}
          </button>
        </div>
      </Card>

      <Card className={styles.card}>
        <p className={styles.label}>Estilo de navegación</p>
        <div className={styles.options}>
          <button
            className={[styles.option, settings.navStyle === "wheel" ? styles.active : ""].join(" ")}
            onClick={() => updateSetting("navStyle", "wheel")}
          >
            🎡 Rueda
          </button>
          <button
            className={[styles.option, settings.navStyle === "grid" ? styles.active : ""].join(" ")}
            onClick={() => updateSetting("navStyle", "grid")}
          >
            📱 Grid
          </button>
        </div>
      </Card>

      <div className={styles.actions}>
        <Button variant="danger" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>

      <p className={styles.version}>Gallero 2.0 — Fase 4</p>
    </div>
  );
}
