# 001 Model Gateway Implementation Path

## 目标
在不破坏既有 telemetry 基线的前提下，分阶段将 `services/model-gateway` 从“配置加载 + 埋点包装器”演进为可对外提供统一模型调用能力的基础服务。

## 当前现状
- 已具备共享配置加载能力。
- 已具备 `llm.call` 埋点包装器，可输出 `usage`、`cost`、`audit`、`trace` 元数据。
- 尚未接入真实 provider adapter。
- 尚未形成 HTTP / NestJS 入口。
- 尚未实现模型注册、路由、回退、配额、审计持久化等核心治理能力。

## 实施原则
- 先补规格与协议，再补运行时实现，避免实现先行导致接口反复变更。
- 业务侧只依赖 `model-gateway` 的统一协议，不直接依赖厂商 SDK。
- 厂商差异下沉到 `integrations/model-providers/*`，网关层只负责协议、路由与治理。
- 优先完成 chat 主链路，再扩展 embedding、reranker、函数调用与多模态能力。
- 先实现“可运行的最小闭环”，再补路由、配额、审计、权限等治理能力。

## 分阶段路径

### P0：基础可用版
目标：完成统一协议、真实调用链和基础 HTTP 入口，形成可对外调用的模型网关基础版。

1. 规格收口
- 细化 `spec.md` 中的统一协议、错误码、路由规则、审计字段、流式语义。
- 细化 `tasks.md` 为分阶段任务，明确当前已完成项与待实现项。

2. 协议层落地
- 在 `services/model-gateway/src/dto` 定义统一请求 / 响应 DTO。
- 第一版优先支持 `chat.completion` 非流式调用。
- 补齐 `messages`、`system`、`tools`、`stream`、`metadata`、`routeHints`、`quotaSubject` 等字段。
- 统一错误码与错误响应结构。

3. 模型注册与配置
- 扩展 `packages/shared-config` 中的 `model-gateway` schema。
- 从“单一 provider 配置”升级为“模型注册表 + provider 实例 + 路由基础配置”。
- 配置项至少覆盖模型名称、模型类型、服务地址、认证方式、最大 token、能力标签、场景标签、默认超时、价格表。

4. Provider 抽象
- 在 `services/model-gateway/src/providers` 定义 provider adapter 接口、provider registry 与调用约定。
- 在 `integrations/model-providers/openai` 落地第一个真实 adapter。
- 再补第二个 provider adapter，建议优先 `anthropic` 或 `azure-openai`，满足“至少两类模型提供方接入”的验收要求。

5. Application 主链路
- 在 `services/model-gateway/src/application` 编排统一调用流程。
- 主链路顺序为：请求解析 -> 模型解析 -> 路由选择 -> provider adapter 调用 -> telemetry 包装 -> 统一响应返回。
- 将当前 observability 包装器作为 application 内部能力复用，而不是继续充当最终对外入口。

6. HTTP 入口
- 在 `services/model-gateway/src/controllers` 补 `GET /v1/models` 与 `POST /v1/chat/completions`。
- 接入请求校验、错误映射、`traceparent` 透传和 `request_id` 生成。
- 先完成非流式调用闭环，再进入流式实现。

### P1：治理增强版
目标：补齐流式、路由降级、配额成本和审计持久化能力，使模型网关具备基础治理闭环。

7. 流式输出
- 为统一协议补充流式事件格式。
- 先采用 HTTP SSE 作为第一版流式输出方式。
- provider adapter 补增量 token / 文本输出能力。

8. 路由与降级
- 在 `services/model-gateway/src/policies` 实现路由策略、主备切换、超时控制、自动重试和基础熔断。
- 第一阶段先支持按模型别名与主备关系路由。
- 第二阶段扩展到按应用、租户、任务类型、成本优先级、时延优先级进行策略命中。

9. 配额与成本治理
- 先落 usage / cost 事件沉淀，再做调用前配额校验。
- 优先补应用级配额控制与用户级调用上限。
- 再补部门级成本分账与成本看板对接字段。

10. 审计持久化
- 在 `services/model-gateway/src/infrastructure` 定义审计仓储接口。
- 若 `audit-service` 尚未建项，先落本地存储实现或等价基础设施实现。
- 补 `trace_id`、`request_id`、`user_id`、`model` 等维度查询能力，为后续管理台接入提供后端基础。

### P2：治理与运维版
目标：补齐权限审批、管理台查询接口和完整测试体系，使其进入可持续演进阶段。

11. 权限与审批
- 仅允许平台管理员新增、下线模型。
- 应用管理员只能绑定有权限的模型。
- 高成本模型接入白名单或审批策略。

12. 管理台与运营接口
- 对接管理台的模型列表、路由配置、调用审计与链路查询接口。
- 补按 `trace_id`、`request_id`、`user_id`、`model` 的检索接口契约。

13. 测试与验证
- 将当前仅依赖 `tsc --noEmit` 的测试基线升级为单元测试、契约测试、provider mock 集成测试。
- 重点覆盖已注册模型调用、路由命中、流式输出、未注册模型报错、provider 超时回退、配额不足阻断、审计字段完整性。

## 建议目录落点
- `services/model-gateway/src/controllers`
- `services/model-gateway/src/application`
- `services/model-gateway/src/domain`
- `services/model-gateway/src/infrastructure`
- `services/model-gateway/src/providers`
- `services/model-gateway/src/policies`
- `services/model-gateway/src/dto`
- `integrations/model-providers/openai`
- `integrations/model-providers/anthropic`

## 里程碑验收建议
- P0 完成后：可通过 HTTP 调用至少两类 provider 的非流式 chat completion。
- P1 完成后：具备流式输出、主备切换、基础重试 / 熔断、配额阻断、审计落库能力。
- P2 完成后：具备权限审批、管理台查询接口和稳定自动化测试基线。
