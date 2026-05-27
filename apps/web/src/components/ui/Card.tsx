import type { ReactNode, HTMLAttributes } from "react";
import styles from "./Card.module.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "sm" | "md" | "lg";
}

const padMap = { sm: styles.padSm, md: styles.padMd, lg: styles.padLg };

export function Card({ children, padding = "md", className, ...props }: CardProps) {
  return (
    <div className={[styles.card, padMap[padding], className ?? ""].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}
