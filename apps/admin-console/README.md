# Admin Console

## 说明
`apps/admin-console` 是企业 AI 中台后台控制面的前端入口，按 `docs/architecture/tech-stack.md` 与 `docs/architecture/overview.md` 落为 `Next.js + React + TypeScript` 应用。

## 目录
```text
apps/admin-console/
├─ app/                 Next App Router 页面入口
├─ lib/                 页面元数据、mock 数据与本地工具
├─ next.config.ts
├─ package.json
├─ tsconfig.json
└─ next-env.d.ts
```

## 共享组件
通用组件已上移到 `packages/admin-ui`：
- `PageHeader`
- `SearchFilterBar`
- `DataTable`
- `StatusBadge`
- `JsonViewer`
- `ApprovalBanner`
- `ToolExecutionTimeline`

## 本地使用
- `pnpm --filter @enterprise-ai-hub/admin-console dev`
- `pnpm --filter @enterprise-ai-hub/admin-console typecheck`
- `pnpm --filter @enterprise-ai-hub/admin-console build`

## 边界
- 页面当前使用本地 mock 数据驱动，但未来只允许通过 `services/*` 公开 API 对接
- 权限、审批、轮询、链路等交互规则以 `docs/specs/011-admin-console/contracts/` 为准
