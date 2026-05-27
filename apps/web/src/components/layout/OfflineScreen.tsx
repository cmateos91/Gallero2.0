export function OfflineScreen() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        flexDirection: "column",
        gap: 12,
        textAlign: "center",
        padding: 40,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
        }}
      >
        !
      </div>
      <h2 style={{ fontSize: 20 }}>Sin conexión</h2>
      <p style={{ color: "var(--color-text-light)", fontSize: 15 }}>
        Parece que no tienes internet. Reconectando...
      </p>
    </div>
  );
}
