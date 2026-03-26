import Link from "next/link";
import { DataTable, PageHeader, SearchFilterBar, StatusBadge } from "@enterprise-ai-hub/admin-ui";
import { appList } from "../../../lib/mocks";

export default function AppsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Applications"
        title="应用中心"
        description="统一查看应用资产、绑定关系、发布状态和负责人。"
        actions={
          <>
            <button className="ghost-button" type="button">批量导出</button>
            <button className="primary-button" type="button">新建应用</button>
          </>
        }
      />
      <SearchFilterBar chips={["关键词：销售", "负责人：全部", "状态：已发布 / 审批中", "渠道：Web / 企业微信"]} />
      <section className="table-card">
        <div className="table-toolbar">
          <div>
            <p className="section-label">应用资产</p>
            <h3 className="summary-title">应用列表</h3>
          </div>
        </div>
        <DataTable
          columns={[
            {
              key: "name",
              header: "应用名称",
              render: (row) => (
                <Link className="row-link" href="/apps/app-sales-copilot">
                  {row.name}
                  <small>{row.desc}</small>
                </Link>
              ),
            },
            { key: "owner", header: "归属部门", render: (row) => row.owner },
            { key: "bindings", header: "绑定关系", render: (row) => row.bindings },
            { key: "status", header: "状态", render: (row) => <StatusBadge tone={row.statusTone}>{row.status}</StatusBadge> },
            { key: "release", header: "最近发布", render: (row) => row.release },
            { key: "risk", header: "风险", render: (row) => row.risk },
          ]}
          rows={appList}
        />
      </section>
    </>
  );
}
