import type { ToolExecutionTimelineProps } from "./types";

export function ToolExecutionTimeline({ items }: ToolExecutionTimelineProps) {
  return (
    <div className="timeline-list">
      {items.map((item) => (
        <div
          key={`${item.node}-${item.time}`}
          className={`timeline-item${item.tone === "warning" || item.tone === "danger" ? ` ${item.tone}` : ""}`}
        >
          <div>
            <strong>{item.node}</strong>
            <p>{item.desc}</p>
          </div>
          <div>
            <p>{item.status}</p>
            <p>{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
