# Admin UI

## 说明
`packages/admin-ui` 是企业 AI 中台后台控制台的共享 UI 组件包，提供 `apps/admin-console` 复用的基础展示组件与类型定义。

当前包以 `React + TypeScript` 形式直接导出源码，供工作区内应用按 workspace 依赖方式消费。

## 目录
```text
packages/admin-ui/
├─ src/
│  ├─ index.ts
│  ├─ types.ts
│  ├─ PageHeader.tsx
│  ├─ SearchFilterBar.tsx
│  ├─ DataTable.tsx
│  ├─ StatusBadge.tsx
│  ├─ JsonViewer.tsx
│  ├─ ApprovalBanner.tsx
│  └─ ToolExecutionTimeline.tsx
├─ package.json
└─ tsconfig.json
```

## 导出组件
- `PageHeader`
- `SearchFilterBar`
- `DataTable`
- `StatusBadge`
- `JsonViewer`
- `ApprovalBanner`
- `ToolExecutionTimeline`

## 导出类型
- `ApprovalBannerProps`
- `DataTableColumn`
- `DataTableProps`
- `JsonViewerProps`
- `PageHeaderProps`
- `SearchFilterBarProps`
- `StatusBadgeProps`
- `StatusTone`
- `TimelineItem`
- `ToolExecutionTimelineProps`

## 使用方式
在工作区应用中通过 workspace 依赖引入：

```ts
import { PageHeader, DataTable, StatusBadge } from "@enterprise-ai-hub/admin-ui";
```

本地检查：
- `pnpm --filter @enterprise-ai-hub/admin-ui typecheck`

## 设计边界
- 只承载控制台通用展示组件，不放业务状态管理和页面级编排逻辑
- 组件保持轻量，样式语义由消费方的全局主题统一承接
- 若组件被多个应用复用，应优先沉淀到此包，而不是散落在单个入口应用内
