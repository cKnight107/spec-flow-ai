import { DataTable, PageHeader, StatusBadge } from "@enterprise-ai-hub/admin-ui";

export default function AccessRolesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Access"
        title="权限治理"
        description="控制与治理层的前端入口，承接用户、角色、策略的查看与配置。"
        actions={
          <>
            <button className="ghost-button" type="button">同步组织架构</button>
            <button className="primary-button" type="button">新建角色</button>
          </>
        }
      />
      <section className="detail-grid">
        <aside className="summary-card">
          <h3 className="summary-title">用户管理</h3>
          <div className="summary-list">
            <div className="summary-item"><span>活跃用户</span><strong>128</strong></div>
            <div className="summary-item"><span>冻结用户</span><strong>6</strong></div>
            <div className="summary-item"><span>最近同步</span><strong>今天 08:40</strong></div>
          </div>
        </aside>
        <aside className="summary-card">
          <h3 className="summary-title">策略占位</h3>
          <p>真实 IAM / OPA / Casbin 规则将在后续服务对接阶段接入。当前页面只定义控制面展示与操作边界。</p>
        </aside>
      </section>
      <section className="table-card">
        <div className="table-toolbar">
          <div>
            <p className="section-label">角色</p>
            <h3 className="summary-title">角色列表</h3>
          </div>
        </div>
        <DataTable
          columns={[
            { key: "name", header: "角色", render: (row: (typeof rows)[number]) => row.name },
            { key: "scope", header: "权限范围", render: (row) => row.scope },
            { key: "count", header: "关联人数", render: (row) => row.count },
            { key: "ability", header: "默认能力", render: (row) => row.ability },
            { key: "status", header: "状态", render: (row) => <StatusBadge tone={row.tone}>{row.status}</StatusBadge> },
          ]}
          rows={rows}
        />
      </section>
    </>
  );
}

const rows = [
  { name: "平台管理员", scope: "全局配置 / 发布 / 观测", count: "5", ability: "可审批 / 可发布", status: "生效中", tone: "success" as const },
  { name: "应用管理员", scope: "应用配置 / 反馈", count: "18", ability: "仅限所属应用", status: "生效中", tone: "success" as const },
  { name: "审计人员", scope: "日志 / 链路 / 审批只读", count: "9", ability: "无写权限", status: "只读", tone: "info" as const },
];
