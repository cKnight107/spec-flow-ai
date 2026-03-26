# Spec Flow AI

一个以 Spec-Driven Development 为核心的开源 TypeScript monorepo。它强调先定义规格、边界、任务和验收标准，再进入实现、测试和演进，让复杂系统开发可以按规范持续推进，而不是直接从代码开始堆功能。

## 项目定位

本项目的核心不是某一个业务领域，而是一套可复用的 Spec Dev 规范式开发框架。仓库通过 `docs/product`、`docs/architecture`、`docs/adr`、`docs/specs`、`docs/rules` 组织事实源，约束研发过程遵循：

- 先有产品范围与架构边界，再做模块设计
- 先有 spec 与 tasks，再进入编码实现
- 关键决策进入 ADR，而不是散落在代码提交里
- 测试、实现、文档都要能回溯到规格
- AI 参与改动时，保留可复盘的 change log

企业 AI 中台只是这个仓库当前承载的一个示例内容和落地方向，而不是唯一主题。理论上你也可以用同样的方法论驱动别的复杂平台型项目。

## Spec Dev 工作方式

这个仓库默认采用文档驱动、规格先行的协作流程：

1. 在 `docs/product/` 明确范围、路线图和场景
2. 在 `docs/architecture/` 与 `docs/adr/` 确认技术方案与关键决策
3. 在 `docs/specs/<id>-<name>/` 编写 `spec.md` 与 `tasks.md`
4. 按规格在 `apps/`、`services/`、`packages/`、`integrations/` 中落地实现
5. 在 `tests/` 中补齐可回溯验证
6. 在 `docs/ai-change-log/` 记录 AI 参与的有效变更

如果你想找的是“如何让 AI Coding / Agent Coding 不脱离规格乱写代码”，这个仓库的主要价值就在这里。

## 当前状态

仓库目前处于早期公开阶段，重点是：

- Spec Dev 所需的目录约定与工作区配置
- 产品、架构、ADR、Spec、规则等文档事实源
- 企业 AI 中台方向的部分应用、服务、共享包与适配器骨架

这意味着仓库已经适合作为规范样例、架构参考和二次开发起点，但还不是一个开箱即用的完整平台发行版。

## 当前示例主题

仓库当前用“企业 AI 中台”作为示例领域来承载这套方法论，主要覆盖：

- 多模型统一接入与路由
- 企业知识接入、索引、检索与引用溯源
- 应用装配、发布与多渠道接入
- 权限、审计、观测与成本治理
- 为 Tool Calling、Agent Runtime、Workflow 预留清晰边界

如果你关心的是 AI 平台建设，这部分内容可以直接参考；如果你关心的是 Spec Dev 工作法，也可以忽略具体业务主题，只看仓库的规范组织方式。

## 技术栈

- 前端：Next.js、React、TypeScript
- 后端：NestJS、TypeScript
- Agent / Workflow：LangGraph JS、LangChain JS
- 数据层：PostgreSQL、Redis、Object Storage
- 检索层：pgvector / Milvus、OpenSearch
- 可观测：OpenTelemetry、Prometheus、Grafana、Loki
- 工程化：pnpm workspace、Turborepo、TypeScript

## 仓库结构

```text
docs/          产品、架构、ADR、Spec、Runbook、AI 变更记录
apps/          门户、管理台、开放接口等用户入口
services/      模型、知识、工具、工作流、治理等核心服务
packages/      共享类型、SDK、Schema、测试工具
integrations/  模型厂商、知识源、工具、渠道适配器
configs/       可版本化配置，如模型、路由、Prompt、策略
database/      数据库迁移、种子、Schema、初始化脚本
infra/         部署、基础设施与监控相关资产
examples/      示例应用与演示工程
tests/         契约、集成、端到端、性能测试
```

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 10+
- PostgreSQL
- Redis
- Object Storage
- OpenSearch

### 本地启动

```bash
cp .env.example .env
pnpm install
pnpm dev
```

根据当前 `docs/runbooks/local-dev.md`，在启动应用前还需要先准备 PostgreSQL、Redis、Object Storage 和 OpenSearch 等依赖服务。

## 常用命令

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm typecheck
pnpm clean
pnpm format
```

## 文档入口

如果你是第一次阅读这个仓库，建议按下面顺序了解：

1. `docs/product/PRD.md`
2. `docs/product/scope.md`
3. `docs/architecture/overview.md`
4. `docs/adr/`
5. `docs/specs/`
6. `docs/runbooks/local-dev.md`

`docs/` 是本仓库的事实源。产品范围、架构边界、开发规则和模块规格都以文档为准。

## 路线图

当前路线图分为三个阶段：

1. 知识问答 MVP：模型网关、知识中枢、应用交付、基础权限与审计
2. 工具型智能助手：Tool Gateway、单 Agent 执行、Workflow 编排、会话记忆、审批
3. 流程自动化与多智能体：多 Agent 协作、长任务恢复、高级治理、成本与评测深化

详细内容见 `docs/product/roadmap.md`。

## 开发与贡献

欢迎基于 Issue、讨论或 Pull Request 参与改进。在提交代码前，请优先阅读以下文档：

- `docs/rules/README.md`
- `docs/rules/architecture-boundaries.md`
- `docs/rules/code-style.md`
- `docs/specs/README.md`

本仓库采用 Spec Dev 驱动的协作方式：

- 新需求优先补充 `docs/specs/`
- 关键架构调整优先补充 `docs/adr/`
- AI 参与的有效改动记录在 `docs/ai-change-log/`

## 已有模块概览

仓库已经预留了以下主要模块方向：

- `apps/`：`portal-web`、`admin-console`、`openapi-gateway`、`docs-site`
- `services/`：`model-gateway`、`retrieval-service`、`memory-service`、`tool-gateway`、`workflow-service` 等
- `packages/`：共享配置、数据库工具、Telemetry SDK、UI/Schema/SDK 等基础包
- `integrations/`：OpenAI、Qwen、Claude、vLLM、飞书、企微、钉钉、S3、Wiki 等适配器目录

这些目录中既包含已实现内容，也包含为后续演进保留的工程骨架。它们一方面服务于企业 AI 中台示例，另一方面也展示了 Spec Dev 在复杂 monorepo 中的组织方式。