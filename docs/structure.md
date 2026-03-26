# 推荐目录结构

```text
enterprise-ai-hub/
├─ AGENTS.md
├─ README.md
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
├─ tsconfig.base.json
├─ .editorconfig
├─ .gitignore
├─ .env.example
│
├─ docs/
│  ├─ product/
│  │  ├─ PRD.md
│  │  ├─ scope.md
│  │  ├─ roadmap.md
│  │  └─ user-scenarios.md
│  │
│  ├─ architecture/
│  │  ├─ overview.md
│  │  ├─ tech-stack.md
│  │  ├─ system-context.md
│  │  ├─ deployment.md
│  │  ├─ data-model.md
│  │  ├─ observability.md
│  │  └─ security-governance.md
│  │
│  ├─ adr/
│  │  ├─ ADR-001-monorepo.md
│  │  ├─ ADR-002-ts-fullstack.md
│  │  ├─ ADR-003-model-gateway.md
│  │  ├─ ADR-004-rag-architecture.md
│  │  └─ ADR-005-agent-runtime.md
│  │
│  ├─ specs/
│  │  ├─ 001-model-gateway/
│  │  │  ├─ spec.md
│  │  │  ├─ tasks.md
│  │  │  ├─ api.yaml
│  │  │  └─ test-cases.md
│  │  ├─ 002-knowledge-ingestion/
│  │  ├─ 003-retrieval-service/
│  │  ├─ 004-memory-service/
│  │  ├─ 005-tool-gateway/
│  │  ├─ 006-agent-runtime/
│  │  ├─ 007-workflow-service/
│  │  ├─ 008-app-service/
│  │  ├─ 009-auth-policy-audit/
│  │  └─ 010-observability-cost/
│  │
│  ├─ runbooks/
│  │  ├─ local-dev.md
│  │  ├─ release.md
│  │  ├─ incident-response.md
│  │  └─ data-backfill.md
│  │
│  └─ glossary.md
│
├─ apps/
│  ├─ portal-web/
│  │  ├─ AGENTS.override.md
│  │  ├─ src/
│  │  └─ tests/
│  │
│  ├─ admin-console/
│  │  ├─ AGENTS.override.md
│  │  ├─ src/
│  │  └─ tests/
│  │
│  ├─ openapi-gateway/
│  │  ├─ src/
│  │  └─ tests/
│  │
│  └─ docs-site/
│     └─ src/
│
├─ services/
│  ├─ model-gateway/
│  │  ├─ AGENTS.override.md
│  │  ├─ src/
│  │  │  ├─ controllers/
│  │  │  ├─ application/
│  │  │  ├─ domain/
│  │  │  ├─ infrastructure/
│  │  │  ├─ providers/
│  │  │  ├─ policies/
│  │  │  └─ dto/
│  │  ├─ test/
│  │  └─ README.md
│  │
│  ├─ knowledge-ingestion-service/
│  ├─ retrieval-service/
│  ├─ memory-service/
│  ├─ tool-gateway/
│  ├─ agent-runtime-service/
│  ├─ workflow-service/
│  ├─ app-service/
│  ├─ auth-service/
│  ├─ policy-service/
│  ├─ approval-service/
│  ├─ audit-service/
│  ├─ eval-service/
│  ├─ feedback-service/
│  ├─ observability-service/
│  └─ cost-billing-service/
│
├─ packages/
│  ├─ shared-config/
│  ├─ shared-types/
│  ├─ shared-utils/
│  ├─ ui-kit/
│  ├─ prompt-sdk/
│  ├─ model-sdk/
│  ├─ tool-sdk/
│  ├─ auth-sdk/
│  ├─ telemetry-sdk/
│  ├─ workflow-schema/
│  ├─ domain-events/
│  └─ test-kit/
│
├─ integrations/
│  ├─ model-providers/
│  │  ├─ openai/
│  │  ├─ qwen/
│  │  ├─ claude/
│  │  └─ vllm/
│  │
│  ├─ knowledge-connectors/
│  │  ├─ s3/
│  │  ├─ webdav/
│  │  ├─ database/
│  │  ├─ wiki/
│  │  └─ file-upload/
│  │
│  ├─ tools/
│  │  ├─ crm/
│  │  ├─ erp/
│  │  ├─ oa/
│  │  ├─ bpm/
│  │  └─ mail/
│  │
│  └─ channels/
│     ├─ wecom/
│     ├─ feishu/
│     ├─ dingtalk/
│     └─ web/
│
├─ infra/
│  ├─ docker/
│  ├─ k8s/
│  ├─ helm/
│  ├─ terraform/
│  ├─ scripts/
│  └─ monitoring/
│
├─ configs/
│  ├─ models/
│  ├─ prompts/
│  ├─ routing/
│  ├─ guardrails/
│  ├─ tools/
│  ├─ workflows/
│  └─ feature-flags/
│
├─ database/
│  ├─ migrations/
│  ├─ seeds/
│  ├─ schemas/
│  └─ init/
│
├─ examples/
│  ├─ mvp-rag-app/
│  ├─ tool-agent-demo/
│  └─ embedded-widget-demo/
│
├─ tests/
│  ├─ contract/
│  ├─ integration/
│  ├─ e2e/
│  ├─ performance/
│  └─ fixtures/
│
└─ .github/
   ├─ workflows/
   ├─ pull_request_template.md
   └─ ISSUE_TEMPLATE/
```

