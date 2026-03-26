import { PageHeader, ToolExecutionTimeline } from "@enterprise-ai-hub/admin-ui";
import { observabilityMetrics, traceTimeline } from "../../../../lib/mocks";
import { MetricCard, SummaryCard } from "../../../../lib/primitives";

export default function ObservabilityTracesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Observability"
        title="执行链路与成本分析"
        description="通过时间线而非真实调用图展示检索、模型、工具和审批的链路关系。"
        actions={
          <>
            <button className="ghost-button" type="button">查看链路摘要</button>
            <button className="primary-button" type="button">导出链路</button>
          </>
        }
      />
      <section className="metrics-grid">
        {observabilityMetrics.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </section>
      <section className="trace-grid">
        <div className="timeline-card">
          <h3 className="summary-title">执行时间线</h3>
          <ToolExecutionTimeline items={traceTimeline} />
        </div>
        <SummaryCard title="成本排行">
          <div className="summary-list">
            <div className="summary-item"><span>1. 运营分析 Copilot</span><strong>¥5,640</strong></div>
            <div className="summary-item"><span>2. 销售作战助手</span><strong>¥4,920</strong></div>
            <div className="summary-item"><span>3. 制度问答助手</span><strong>¥2,880</strong></div>
          </div>
        </SummaryCard>
      </section>
    </>
  );
}
