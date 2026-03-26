import { PageHeader, ToolExecutionTimeline } from "@enterprise-ai-hub/admin-ui";
import { traceTimeline } from "../../../../../lib/mocks";

export default function KnowledgePipelinesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Knowledge"
        title="销售政策知识库"
        description="查看文档导入流水线、失败原因、权限映射和检索配置。"
        actions={
          <>
            <button className="ghost-button" type="button">导出失败报告</button>
            <button className="primary-button" type="button">新增导入任务</button>
          </>
        }
      />
      <div className="tabs">
        <span className="tab-button">概览</span>
        <span className="tab-button">文档列表</span>
        <span className="tab-button active">导入任务</span>
        <span className="tab-button">权限映射</span>
        <span className="tab-button">检索配置</span>
      </div>
      <section className="trace-grid">
        <div className="timeline-card">
          <h3 className="summary-title">导入任务时间线</h3>
          <ToolExecutionTimeline items={traceTimeline} />
        </div>
        <aside className="summary-card">
          <h3 className="summary-title">任务摘要</h3>
          <div className="summary-list">
            <div className="summary-item"><span>任务批次</span><strong>KB-ING-20260313-07</strong></div>
            <div className="summary-item"><span>文档数</span><strong>36</strong></div>
            <div className="summary-item"><span>成功率</span><strong>83%</strong></div>
            <div className="summary-item"><span>失败原因</span><strong>OCR 提取失败 / 权限字段缺失</strong></div>
          </div>
        </aside>
      </section>
    </>
  );
}
