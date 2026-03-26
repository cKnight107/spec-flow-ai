import type { SearchFilterBarProps } from "./types";

export function SearchFilterBar({
  chips,
  title = "筛选条件",
  description = "按关键词、状态和归属快速定位资源。"
}: SearchFilterBarProps) {
  return (
    <section className="search-filter-bar">
      <div>
        <p className="section-label">{title}</p>
        <p>{description}</p>
      </div>
      <div className="chip-row">
        {chips.map((chip) => (
          <span key={chip} className="filter-chip">
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}
