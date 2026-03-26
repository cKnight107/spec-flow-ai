import type { ApprovalBannerProps } from "./types";

export function ApprovalBanner({ title, description, action }: ApprovalBannerProps) {
  return (
    <section className="approval-banner">
      <div>
        <p className="section-label">审批提醒</p>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {action}
    </section>
  );
}
