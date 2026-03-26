import { DataTable, PageHeader, StatusBadge } from "@enterprise-ai-hub/admin-ui";
import { StatePanel } from "../../../lib/primitives";

export default function WorkflowsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Workflows"
        title="工作流运行视图"
        description="按架构约束承载列表、版本、运行与审批节点，不在控制台内直接实现运行时引擎。"
        actions={
          <>
            <button className="ghost-button" type="button">查看版本</button>
            <button className="primary-button" type="button">新建工作流</button>
          </>
        }
      />
      <section className="detail-grid">
        <StatePanel title="流程摘要" value="销售线索推进" note="12 个节点 / 2 个审批节点 / 3 个工具节点" />
        <StatePanel title="当前版本" value="v0.9.6" note="今日 14 次运行 / 2 次失败" />
      </section>
      <section className="content-grid">
        <div className="table-card">
          <div className="table-toolbar">
            <div>
              <p className="section-label">运行记录</p>
              <h3 className="summary-title">运行记录</h3>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "id", header: "运行 ID", render: (row: (typeof rows)[number]) => row.id },
              { key: "source", header: "触发来源", render: (row) => row.source },
              { key: "status", header: "状态", render: (row) => <StatusBadge tone={row.tone}>{row.status}</StatusBadge> },
              { key: "duration", header: "耗时", render: (row) => row.duration },
              { key: "failedNode", header: "失败节点", render: (row) => row.failedNode },
              { key: "action", header: "操作", render: (row) => row.action },
            ]}
            rows={rows}
          />
        </div>
        <aside className="summary-card">
          <h3 className="summary-title">审批节点</h3>
          <div className="summary-list">
            <div className="summary-item"><span>客户信息写入</span><strong>销售总监</strong></div>
            <div className="summary-item"><span>价格策略变更</span><strong>运营负责人</strong></div>
          </div>
        </aside>
      </section>
    </>
  );
}

const rows = [
  { id: "run_70081", source: "销售作战助手", status: "成功", tone: "success" as const, duration: "18s", failedNode: "-", action: "查看" },
  { id: "run_70077", source: "CRM 批处理", status: "失败", tone: "danger" as const, duration: "5m 12s", failedNode: "审批超时", action: "重试" },
  { id: "run_70074", source: "人工触发", status: "运行中", tone: "info" as const, duration: "2m 31s", failedNode: "-", action: "跟踪" },
];
