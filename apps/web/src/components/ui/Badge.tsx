import type { ReactNode } from "react";
import styles from "./Badge.module.css";

type BadgeVariant = "default" | "success" | "danger" | "warning";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

const variantClass: Record<BadgeVariant, string> = {
  default: styles.default,
  success: styles.success,
  danger: styles.danger,
  warning: styles.warning,
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return <span className={[styles.badge, variantClass[variant]].join(" ")}>{children}</span>;
}
