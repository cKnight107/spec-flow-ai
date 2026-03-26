import { JsonViewer, PageHeader, SearchFilterBar, ToolExecutionTimeline } from "@enterprise-ai-hub/admin-ui";
import { toolExecutions, toolSchema } from "../../../lib/mocks";

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tools"
        title="工具中心"
        description="展示工具定义、Schema、鉴权方式和执行记录。"
        actions={
          <>
            <button className="ghost-button" type="button">导入结构</button>
            <button className="primary-button" type="button">新建工具</button>
          </>
        }
      />
      <SearchFilterBar chips={["协议：HTTP / MCP", "风险等级：高风险", "发布状态：已发布", "提供方：CRM Gateway"]} />
      <section className="content-grid">
        <div className="table-card">
          <div className="table-toolbar">
            <div>
              <p className="section-label">工具结构</p>
              <h3 className="summary-title">工具定义</h3>
            </div>
          </div>
          <JsonViewer value={toolSchema} />
        </div>
        <div className="timeline-card">
          <h3 className="summary-title">执行记录</h3>
          <ToolExecutionTimeline items={toolExecutions} />
        </div>
      </section>
    </>
  );
}
