interface SpinnerProps {
  size?: number;
}

export function Spinner({ size = 40 }: SpinnerProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `${String(Math.max(3, size / 10))}px solid var(--color-border)`,
        borderTopColor: "var(--color-primary)",
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
      }}
    />
  );
}
