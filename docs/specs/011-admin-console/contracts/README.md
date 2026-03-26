# 011 Admin Console Contracts

本目录沉淀第三阶段的页面契约、mock 数据结构和交互约束，用于把第二阶段原型平滑迁移到符合仓库技术栈的 `Next.js + React + TypeScript` 控制台工程。

## 文件说明
- `page-contracts.md`：页面到 `services/*` 的读取/写入边界、查询参数、返回结构、风险动作
- `interaction-rules.md`：审批、轮询、链路、异常态、权限态等交互约束
- `mock-data-schema.md`：当前前端工程 mock 数据结构与后续替换规则

## 代码映射
- 应用入口：`apps/admin-console/app/`
- 壳层与导航：`apps/admin-console/lib/consoleLayout.tsx`
- 契约与 mock：`apps/admin-console/lib/`
- 共享组件：`packages/admin-ui/src/`
