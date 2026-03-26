import { ApprovalBanner, DataTable, PageHeader, StatusBadge } from "@enterprise-ai-hub/admin-ui";

export default function AppDetailPage() {
  return (
    <>
      <PageHeader
        eyebrow="Application Detail"
        title="销售作战助手"
        description="应用概览、绑定资源、发布版本和反馈分析的统一入口。"
        actions={
          <>
            <button className="ghost-button" type="button">保存草稿</button>
            <button className="ghost-button" type="button">查看反馈</button>
            <button className="primary-button" type="button">提交发布</button>
          </>
        }
      />
      <ApprovalBanner
        title="存在未发布变更"
        description="模型路由、工具鉴权和知识库版本已更新。发布前需二次确认影响范围，并按规则提交审批。"
        action={<button className="primary-button" type="button">查看变更摘要</button>}
      />
      <div className="tabs">
        <span className="tab-button active">概览</span>
        <span className="tab-button">基础配置</span>
        <span className="tab-button">绑定关系</span>
        <span className="tab-button">发布与版本</span>
        <span className="tab-button">反馈分析</span>
      </div>
      <section className="detail-grid">
        <aside className="summary-card">
          <h3 className="summary-title">应用摘要</h3>
          <div className="summary-list">
            <div className="summary-item"><span>负责人</span><strong>刘一帆</strong></div>
            <div className="summary-item"><span>渠道</span><strong>Web / 企业微信</strong></div>
            <div className="summary-item"><span>当前版本</span><strong>v1.8.2</strong></div>
            <div className="summary-item"><span>状态</span><StatusBadge tone="warning">审批中</StatusBadge></div>
          </div>
        </aside>
        <aside className="summary-card">
          <h3 className="summary-title">绑定关系</h3>
          <div className="summary-list">
            <div className="summary-item"><span>模型</span><strong>gpt-4.1 / claude-4-sonnet</strong></div>
            <div className="summary-item"><span>知识库</span><strong>销售政策库 / 招采 FAQ</strong></div>
            <div className="summary-item"><span>工具</span><strong>CRM 写入 / 价格计算</strong></div>
            <div className="summary-item"><span>工作流</span><strong>销售线索推进流程</strong></div>
          </div>
        </aside>
      </section>
      <section className="content-grid">
        <div className="table-card">
          <div className="table-toolbar">
            <div>
              <p className="section-label">发布变更</p>
              <h3 className="summary-title">变更摘要</h3>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "item", header: "变更项", render: (row: (typeof rows)[number]) => row.item },
              { key: "oldValue", header: "旧值", render: (row) => row.oldValue },
              { key: "newValue", header: "新值", render: (row) => row.newValue },
              { key: "impact", header: "影响范围", render: (row) => row.impact },
              { key: "approval", header: "审批要求", render: (row) => row.approval },
            ]}
            rows={rows}
          />
        </div>
        <aside className="summary-card">
          <h3 className="summary-title">反馈摘要</h3>
          <div className="summary-list">
            <div className="summary-item"><span>近 7 天好评率</span><strong>92%</strong></div>
            <div className="summary-item"><span>引用率</span><strong>84%</strong></div>
            <div className="summary-item"><span>工具成功率</span><strong>96%</strong></div>
            <div className="summary-item"><span>主要问题</span><strong>审批等待时间长</strong></div>
          </div>
        </aside>
      </section>
    </>
  );
}

const rows = [
  { item: "主模型", oldValue: "claude-4-sonnet", newValue: "gpt-4.1", impact: "6 个生产渠道", approval: "需要" },
  { item: "工具权限", oldValue: "只读 CRM", newValue: "允许客户阶段写入", impact: "销售团队", approval: "需要" },
  { item: "知识库版本", oldValue: "2025Q4", newValue: "2026Q1", impact: "销售政策问答", approval: "不需要" },
];
