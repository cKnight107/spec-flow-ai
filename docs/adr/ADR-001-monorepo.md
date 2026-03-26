# ADR-001：采用 Monorepo 组织企业 AI 中台

## 状态
Accepted

## 决策
采用单仓库管理 `apps/`、`services/`、`packages/`、`integrations/`、`configs/` 与 `docs/`。

## 原因
- 平台能力与应用入口共享大量协议与配置
- 需要让产品、架构、规格与实现保持同仓同步
- 便于统一测试、发布与变更审计

## 影响
- 需引入工作区与增量任务工具
- 需通过目录边界避免耦合失控
