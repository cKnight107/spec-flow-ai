import type { StatusBadgeProps } from "./types";

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}
