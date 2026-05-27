import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth.js";
import { useSettings } from "../../lib/settings.js";
import { RouteTransitionProvider } from "../../context/route-transition.js";
import { NavigationWheel } from "./NavigationWheel.js";
import { NavigationGrid } from "./NavigationGrid.js";
import { LoadingScreen } from "./LoadingScreen.js";
import styles from "./AppShell.module.css";

export function AppShell() {
  const { user, loading } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  const showNav = !["/login", "/register"].includes(location.pathname);

  return (
    <RouteTransitionProvider>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.coins}>🪙 {user?.coins ?? 0}</span>
          <span className={styles.mmr}>🏅 {user?.mmr ?? 1000}</span>
        </header>
        <main className={styles.main}>
          <Outlet />
        </main>
        {showNav && (
          <div className={styles.nav}>
            {settings.navStyle === "grid" ? <NavigationGrid /> : <NavigationWheel />}
          </div>
        )}
      </div>
    </RouteTransitionProvider>
  );
}
