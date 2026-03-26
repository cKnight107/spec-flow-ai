# 013 Telemetry Tracing

## 目标
为企业 AI 中台建立统一的日志、分布式链路追踪与 LLM 调用审计规约，确保任一用户请求都可以从入口请求、工作流编排、检索、工具调用一路追踪到模型调用与结果归档。

## 背景
- [docs/architecture/tech-stack.md](docs/architecture/tech-stack.md) 已明确可观测基础设施为 `OpenTelemetry + Prometheus + Grafana + Loki`
- [docs/architecture/observability.md](docs/architecture/observability.md) 已要求链路、成本、AI 特有字段统一
- [docs/specs/001-model-gateway/spec.md](docs/specs/001-model-gateway/spec.md) 已要求输出稳定的 usage 与 audit 元数据
- 当前仓库缺少一份针对“日志、Trace、Prompt/Response 审计、脱敏与存储边界”的实施规约

## 范围
- 请求上下文生成与跨服务透传
- 结构化日志规范
- Trace / Span 命名与属性规范
- LLM 调用、Prompt 渲染、检索、工具调用的埋点规范
- Prompt / Response 审计记录规范
- 脱敏、权限、采样、保留期与成本控制规则

## 不做项
- 不定义 Grafana 大盘的最终 UI 细节
- 不强制绑定单一模型厂商 SDK
- 不将完整 Prompt / Response 直接写入通用日志系统
- 不替代安全审计、审批流或业务事件总线

## 设计原则
- 统一标准优先：Trace 统一使用 OpenTelemetry 语义与上下文传播
- 分层存储优先：热链路元数据与冷审计载荷分层存储
- 结构化优先：日志必须为 JSON 结构化日志，禁止拼接自由文本作为主日志格式
- 低侵入优先：通过共享 `telemetry-sdk` 与拦截器、中间件、provider wrapper 落地，避免各服务重复发明字段
- 隐私优先：默认脱敏，默认最小化记录，默认受控访问

## 推荐技术选型

### 必选
- Trace SDK：`OpenTelemetry`
- 日志：`Pino`
- 请求上下文：`AsyncLocalStorage`
- Trace 后端：`Grafana Tempo`
- 日志后端：`Loki`
- 指标：`Prometheus`

### 可选
- AI 专项观测界面：`Langfuse`

说明：
- `Langfuse` 可作为第二阶段的 AI 调用分析层，但不作为主链路标准，不替代 OpenTelemetry
- 若未引入 `Langfuse`，本规约仍完整成立

## 逻辑架构

### 埋点层次
1. 入口层：HTTP / RPC / Queue Consumer 接收请求并建立根 Span
2. 应用层：Use Case / Workflow / Agent 执行编排
3. 能力层：检索、工具、模型网关等核心能力调用
4. 审计层：对关键调用形成结构化审计记录并归档

### 推荐链路形态
```text
http.request
  -> app.invoke
    -> workflow.run
      -> prompt.render
      -> retrieval.search
      -> tool.call
      -> llm.call
```

## 统一上下文字段

### 必填字段
- `trace_id`：全链路唯一标识
- `span_id`：当前节点标识
- `request_id`：入口请求标识
- `tenant_id`：租户标识
- `app_id`：应用标识
- `user_id`：终端用户标识；无登录态时填 `anonymous`
- `service_name`：当前服务标识
- `environment`：`local` / `dev` / `test` / `prod`
- `timestamp`：事件时间

### 条件必填字段
- `session_id`：存在多轮会话时必填
- `conversation_id`：存在会话归档时必填
- `workflow_id`：进入工作流时必填
- `execution_id`：异步任务、工作流运行实例、批处理任务必填
- `tool_call_id`：工具调用时必填
- `audit_id`：已归档审计载荷时必填

### 关联规则
- `trace_id` 用于串联日志、Trace、指标、告警与审计
- `request_id` 面向入口排障与 API 对账
- `audit_id` 只用于定位完整 Prompt / Response 归档记录
- `conversation_id` 与 `session_id` 不等价，不可混用

## 结构化日志规约

