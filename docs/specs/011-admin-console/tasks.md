# 011 Admin Console Tasks

## 第一阶段
- [x] 明确后台控制台的角色范围与页面清单
- [x] 定义全局路由树、菜单结构与权限占位规则
- [x] 输出统一布局、页面状态流转与组件骨架规范
- [x] 在 `prd/` 目录补齐可驱动高保真 UI 的页面级 PRD
- [x] 补充阶段验收标准与交付边界

## 第二阶段
- [x] 基于第一阶段 PRD 输出高保真后台页面 HTML
- [x] 沉淀 `PageHeader`、`SearchFilterBar`、`DataTable`、`StatusBadge`
- [x] 沉淀 `JsonViewer`、`ApprovalBanner`、`ToolExecutionTimeline`
- [x] 为关键页面补齐静态 JSON 数据与组件演示
- [x] 覆盖正常态、加载中、空态、异常态、无权限、审批中等页面状态

## 第三阶段
- [x] 为页面定义前后端契约与 mock 数据结构
- [x] 补充高风险动作、审批流、轮询与链路页的交互约束
- [x] 明确 UI 原型到前端工程实现的切分边界
- [x] 评估并迁移 `ui/` 原型到 `apps/admin-console` 的工程化方案
- [x] 按 `docs/architecture` 技术栈落地为 `Next.js + React + TypeScript`
- [x] 将通用组件沉淀到 `packages/admin-ui`
