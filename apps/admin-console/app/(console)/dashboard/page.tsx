import { DataTable, PageHeader, StatusBadge } from "@enterprise-ai-hub/admin-ui";
import { dashboardMetrics } from "../../../lib/mocks";
import { MetricCard, SummaryCard } from "../../../lib/primitives";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="企业 AI 中台运营看板"
        description="聚焦请求、成本、审批和风险事件，帮助平台管理员快速判断当天的治理重点。"
        actions={
          <>
            <button className="ghost-button" type="button">近 24 小时</button>
            <button className="primary-button" type="button">导出概览</button>
          </>
        }
      />
      <section className="metrics-grid">
        {dashboardMetrics.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </section>
      <section className="insight-grid">
        <article className="insight-card">
          <h3 className="summary-title">今日重点</h3>
          <div className="insight-list">
            <div className="insight-item"><span>销售作战助手</span><strong>等待 CRM 写入审批</strong></div>
            <div className="insight-item"><span>财务知识库</span><strong>导入任务失败率 18%</strong></div>
            <div className="insight-item"><span>gpt-4.1 路由组</span><strong>Token 成本较昨日 +21%</strong></div>
          </div>
        </article>
        <article className="insight-card">
          <h3 className="summary-title">待处理审批</h3>
          <div className="insight-list">
            <div className="insight-item"><span>模型切换</span><strong>AP-2026-0313</strong></div>
            <div className="insight-item"><span>工具写入权限</span><strong>AP-2026-0311</strong></div>
            <div className="insight-item"><span>发布回滚</span><strong>AP-2026-0308</strong></div>
          </div>
        </article>
        <article className="insight-card">
          <h3 className="summary-title">治理基线</h3>
          <div className="summary-list">
            <div className="summary-item"><span>高风险动作</span><strong>统一审批</strong></div>
            <div className="summary-item"><span>配置变更</span><strong>统一留痕</strong></div>
            <div className="summary-item"><span>知识权限</span><strong>继承组织边界</strong></div>
          </div>
        </article>
      </section>
      <section className="content-grid">
        <div className="table-card">
          <div className="table-toolbar">
            <div>
              <p className="section-label">近期访问</p>
              <h3 className="summary-title">最近访问资源</h3>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "name", header: "资源", render: (row: (typeof rows)[number]) => row.name },
              { key: "type", header: "类型", render: (row) => row.type },
              { key: "owner", header: "负责人", render: (row) => row.owner },
              { key: "status", header: "状态", render: (row) => <StatusBadge tone={row.tone}>{row.status}</StatusBadge> },
              { key: "time", header: "最后操作", render: (row) => row.time },
            ]}
            rows={rows}
          />
        </div>
        <SummaryCard title="平台基线">
          <div className="summary-list">
            <div className="summary-item"><span>当前空间</span><strong>生产治理空间</strong></div>
            <div className="summary-item"><span>告警策略</span><strong>成本与失败率联动</strong></div>
            <div className="summary-item"><span>发布要求</span><strong>关键变更需审批</strong></div>
            <div className="summary-item"><span>审计保留</span><strong>全链路留痕</strong></div>
          </div>
        </SummaryCard>
      </section>
    </>
  );
}

const rows = [
  { name: "销售作战助手", type: "应用", owner: "刘一帆", status: "审批中", tone: "warning" as const, time: "10 分钟前" },
  { name: "crm_update_customer", type: "工具", owner: "陈晨", status: "高风险", tone: "danger" as const, time: "18 分钟前" },
  { name: "财务制度库", type: "知识库", owner: "韩璐", status: "失败重试", tone: "warning" as const, time: "42 分钟前" },
];
