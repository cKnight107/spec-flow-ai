# 001 Model Gateway Tasks

> 状态标记说明
> - `已完成`：仓库已有实现或基础能力
> - `可立即实施`：当前目录与上下游条件已具备，可直接编码
> - `依赖后续业务代码`：需待入口层、治理服务或持久化模块成型后接入
> - `依赖新建项目/目录`：当前仓库尚无对应模块，需要先建项

- [x] `已完成` 接入共享配置加载与 telemetry SDK，输出基础 `usage / cost / audit / trace` 元数据
- [x] `已完成` 提供 `llm.call` 埋点包装器与最小调用类型定义

- [x] `已完成` 细化统一请求 / 响应 DTO，并明确错误码与错误响应结构
- [x] `已完成` 细化模型注册、provider 实例、价格表与路由配置结构
- [x] `已完成` 设计 provider adapter 接口、provider registry 与统一调用约定
- [x] `已完成` 在 `integrations/model-providers/openai` 落地第一个真实 provider adapter
- [x] `已完成` 在 `integrations/model-providers/anthropic` 落地第二个真实 provider adapter
- [x] `已完成` 在 `src/application` 落地 chat completion 非流式主链路
- [x] `已完成` 在入口层实现 `GET /v1/models` 与 `POST /v1/chat/completions`
- [x] `已完成` 在入口层接入 `traceparent` 解析、`request_id` 生成与上下文透传

- [ ] `可立即实施` 补充流式输出协议，并以 SSE 方式落地第一版流式能力
- [ ] `可立即实施` 在 `src/policies` 实现主备切换、超时控制、自动重试与基础熔断
- [ ] `可立即实施` 扩展按应用、租户、任务类型、成本优先级、时延优先级的路由能力
- [ ] `依赖后续业务代码` 补齐应用级配额控制、用户级调用上限与成本分账字段
- [ ] `依赖后续业务代码` 设计并接入审计持久化，实现按 `trace_id`、`request_id`、`user_id`、`model` 查询
- [ ] `依赖后续业务代码` 补齐管理台所需的模型、路由、审计查询接口契约
- [ ] `依赖后续业务代码` 接入模型上下线权限控制、高成本模型白名单与审批策略

- [x] `已完成` 输出基础测试用例与错误码清单
- [x] `已完成` 补单元测试、provider mock 集成测试，覆盖注册、路由、非流式链路与审计输出
