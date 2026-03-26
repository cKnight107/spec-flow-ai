import { DataTable, PageHeader, StatusBadge } from "@enterprise-ai-hub/admin-ui";
import { StatePanel } from "../../../../../lib/primitives";

export default function ModelRoutingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Model Routing"
        title="gpt-4.1 路由策略"
        description="管理主备模型、灰度比例、配额和安全控制。"
        actions={
          <>
            <button className="ghost-button" type="button">保存草稿</button>
            <button className="primary-button" type="button">提交审批</button>
          </>
        }
      />
      <section className="detail-grid">
        <StatePanel title="主路由" value="GPT-4.1" note="生产流量 65% / 平均时延 1.8s" />
        <StatePanel title="备路由" value="Claude 4 Sonnet" note="故障切换 / 高复杂度问题承接" />
        <StatePanel title="灰度策略" value="15%" note="面向销售和客服应用灰度开放" />
        <StatePanel title="降级策略" value="o4-mini" note="成本或故障告警触发时启用" />
      </section>
      <section className="content-grid">
        <div className="table-card">
          <div className="table-toolbar">
            <div>
              <p className="section-label">配额</p>
              <h3 className="summary-title">应用级配额</h3>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "app", header: "应用", render: (row: (typeof rows)[number]) => row.app },
              { key: "dept", header: "部门", render: (row) => row.dept },
              { key: "qps", header: "QPS", render: (row) => row.qps },
              { key: "quota", header: "Token 配额", render: (row) => row.quota },
              { key: "alert", header: "告警阈值", render: (row) => row.alert },
              { key: "status", header: "状态", render: (row) => <StatusBadge tone={row.tone}>{row.status}</StatusBadge> },
            ]}
            rows={rows}
          />
        </div>
        <aside className="summary-card">
          <h3 className="summary-title">风险提醒</h3>
          <div className="summary-list">
            <div className="summary-item"><span>高成本应用</span><strong>运营分析 Copilot</strong></div>
            <div className="summary-item"><span>需复核变更</span><strong>主备切换比例</strong></div>
            <div className="summary-item"><span>审批理由</span><strong>影响生产流量</strong></div>
          </div>
        </aside>
      </section>
    </>
  );
}

const rows = [
  { app: "销售作战助手", dept: "销售运营", qps: "30", quota: "4.2M / 月", alert: "80%", status: "正常", tone: "success" as const },
  { app: "制度问答助手", dept: "人力数字化", qps: "18", quota: "1.4M / 月", alert: "90%", status: "正常", tone: "success" as const },
  { app: "运营分析 Copilot", dept: "运营平台", qps: "10", quota: "2.0M / 月", alert: "70%", status: "即将超限", tone: "warning" as const },
];
