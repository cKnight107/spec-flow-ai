# 013 Telemetry Tracing

本目录定义企业 AI 中台统一日志、链路追踪与 LLM 调用审计规约，作为后续 `packages/telemetry-sdk`、`services/model-gateway`、`services/audit-service` 以及管理台链路页面落地的依据。

## 目录内容
- [spec.md](docs/specs/013-telemetry-tracing/spec.md)：统一日志与链路追踪的目标、边界、字段规范、存储分层与验收标准
- [tasks.md](docs/specs/013-telemetry-tracing/tasks.md)：按阶段拆解的实现任务清单

## 当前状态
- 规格文档：已补齐
- 实现代码：待开始
- 推荐优先落地点：`packages/telemetry-sdk` 与 `services/model-gateway`