---

# 为什么我推荐这个结构

## 1. `docs/` 要成为 Spec Coding 的核心入口

你现在最需要的不是先把代码目录搭满，而是先把 **PRD / 架构 / ADR / 模块 spec / tasks** 固化到仓库里。因为 Spec Coding 成败很大程度取决于：AI 是不是能在仓库内读到稳定、一致、可执行的规则。

你的项目文档已经说明，这份需求文档本身要作为产品设计、技术架构、研发实施、测试验收和项目管理的统一依据；同时技术文档也强调要按八层能力分解落地，而不是把中台能力混成单一应用。 

所以：

* `docs/product/` 放产品范围、路线图、场景
* `docs/architecture/` 放总架构、数据、部署、安全、观测
* `docs/adr/` 放关键设计决策
* `docs/specs/` 放可直接交给 Codex 实施的模块规格

这会让 agent 不再依赖上下文聊天记忆，而是依赖仓库事实。

## 2. `apps/` 和 `services/` 分开，避免“前后端与平台能力”耦死

你的技术架构明确区分了接入层、应用层、编排执行层、工具协议层、知识记忆层、模型服务层、控制治理层和观测运营层。 

所以目录上不建议只做：

```text
apps/web
apps/api
```

这种结构对普通 SaaS 可以，但对 AI 中台不够。

更适合的是：

* `apps/` 放用户直接接触的入口

  * `portal-web`
  * `admin-console`
  * `openapi-gateway`

* `services/` 放平台核心能力

  * `model-gateway`
  * `retrieval-service`
  * `tool-gateway`
  * `audit-service`

这样你后面做多渠道接入、多业务应用、多租户治理时不会乱。

## 3. `packages/` 放共享协议，不要把共享逻辑散落到各服务里

你的平台要求模型、知识、工具、工作流、权限、审计、链路元数据要统一管理。PRD 里还明确要求统一配置中心、元数据中心和日志链路。

这意味着必须有稳定的共享层：

* `shared-types`：公共 DTO、对象类型
* `workflow-schema`：工作流节点 schema
* `domain-events`：统一事件定义
* `telemetry-sdk`：埋点与 trace helper
* `tool-sdk` / `model-sdk`：统一接入协议

否则每个服务自己发明一套字段，后面做审计和成本统计会非常痛苦。

## 4. `integrations/` 单独拿出来，防止厂商和系统适配污染核心代码

技术文档里已经很明确：模型层不应让应用或 Agent 直接调用厂商 SDK，而应统一走 Model Gateway；工具也应通过 Tool Gateway，而不是让 Agent 直接访问企业系统。

所以适配代码不应该塞进核心业务服务里，而应该单独放：

