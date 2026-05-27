import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100dvh",
              flexDirection: "column",
              gap: 12,
              padding: 40,
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: 20 }}>Algo salió mal</h2>
            <p style={{ color: "var(--color-text-light)", fontSize: 15 }}>
              {this.state.error.message}
            </p>
            <button
              onClick={() => { this.setState({ error: null }); }}
              style={{
                marginTop: 8,
                padding: "10px 24px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-primary)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              Reintentar
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
