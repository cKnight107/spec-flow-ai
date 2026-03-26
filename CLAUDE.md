# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Enterprise AI Hub — 企业 AI 中台 monorepo，使用 pnpm workspace + Turborepo 管理，基于 TypeScript 开发。

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 启动所有 workspace 开发服务（并行）
pnpm build            # 构建所有包（Turbo）
pnpm lint             # 运行 lint（当前为 tsc --noEmit）
pnpm typecheck        # 类型检查
pnpm test             # 运行测试
pnpm format           # 格式化代码
pnpm clean            # 清理构建产物
```

运行单个包的命令（在对应目录下）：
```bash
cd apps/admin-console && pnpm dev     # 仅启动 admin-console
cd services/model-gateway && pnpm lint # 仅检查 model-gateway
```

## 技术栈

- **前端**：Next.js 15 + React 19 + TypeScript
- **后端**：NestJS + TypeScript
- **Agent / Workflow**：LangGraph JS + LangChain JS
- **数据层**：PostgreSQL + Redis + Object Storage
- **检索层**：pgvector / Milvus + OpenSearch
- **可观测**：OpenTelemetry + Prometheus + Grafana + Loki

## 架构与目录结构

```
apps/                前端入口应用（admin-console, portal-web, openapi-gateway, docs-site）
services/            后端微服务（model-gateway, auth-service, retrieval-service 等 16 个服务）
packages/            跨应用共享库（shared-config, shared-types, admin-ui, telemetry-sdk 等）
integrations/        外部系统适配器
configs/             模型、Prompt、路由等可版本化配置
database/            迁移、种子、Schema 脚本
infra/               部署与监控资产
docs/                产品、架构、ADR、spec、runbook 文档
tests/               契约、集成、E2E、性能测试
```

**workspace 范围**：`apps/*`, `services/*`, `packages/*`, `integrations/*`

所有内部包使用 `workspace:*` 协议互相引用，包名前缀为 `@enterprise-ai-hub/`。

## 开发规范

- 默认使用中文沟通与提交说明
- 新需求先补 `docs/specs/<id>-<name>/spec.md` 与 `tasks.md`
- 关键架构决策先写 ADR（`docs/adr/`），再改实现
- 涉及 AI 辅助改动时，在 `docs/ai-change-log/` 追加变更记录
- 优先在 `packages/` 下寻找可复用工具或组件
- 参考 `docs/rules/` 中的编码规范与架构边界约束

## 文档入口

- `docs/product/PRD.md` — 产品需求
- `docs/architecture/overview.md` — 技术架构概览
- `docs/adr/` — 架构决策记录
- `docs/specs/` — 模块规格与任务拆解
- `docs/rules/` — 编码规范与测试质量约束