* `integrations/model-providers`
* `integrations/knowledge-connectors`
* `integrations/tools`
* `integrations/channels`

这样能保证核心层始终围绕“统一协议、统一治理、统一审计”。

## 5. `configs/` 要独立，落实“配置优先”

你的 PRD 直接写了“配置优先”，并要求统一管理模型配置、知识接入配置、工具配置、工作流配置、安全策略配置、路由策略配置。

所以这些不该只存在数据库里，也不该只存在页面表单里，而应该在仓库中保留一部分可版本化配置：

* `configs/models`
* `configs/prompts`
* `configs/routing`
* `configs/guardrails`
* `configs/tools`
* `configs/workflows`

这样非常适合 AI 参与修改，也适合后续 code review。

---

# 这套结构最适合你的开发顺序

## 第一阶段：先把这些目录建出来

```text
docs/
apps/portal-web
apps/admin-console
services/model-gateway
services/knowledge-ingestion-service
services/retrieval-service
services/app-service
services/auth-service
services/audit-service
packages/shared-types
packages/telemetry-sdk
configs/
database/
tests/
```

因为你的 PRD 第一阶段重点就是：

* 模型网关基础版
* 知识中枢基础版
* 应用交付基础版
* 基础权限控制
* 基础日志与审计能力

## 第二阶段：再补这些

```text
services/tool-gateway
services/agent-runtime-service
services/workflow-service
services/memory-service
services/eval-service
services/feedback-service
configs/workflows
configs/tools
```

这对应第二阶段“工具型智能助手”：工具中心、单 Agent、工作流基础版、会话记忆、PromptOps / EvalOps 初版、审批机制。

## 第三阶段：最后演进

```text
services/approval-service
services/observability-service
services/cost-billing-service
packages/domain-events
packages/workflow-schema
integrations/channels/*
```

这对应复杂流程、审批、全链路评测、成本治理、多 Agent。

---

# 我建议每个 spec 目录长这样

比如 `docs/specs/001-model-gateway/`

```text
001-model-gateway/
├─ spec.md
├─ tasks.md
├─ api.yaml
├─ schema.md
├─ test-cases.md
└─ notes.md
```

### `spec.md`

写目标、范围、不做项、约束、验收。

### `tasks.md`

写能让 Codex 连续执行的原子任务清单。

### `api.yaml`

先锁接口契约，再让 AI 写实现。

### `test-cases.md`

写正常流、异常流、权限流、审计流。

---

# 我建议你这样拆第一批 spec

```text
docs/specs/
├─ 001-model-gateway/
├─ 002-knowledge-ingestion/
├─ 003-retrieval-service/
├─ 004-app-service/
├─ 005-auth-audit-baseline/
├─ 006-tool-gateway/
├─ 007-agent-runtime/
├─ 008-workflow-service/
├─ 009-memory-service/
└─ 010-observability-cost/
```

这套顺序和你的文档一致，也符合技术架构里的核心服务拆分建议。技术文档实际上已经给出了类似的运行面/治理面服务划分，比如 `model-gateway`、`knowledge-ingestion-service`、`retrieval-service`、`memory-service`、`agent-runtime-service`、`workflow-service`、`tool-gateway`、`auth-service`、`policy-service`、`approval-service`、`audit-service`、`eval-service`、`cost-billing-service` 等。

---

# 你现在最不建议采用的目录结构

我不建议你一开始就用这种：

```text
src/
  modules/
    ai/
    rag/
    agent/
    user/
    admin/
```

原因很简单：

* 它适合单体应用，不适合平台化中台
* 后面模型网关、检索服务、工具网关、审计服务会互相缠绕
* AI agent 很难判断哪些是平台核心边界，哪些只是应用逻辑
* 二期和三期扩展时，重构成本会很高

对于企业 AI 中台，你的核心问题不是“能不能把功能写出来”，而是“能不能把模型、知识、工具、权限、审计这些能力长期稳定沉淀下来”。你的文档本身也反复强调中台职责在这些层，而不是只做一个 Agent 应用。