### 基本要求
- 所有服务端日志必须输出 JSON
- 日志字段采用稳定 key，禁止同义多名
- 所有日志必须自动注入 `trace_id`、`span_id`、`request_id`
- 错误日志必须包含 `error_code`、`error_type`、`message`、`stack` 的结构化字段

### 日志级别
- `debug`：仅限本地或短期排障，不默认进入长期保留
- `info`：关键业务状态变化与调用摘要
- `warn`：可恢复异常、降级、重试、限流
- `error`：失败、超时、外部依赖异常、治理命中导致的请求终止

### 禁止直接写入日志的内容
- 原始用户密钥、Token、Cookie、Authorization Header
- 完整 Prompt 原文
- 完整模型响应原文
- 工具调用中的敏感业务入参与出参
- 明文手机号、邮箱、身份证、银行卡、企业内部密级文本

### 日志中允许记录的摘要
- `prompt_preview`：脱敏且截断后的 Prompt 预览，建议不超过 256 字符
- `response_preview`：脱敏且截断后的响应预览，建议不超过 256 字符
- `prompt_hash`
- `response_hash`
- `payload_bytes`

## Trace / Span 规约

### Span 命名规范
- HTTP 入口：`http.request`
- 应用请求：`app.invoke`
- 工作流运行：`workflow.run`
- Prompt 渲染：`prompt.render`
- 检索：`retrieval.search`
- 重排序：`retrieval.rerank`
- 工具调用：`tool.call`
- 模型调用：`llm.call`
- 审计归档：`audit.persist`

### 通用 Span 属性
- `saas.tenant.id`
- `saas.app.id`
- `enduser.id`
- `ai.workflow.id`
- `ai.execution.id`
- `service.name`
- `deployment.environment`

### AI 专项 Span 属性
- `ai.provider`
- `ai.model`
- `ai.operation`
- `ai.prompt.template_id`
- `ai.prompt.version`
- `ai.prompt.hash`
- `ai.response.hash`
- `ai.usage.input_tokens`
- `ai.usage.output_tokens`
- `ai.usage.total_tokens`
- `ai.cost.estimated_usd`
- `ai.response.finish_reason`
- `ai.guardrail.hit`
- `ai.cache.hit`

### LLM 调用 Span 必填属性
- `ai.operation`
- `ai.provider`
- `ai.model`
- `enduser.id`
- `saas.tenant.id`
- `saas.app.id`
- `ai.prompt.template_id` 或 `ai.prompt.source=inline`
- `ai.usage.input_tokens`
- `ai.usage.output_tokens`
- `ai.cost.estimated_usd`
- `http.status_code` 或厂商等价状态

### 错误记录要求
- Span 失败时必须设置状态为 error
- 同步记录 `error_code`、`error_type`、`retryable`
- 若发生回退模型调用，原失败 Span 不得覆盖，必须保留失败与回退两个节点

## LLM 调用审计规约

### 审计目标
满足以下问题的追踪需求：
- 是哪个用户触发的调用
- 命中了哪个应用、工作流、会话
- 实际调用了哪个 provider / model
- 使用了哪个 Prompt 模板、版本和渲染参数
- 模型返回了什么结果
- 消耗了多少 Token、成本和时延
- 是否触发敏感脱敏、重试、回退、审批或人工接管

### 审计记录最小字段集
- `audit_id`
- `trace_id`
- `request_id`
- `tenant_id`
- `app_id`
- `user_id`
- `session_id`
- `conversation_id`
- `workflow_id`
- `execution_id`
- `provider`
- `model`
- `model_endpoint`
- `prompt_template_id`
- `prompt_version`
- `prompt_source`
- `prompt_hash`
- `prompt_preview`
- `response_hash`
- `response_preview`
- `input_tokens`
- `output_tokens`
- `total_tokens`
- `estimated_cost`
- `latency_ms`
- `status`
- `finish_reason`
- `error_code`
- `started_at`
- `finished_at`

### 完整载荷归档字段
- `prompt_text_redacted`
- `response_text_redacted`
- `tool_inputs_redacted`
- `tool_outputs_redacted`
- `attachments_metadata`
- `safety_labels`
- `retention_policy`
- `redaction_version`

