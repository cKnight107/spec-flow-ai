# 技术栈

## 推荐组合
- 前端：Next.js + React + TypeScript
- 后端：NestJS + TypeScript
- Agent / Workflow：LangGraph JS + LangChain JS
- 数据：PostgreSQL + Redis + Object Storage
- 检索：pgvector / Milvus + OpenSearch
- 异步任务：BullMQ，后续可演进至 Temporal
- 可观测：OpenTelemetry + Prometheus + Grafana + Loki

## 选型原则
- 前后端统一 TypeScript，降低对象模型与协议维护成本
- Agent 运行时复用成熟框架，治理能力由平台自研
- 配置优先，策略与模型路由尽量版本化管理
