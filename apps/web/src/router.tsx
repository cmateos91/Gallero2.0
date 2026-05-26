import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./app/layout.js";

const Home = () => (
  <div style={{ padding: 40, textAlign: "center" }}>
    <h1>Gallero 2.0</h1>
    <p>Fase 0 — Infraestructura</p>
    <p>Granja placeholder</p>
  </div>
);

const Login = () => (
  <div style={{ padding: 40, textAlign: "center" }}>
    <h1>Login</h1>
    <p>Placeholder</p>
  </div>
);

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { index: true, element: <Home /> },
    ],
  },
]);
