import { JsonViewer, PageHeader, ToolExecutionTimeline } from "@enterprise-ai-hub/admin-ui";
import { promptTimeline } from "../../../../lib/mocks";

export default function PromptPlaygroundPage() {
  return (
    <>
      <PageHeader
        eyebrow="PromptOps"
        title="Playground"
        description="使用静态问答结果、引用面板和工具执行时间线来模拟调试体验。"
        actions={
          <>
            <button className="ghost-button" type="button">版本对比</button>
            <button className="primary-button" type="button">保存 Prompt</button>
          </>
        }
      />
      <section className="content-grid">
        <div className="table-card">
          <div className="table-toolbar">
            <div>
              <p className="section-label">Prompt</p>
              <h3 className="summary-title">输入与参数</h3>
            </div>
          </div>
          <aside className="summary-card">
            <div className="detail-matrix">
              <div className="detail-row"><span>用户输入</span><strong>请给出销售折扣审批规则，并同步判断是否需要 CRM 写入。</strong></div>
              <div className="detail-row"><span>系统 Prompt</span><strong>你是企业销售助手，只能引用受权限控制的知识，并在写入前触发审批。</strong></div>
              <div className="detail-row"><span>预期输出</span><strong>先回答规则，再给出审批建议。</strong></div>
            </div>
          </aside>
        </div>
        <aside className="summary-card">
          <h3 className="summary-title">静态结果</h3>
          <p>折扣高于 15% 时必须经过销售总监审批；若客户阶段需要同步为 SQL，则需触发 CRM 写入审批。</p>
        </aside>
      </section>
      <section className="trace-grid">
        <div className="timeline-card">
          <h3 className="summary-title">执行时间线</h3>
          <ToolExecutionTimeline items={promptTimeline} />
        </div>
        <JsonViewer
          title="引用面板"
          caption="只读"
          value={{
            citations: [
              {
                doc: "销售政策 2026Q1",
                section: "3.2 折扣审批规则",
                quote: "折扣高于 15% 时必须经过销售总监审批。"
              },
              {
                doc: "CRM 写入守则",
                section: "2.1 高价值客户写入",
                quote: "涉及客户阶段变更时应触发审批并写入审计日志。"
              }
            ]
          }}
        />
      </section>
    </>
  );
}
