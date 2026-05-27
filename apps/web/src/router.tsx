import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/auth.js";
import { RootLayout } from "./app/layout.js";
import { AppShell } from "./components/layout/AppShell.js";
import { LoadingScreen } from "./components/layout/LoadingScreen.js";

const LoginLazy = lazy(() => import("./app/login.js").then((m) => ({ default: m.Login })));
const RegisterLazy = lazy(() => import("./app/register.js").then((m) => ({ default: m.Register })));
const HomeLazy = lazy(() => import("./app/home.js").then((m) => ({ default: m.Home })));
const PerfilLazy = lazy(() => import("./app/perfil.js").then((m) => ({ default: m.Perfil })));
const RankingLazy = lazy(() => import("./app/ranking.js").then((m) => ({ default: m.Ranking })));
const AmigosLazy = lazy(() => import("./app/amigos.js").then((m) => ({ default: m.Amigos })));
const GallineroLazy = lazy(() => import("./app/gallinero.js").then((m) => ({ default: m.Gallinero })));
const RoostersLazy = lazy(() => import("./app/roosters.js").then((m) => ({ default: m.Roosters })));
const HuevosLazy = lazy(() => import("./app/huevos.js").then((m) => ({ default: m.Huevos })));
const AjustesLazy = lazy(() => import("./app/ajustes.js").then((m) => ({ default: m.Ajustes })));
const ComidaLazy = lazy(() => import("./app/comida.js").then((m) => ({ default: m.Comida })));
const BebidasLazy = lazy(() => import("./app/bebidas.js").then((m) => ({ default: m.Bebidas })));
const RopaLazy = lazy(() => import("./app/ropa.js").then((m) => ({ default: m.Ropa })));
const FightsLazy = lazy(() => import("./app/fights.js").then((m) => ({ default: m.Fights })));
const PvpLazy = lazy(() => import("./app/fights-pvp.js").then((m) => ({ default: m.Pvp })));
const TorreLazy = lazy(() => import("./app/torre.js").then((m) => ({ default: m.Torre })));

function LazyFallback() {
  return <LoadingScreen />;
}

function AuthGuard() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/login", element: <Suspense fallback={<LazyFallback />}><LoginLazy /></Suspense> },
      { path: "/register", element: <Suspense fallback={<LazyFallback />}><RegisterLazy /></Suspense> },
      {
        element: <AuthGuard />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <Suspense fallback={<LazyFallback />}><HomeLazy /></Suspense> },
              { path: "gallinero", element: <Suspense fallback={<LazyFallback />}><GallineroLazy /></Suspense> },
              { path: "huevos", element: <Suspense fallback={<LazyFallback />}><HuevosLazy /></Suspense> },
              { path: "roosters", element: <Suspense fallback={<LazyFallback />}><RoostersLazy /></Suspense> },
              { path: "fights", element: <Suspense fallback={<LazyFallback />}><FightsLazy /></Suspense> },
              { path: "fights/pvp", element: <Suspense fallback={<LazyFallback />}><PvpLazy /></Suspense> },
              { path: "ranking", element: <Suspense fallback={<LazyFallback />}><RankingLazy /></Suspense> },
              { path: "torre", element: <Suspense fallback={<LazyFallback />}><TorreLazy /></Suspense> },
              { path: "perfil", element: <Suspense fallback={<LazyFallback />}><PerfilLazy /></Suspense> },
              { path: "comida", element: <Suspense fallback={<LazyFallback />}><ComidaLazy /></Suspense> },
              { path: "bebidas", element: <Suspense fallback={<LazyFallback />}><BebidasLazy /></Suspense> },
              { path: "amigos", element: <Suspense fallback={<LazyFallback />}><AmigosLazy /></Suspense> },
              { path: "ajustes", element: <Suspense fallback={<LazyFallback />}><AjustesLazy /></Suspense> },
              { path: "ropa", element: <Suspense fallback={<LazyFallback />}><RopaLazy /></Suspense> },
            ],
          },
        ],
      },
      { path: "*", element: <div style={{ padding: 40, textAlign: "center" }}><h2>404</h2><p>Página no encontrada</p></div> },
    ],
  },
]);
