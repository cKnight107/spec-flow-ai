import type { NavItem } from "./types";

export const consoleNavItems: NavItem[] = [
  { href: "/dashboard", label: "仪表盘", hint: "总览" },
  { href: "/apps", label: "应用中心", hint: "资产" },
  { href: "/models/model-gpt-4-1/routing", label: "模型策略", hint: "路由" },
  { href: "/knowledge/kb-sales-policy/pipelines", label: "知识中心", hint: "导入" },
  { href: "/tools", label: "工具中心", hint: "结构" },
  { href: "/workflows", label: "工作流", hint: "运行" },
  { href: "/promptops/playground", label: "PromptOps", hint: "调试" },
  { href: "/governance/approvals", label: "审计与审批", hint: "风险" },
  { href: "/observability/traces", label: "观测与成本", hint: "链路" },
  { href: "/access/roles", label: "权限治理", hint: "角色" },
];
