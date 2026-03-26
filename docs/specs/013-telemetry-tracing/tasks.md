# 013 Telemetry Tracing Tasks

> 状态标记说明
> - `可立即实施`：当前仓库已有对应目录或代码骨架，可直接进入实现
> - `依赖新建项目/目录`：当前仓库尚无对应 package、service 或 app，需要先建项
> - `依赖后续业务代码`：目录可能存在，但缺少入口层、调用链或业务实现，需在对应模块成型后接入

- [x] `依赖新建项目/目录` 在 `packages/` 新增 `telemetry-sdk`，提供 Trace、日志上下文与脱敏 helper
- [x] `可立即实施` 定义统一上下文字段、Span 命名与 AI 埋点属性常量
- [ ] `依赖后续业务代码` 在入口层接入 `traceparent` 解析、`request_id` 生成与 `AsyncLocalStorage` 上下文透传
  当前说明：仓库尚未形成统一的服务端入口层实现，`services/model-gateway` 仍处于轻骨架状态，需待 NestJS 或等价入口落地后接入。
- [x] `可立即实施` 在 `services/model-gateway` 实现 `llm.call` Span、结构化日志与 usage / cost / audit 元数据输出
  当前说明：`services/model-gateway` 目录已存在，但业务代码尚未展开，适合作为第一批落地点。
- [x] `可立即实施` 定义 Prompt / Response 的脱敏、摘要、哈希与归档接口
- [ ] `依赖新建项目/目录` 设计审计存储模型，明确 `audit_id` 与 `trace_id` 的关联方式
  当前说明：规约中引用了 `services/audit-service`，但该服务当前尚未创建；落库方案可先设计，正式实现需待审计服务或等价存储模块建项。
- [ ] `依赖新建项目/目录` 为 `retrieval.search`、`tool.call`、`workflow.run` 补齐统一埋点
  当前说明：`services/retrieval-service`、`services/tool-gateway`、`services/workflow-service` 当前均未创建，仅能先定义埋点契约，待服务建项后实现。
- [ ] `可立即实施` 规划 Trace 采样、日志保留期、审计 TTL 与成本控制策略
- [ ] `依赖后续业务代码` 为管理台补充按 `trace_id`、`request_id`、`user_id`、`model` 查询的接口契约
  当前说明：`apps/admin-console` 已存在，但链路查询依赖后端查询服务或观测接口，当前仓库尚无对应可调用服务实现。
- [x] `依赖后续业务代码` 补充测试用例，覆盖字段完整性、上下文透传、脱敏与异常链路保留
  当前说明：需要随 `telemetry-sdk`、`model-gateway` 与后续服务实现同步补齐，当前适合先整理测试维度与验收样例。
