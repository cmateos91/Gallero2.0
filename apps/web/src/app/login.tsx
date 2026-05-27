import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth.js";
import { Button } from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import styles from "./login.module.css";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setError("");
    setLoading(true);
    /* eslint-disable @typescript-eslint/no-floating-promises */
    login(emailOrUsername, password)
      .then(() => {
        navigate("/", { replace: true });
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Error al iniciar sesión";
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
    /* eslint-enable @typescript-eslint/no-floating-promises */
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Gallero</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email o Usuario"
            value={emailOrUsername}
            onChange={(e) => { setEmailOrUsername(e.target.value); }}
            autoComplete="username"
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); }}
            autoComplete="current-password"
          />
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" loading={loading}>
            Entrar
          </Button>
        </form>
        <p className={styles.footer}>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
