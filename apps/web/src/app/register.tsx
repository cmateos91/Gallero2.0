import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth.js";
import { Button } from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import styles from "./login.module.css";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setError("");
    setLoading(true);
    /* eslint-disable @typescript-eslint/no-floating-promises */
    register(email, username, password)
      .then(() => {
        navigate("/", { replace: true });
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Error al registrarse";
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
            label="Email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); }}
            autoComplete="email"
          />
          <Input
            label="Usuario"
            value={username}
            onChange={(e) => { setUsername(e.target.value); }}
            autoComplete="username"
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); }}
            autoComplete="new-password"
          />
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" loading={loading}>
            Crear cuenta
          </Button>
        </form>
        <p className={styles.footer}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
