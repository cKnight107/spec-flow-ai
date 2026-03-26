import type { ReactNode } from "react";
import type { MetricItem } from "./types";

export function MetricCard({ label, value, trend, note }: MetricItem) {
  return (
    <article className="metric-card">
      <p className="section-label">{label}</p>
      <strong className="metric-value">{value}</strong>
      <div className="metric-trend">{trend}</div>
      <p>{note}</p>
    </article>
  );
}

export function SummaryCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="summary-card">
      <h3 className="summary-title">{title}</h3>
      {children}
    </aside>
  );
}

export function StatePanel({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <article className="state-panel">
      <div>
        <p className="section-label">{title}</p>
        <h3 className="summary-title">{value}</h3>
        <p>{note}</p>
      </div>
      <span className="state-badge">已配置</span>
    </article>
  );
}
