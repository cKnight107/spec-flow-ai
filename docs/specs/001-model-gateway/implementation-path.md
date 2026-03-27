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

当前状态：已完成
- 已补齐统一 DTO、错误码、成功/失败响应结构
- 已完成 `providers / models / routes` 配置结构扩展
- 已接入 `openai`、`anthropic` 两类 provider adapter
- 已落地 `GET /v1/models` 与 `POST /v1/chat/completions`
- 已打通 `request_id / traceparent / usage / cost / audit / trace / route` 闭环

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

12. 控制面配置后管化
- 将当前 `MODEL_GATEWAY_PROVIDERS_JSON`、`MODEL_GATEWAY_MODELS_JSON`、`MODEL_GATEWAY_ROUTES_JSON` 从“本地静态配置”演进为“控制面管理对象”。
- 后管至少管理三类核心对象：`provider instance`、`model registration`、`route rule`。
- `provider instance` 至少覆盖：名称、provider 类型、`baseUrl`、凭据引用、默认超时、默认 headers、状态。
- `model registration` 至少覆盖：逻辑模型 ID、真实 `providerModel`、绑定的 `providerInstance`、模型类型、别名、能力标签、场景标签、价格、状态。
- `route rule` 至少覆盖：`requestedModel`、`targetModel`、`tenantIds`、`appIds`、`priority`、启停状态、生效时间、备注。
- 要求记录配置创建人、修改人、修改时间、变更原因与版本号，为后续审计和回滚提供依据。

13. 运行时配置源演进
- 在 `services/model-gateway/src/infrastructure` 增加配置源抽象，区分“静态配置源”和“控制面配置源”。
- 首版建议采用“控制面数据库 / 配置中心 + 网关内存缓存”的读取模型，而不是每次请求直连控制面。
- 启动时加载一次 `providers / models / routes` 到内存注册表，并支持定时刷新或事件驱动刷新。
- 静态 YAML / JSON 配置继续保留为本地开发与 bootstrap fallback，不再作为长期唯一配置来源。
- 运行时要保证 provider、model、route 三类对象的一致性校验，例如：
  - provider 实例删除前需检查是否仍被模型引用
  - 模型下线前需检查是否仍被路由引用
  - 路由生效前需校验 `targetModel` 是否有效

14. 管理台与运营接口
- 对接管理台的供应商实例列表、模型注册列表、路由配置、调用审计与链路查询接口。
- 补 provider、新增模型、变更路由、上下线模型的后端接口契约。
- 补按 `trace_id`、`request_id`、`user_id`、`model` 的检索接口契约。
- 补配置预检接口，例如“某条路由调整后将命中哪些模型 / app / tenant”的模拟验证能力。

15. 测试与验证
- 将当前仅依赖 `tsc --noEmit` 的测试基线升级为单元测试、契约测试、provider mock 集成测试。
- 重点覆盖已注册模型调用、路由命中、流式输出、未注册模型报错、provider 超时回退、配额不足阻断、审计字段完整性。
- 控制面相关测试补充：
  - provider / model / route 的创建、修改、下线与删除约束
  - 配置变更后的注册表刷新
  - 配置版本回滚
  - 权限不足时禁止修改 provider / model / route

## 控制面演进建议
- 当前 P0 的 `providers / models / routes` 配置可视为“静态种子配置”，目标是先跑通最小闭环。
- 当模型选择逻辑逐步承载租户、应用、成本、主备、审批等治理能力后，`providers / models / routes` 将成为运行控制面的核心数据，不宜继续长期停留在本地 JSON / YAML。
- 推荐演进顺序为：
  1. 保留当前静态配置，作为开发环境和默认 bootstrap
  2. 设计控制面数据模型与管理接口
  3. 为 `model-gateway` 增加控制面配置源与本地缓存
  4. 让管理台逐步接管 provider、新增模型、路由关系和上下线管理
  5. 最终将静态配置降级为 fallback，而不是主要配置入口

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
- P2 完成后：具备权限审批、控制面配置管理、管理台查询接口和稳定自动化测试基线。
