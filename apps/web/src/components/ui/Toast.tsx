import styles from "./Toast.module.css";

interface ToastData {
  id: number;
  message: string;
  kind: "info" | "success" | "error";
}

export function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: (id: number) => void;
}) {
  const bg =
    toast.kind === "error" ? "var(--color-danger)" :
    toast.kind === "success" ? "var(--color-success)" :
    "var(--color-text)";

  return (
    <div
      className={styles.toast}
      style={{ background: bg }}
      onClick={() => { onDismiss(toast.id); }}
    >
      {toast.message}
    </div>
  );
}
