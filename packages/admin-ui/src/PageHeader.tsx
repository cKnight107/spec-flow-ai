import type { PageHeaderProps } from "./types";

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <section className="page-header">
      <div>
        <p className="section-label">{eyebrow}</p>
        <h2 className="page-title">{title}</h2>
        <p>{description}</p>
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </section>
  );
}
