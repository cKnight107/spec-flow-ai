import { ApprovalBanner, DataTable, PageHeader, StatusBadge } from "@enterprise-ai-hub/admin-ui";

export default function GovernanceApprovalsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="审计与审批"
        description="统一查看审批单、风险事件和审计日志入口。"
        actions={
          <>
            <button className="ghost-button" type="button">导出审计</button>
            <button className="primary-button" type="button">创建审批规则</button>
          </>
        }
      />
      <ApprovalBanner
        title="高风险变更待审批"
        description="销售作战助手正在申请 CRM 客户阶段写入权限，需销售总监与平台管理员双重确认。"
        action={<button className="primary-button" type="button">进入审批中心</button>}
      />
      <section className="content-grid">
        <div className="table-card">
          <div className="table-toolbar">
            <div>
              <p className="section-label">审计日志</p>
              <h3 className="summary-title">最近审计记录</h3>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "time", header: "时间", render: (row: (typeof rows)[number]) => row.time },
              { key: "resource", header: "资源", render: (row) => row.resource },
              { key: "action", header: "动作", render: (row) => row.action },
              { key: "operator", header: "操作人", render: (row) => row.operator },
              { key: "result", header: "结果", render: (row) => <StatusBadge tone={row.tone}>{row.result}</StatusBadge> },
              { key: "trace", header: "链路", render: (row) => row.trace },
            ]}
            rows={rows}
          />
        </div>
        <aside className="summary-card">
          <h3 className="summary-title">风险事件</h3>
          <div className="summary-list">
            <div className="summary-item"><span>高成本异常</span><strong>运营分析 Copilot</strong></div>
            <div className="summary-item"><span>越权尝试</span><strong>审计人员访问模型配置</strong></div>
            <div className="summary-item"><span>工具写入告警</span><strong>CRM 高价值客户记录</strong></div>
          </div>
        </aside>
      </section>
    </>
  );
}

const rows = [
  { time: "03-13 10:05", resource: "销售作战助手", action: "提交发布", operator: "刘一帆", result: "待审批", tone: "warning" as const, trace: "trc_7812" },
  { time: "03-13 09:48", resource: "crm_update_customer", action: "修改鉴权", operator: "陈晨", result: "已记录", tone: "success" as const, trace: "trc_7801" },
  { time: "03-13 09:15", resource: "gpt-4.1 路由组", action: "调整灰度", operator: "Chen Kai", result: "已拒绝", tone: "danger" as const, trace: "trc_7791" },
];