### 存储分层
- Trace 层：只存时序、状态、耗时与调用属性，不存大文本正文
- Log 层：只存摘要、预览、错误与排障信息，不存完整正文
- Audit 层：存脱敏后的完整 Prompt / Response 与关键上下文

### 存储边界要求
- 完整 Prompt / Response 必须落到受控审计存储，不得直接写入 Loki
- 审计存储默认要求加密、TTL、按租户隔离、受 RBAC 控制
- 审计层若写对象存储，元数据仍需落结构化索引库，便于按 `trace_id` / `audit_id` 查询

## Prompt 与 Response 处理规则

### Prompt 来源标记
- `template`
- `inline`
- `system-generated`
- `fallback`

### 必须记录的 Prompt 相关信息
- 模板 ID
- 模板版本
- 渲染变量摘要
- Prompt 哈希
- 脱敏后的预览

### 响应记录要求
- 保留最终响应摘要与哈希
- 流式输出需记录首包时间、末包时间、总片段数
- 若响应被后处理或裁剪，必须记录处理步骤摘要

## 脱敏与安全要求

### 默认脱敏对象
- 用户输入中的个人敏感信息
- 企业内部标识、凭证、口令、连接串
- 工具调用参数中的业务主数据
- 上传文件中的 OCR / 抽取文本

### 脱敏策略
- 结构化字段优先做字段级脱敏
- 非结构化文本优先做规则脱敏，再进行摘要和哈希
- 对无法判定是否敏感的全文，默认不进入普通日志

### 访问控制
- 开发与测试环境可查看脱敏后的预览
- 完整审计载荷仅授权给审计、治理、平台运维角色
- 管理台若展示 Prompt / Response，必须显式标记“脱敏内容”与“数据来源”

## 采样、保留与成本控制

### Trace 采样
- 生产默认采用基于概率或尾采样的组合方案
- 错误链路、超时链路、成本异常链路必须强制保留
- 涉及审批、投诉、人工接管的链路必须强制保留

### 日志保留建议
- `info`：7 到 15 天
- `warn/error`：15 到 30 天
- 审计归档：按租户等级与合规要求单独配置，默认不低于 30 天

### 成本控制
- 高频成功日志以摘要为主
- 大文本只进审计存储
- 对重复失败日志增加聚合与限频

## 实现约束

### 共享层
必须在 `packages/` 提供统一能力，至少包含：
- `telemetry-sdk`
- Trace helper
- 日志上下文注入 helper
- Prompt / Response 脱敏 helper
- 审计记录 DTO 与 schema

### 服务接入约束
- `services/model-gateway` 必须最先接入本规约
- `services/retrieval-service`、`services/tool-gateway`、`services/workflow-service` 必须沿用相同字段
- 应用与服务不得直接依赖厂商 SDK 埋点格式作为平台标准

### 管理台展示约束
- 链路页面至少支持按 `trace_id`、`request_id`、`user_id`、`model`、`prompt_version` 查询
- 任一异常详情页必须可跳转到关联 `trace_id` 与 `audit_id`

## 分阶段实施建议
1. 第一阶段：落地 `packages/telemetry-sdk`、入口上下文透传、`model-gateway` 的 `llm.call` Span 与结构化日志
2. 第二阶段：接入检索、工具、工作流链路，补齐 `audit.persist`
3. 第三阶段：接入管理台查询、成本排行、异常告警、采样策略优化
4. 第四阶段：按需叠加 `Langfuse` 等 AI 专项分析能力

## 验收标准
- 任一模型调用都能追踪到 `trace_id`、`user_id`、`tenant_id`、`model`、`prompt_version`
- 任一失败请求都能在 Trace 中定位失败节点、错误码与回退路径
- 任一审计记录都能通过 `trace_id` 反查到对应链路摘要
- 普通日志中不出现未脱敏的完整 Prompt / Response
- `model-gateway` 输出稳定的 usage、cost 与 audit 元数据
- 管理台链路页具备最小查询与详情跳转能力

## 开放问题
- 审计完整载荷优先落 PostgreSQL 还是对象存储 + 索引表，需结合租户规模再定
- 是否在第二阶段引入 `Langfuse`，取决于 PromptOps 与评测能力排期
- 是否需要为审批、会话回放、数据回补定义统一事件模型，后续可在 ADR 中补充
