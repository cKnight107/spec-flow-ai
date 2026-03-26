import type { AppListItem, MetricItem, TimelineItem } from "./types";

export const dashboardMetrics: MetricItem[] = [
  { label: "在线应用", value: "23", trend: "+3 本周", note: "所有业务入口" },
  { label: "模型调用量", value: "1.24M", trend: "+12.8%", note: "近 7 天" },
  { label: "导入任务", value: "48", trend: "6 个失败", note: "知识处理流水线" },
  { label: "待审批", value: "6", trend: "2 个高风险", note: "发布与写入动作" },
  { label: "异常告警", value: "4", trend: "1 个升级", note: "工具与链路监控" },
];

export const observabilityMetrics: MetricItem[] = [
  { label: "请求成功率", value: "97.2%", trend: "+1.1%", note: "近 24h" },
  { label: "平均时延", value: "2.1s", trend: "-180ms", note: "近 24h" },
  { label: "引用率", value: "84%", trend: "+6%", note: "问答类应用" },
  { label: "工具成功率", value: "93%", trend: "-2%", note: "写入动作受审批影响" },
  { label: "单日成本", value: "¥18,240", trend: "+9.7%", note: "含模型与向量检索" },
];

export const appList: AppListItem[] = [
  {
    name: "制度问答助手",
    desc: "绑定 HR handbook / GPT-4.1 / FAQ 工具",
    owner: "人力数字化",
    bindings: "1 模型 / 2 知识库 / 1 工具",
    status: "已发布",
    statusTone: "success",
    release: "2026-03-12 18:40",
    risk: "低风险",
  },
  {
    name: "销售作战助手",
    desc: "灰度发布中，启用审批回写",
    owner: "销售运营",
    bindings: "2 模型 / 1 工作流 / 3 工具",
    status: "审批中",
    statusTone: "warning",
    release: "2026-03-13 09:10",
    risk: "需审批",
  },
  {
    name: "IT 运维 Copilot",
    desc: "接入告警工具与 SOP 知识库",
    owner: "基础架构",
    bindings: "1 模型 / 1 知识库 / 2 工具",
    status: "草稿",
    statusTone: "neutral",
    release: "未发布",
    risk: "中风险",
  },
];

export const traceTimeline: TimelineItem[] = [
  { node: "权限校验", status: "通过", tone: "success", time: "12ms", desc: "命中平台管理员策略集" },
  { node: "知识检索", status: "完成", tone: "success", time: "148ms", desc: "召回 12 篇文档，重排后保留 5 篇" },
  { node: "工具调用", status: "审批挂起", tone: "warning", time: "2m 12s", desc: "高风险 CRM 写入动作，等待审批人确认" },
  { node: "模型生成", status: "待执行", tone: "neutral", time: "-", desc: "审批通过后继续执行" },
];

export const toolExecutions: TimelineItem[] = [
  { node: "参数校验", status: "成功", tone: "success", time: "8ms", desc: "customerId 与 fields 校验通过" },
  { node: "权限检查", status: "成功", tone: "success", time: "15ms", desc: "命中 crm.customer.write scope" },
  { node: "审批检查", status: "待确认", tone: "warning", time: "1m 22s", desc: "高价值客户变更需销售总监审批" },
  { node: "CRM 写入", status: "未执行", tone: "neutral", time: "-", desc: "等待审批结果" },
];

export const promptTimeline: TimelineItem[] = [
  { node: "Prompt 组装", status: "成功", tone: "success", time: "6ms", desc: "注入系统 Prompt 与角色约束" },
  { node: "知识召回", status: "成功", tone: "success", time: "133ms", desc: "命中《销售政策 2026Q1》第 3 节" },
  { node: "工具决策", status: "成功", tone: "success", time: "31ms", desc: "识别出 CRM 写入前置审批" },
];

export const toolSchema = {
  name: "crm_update_customer",
  method: "POST",
  auth: {
    type: "OAuth2",
    scope: ["crm.customer.write"],
  },
  input: {
    type: "object",
    required: ["customerId", "fields"],
    properties: {
      customerId: { type: "string", description: "客户主键" },
      fields: {
        type: "object",
        properties: {
          stage: { type: "string", enum: ["MQL", "SQL", "Won"] },
          owner: { type: "string" },
        },
      },
    },
  },
};
