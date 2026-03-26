# 011 Admin Console

## 目标
构建企业 AI 中台后台管理界面，承接平台管理员、应用管理员、知识管理员、开发者与审计人员的配置、治理、运营和审计工作。

## 范围
- 控制台全局信息架构、路由与菜单
- 页面级布局、操作路径与关键交互
- 权限占位、状态流转与组件骨架
- 为后续原型开发和前后端契约定义提供文档基础

## 第一阶段
> 完成可直接驱动高保真 UI 原型的 PRD 文档，不接后端，以静态数据和组件骨架为主。

- 输入需求：`docs/specs/011-admin-console/req.md`
- 产出目录：`docs/specs/011-admin-console/prd/prd.md`
- 当前状态：Done（2026-03-13）
- 核心产物：
  - 页面清单与路由树
  - 全局布局与导航定义
  - 页面布局说明
  - 用户操作路径
  - 关键交互与状态流转
  - 组件骨架与权限占位规则

## 第二阶段
> 基于第一阶段 PRD 完成高保真UI，核心是编写HTML代码。
- 输入需求：`docs/specs/011-admin-console/prd/prd.md`
- 产出目录：`docs/specs/011-admin-console/ui/`
- 当前状态：Done（2026-03-13）
- 目标产物：
  - `PageHeader`
  - `SearchFilterBar`
  - `DataTable`
  - `StatusBadge`
  - `JsonViewer`
  - `ApprovalBanner`
  - `ToolExecutionTimeline`

## 第三阶段
> 基于第二阶段完成前端核心代码编写，并沉淀公共组件
- 输入需求：`docs/specs/011-admin-console/ui/`
- 产出目录：`apps/admin-console`、`docs/specs/011-admin-console/contracts/`
- 当前状态：Done（2026-03-13）
- 目标产物：
  - `Next.js + React + TypeScript` 控制台应用
  - `packages/admin-ui` 共享组件包
  - 页面壳层、真实路由与页面模块
  - mock 数据目录与服务对接边界
  - 页面契约、交互约束与轮询规则
  - UI 原型到工程代码的迁移落点

## 验收标准
- 第一阶段 PRD 可直接支持设计或前端输出高保真后台原型
- 主要页面均覆盖布局、操作路径、关键交互和异常状态
- 菜单、路由、角色入口与权限占位保持一致
- 第三阶段代码已迁移到 `apps/admin-console`，并符合 `Next.js + React + TypeScript` 技术栈
- 通用组件已沉淀到 `packages/admin-ui`，页面只负责组合与业务映射
- 控制台页面仅通过 `services/*` 公开 API 作为后续对接边界
