# telemetry-sdk

统一提供链路上下文、Span 抽象、结构化日志、Prompt/Response 脱敏与 LLM 审计 DTO，供 `services/`、`apps/`、`integrations/` 复用。

## 定位
当前实现是统一观测能力的第一阶段落地，目标是先固化平台内的协议、字段、上下文和调用方式，再在后续阶段接入真实的 `OpenTelemetry`、`Pino`、`Tempo`、`Loki` 等外部依赖与后端。

因此，这个包当前承担的是“统一抽象层”和“可直接复用的最小实现”，而不是最终的生产观测基础设施。

## 当前能力

### 1. 上下文管理
- 基于 `AsyncLocalStorage` 保存当前请求上下文
- 自动生成 `trace_id`、`span_id`、`request_id`
- 支持补充 `tenant_id`、`app_id`、`user_id`、`workflow_id`、`execution_id`、`audit_id`
- 支持创建子上下文和在当前调用链内打补丁更新上下文

对应代码：
- [context.ts](spec-flow-ai/packages/telemetry-sdk/src/context.ts)

### 2. Span 抽象与链路埋点
- 提供 `withSpan` 创建链路节点
- 支持 `attributes`、`events`、错误状态与父子 Span 关系
- 提供 `registerSpanSink`，可把完成后的 Span 送到后续 exporter、日志桥接器或测试收集器
- Span sink 失败时不会中断主业务请求

对应代码：
- [tracing.ts](spec-flow-ai/packages/telemetry-sdk/src/tracing.ts)
- [constants.ts](spec-flow-ai/packages/telemetry-sdk/src/constants.ts)

### 3. 结构化日志
- 提供 JSON logger
- 自动注入当前上下文字段
- 支持 `debug`、`info`、`warn`、`error`
- 支持 `child()` 方式绑定额外字段

对应代码：
- [logger.ts](spec-flow-ai/packages/telemetry-sdk/src/logger.ts)

### 4. Prompt / Response 脱敏
- 提供基础敏感信息脱敏能力
- 当前默认处理邮箱、手机号、Bearer Token、OpenAI Key、Cookie Header
- 支持生成脱敏文本、预览文本、哈希值和原始长度

对应代码：
- [redaction.ts](spec-flow-ai/packages/telemetry-sdk/src/redaction.ts)

### 5. LLM 审计 DTO 构建
- 生成 `audit_id`
- 统一构建 LLM 调用记录
- 拆分“查询摘要记录”和“归档正文载荷”
- 输出 prompt/response 的 preview、hash、usage、cost、latency、status

对应代码：
- [audit.ts](spec-flow-ai/packages/telemetry-sdk/src/audit.ts)
- [types.ts](spec-flow-ai/packages/telemetry-sdk/src/types.ts)

### 6. 统一常量
- 固化 Span 名称
- 固化 AI 埋点属性 key
- 固化脱敏版本号

对应代码：
- [constants.ts](spec-flow-ai/packages/telemetry-sdk/src/constants.ts)

## 当前不包含的能力
- 未接入真实 `OpenTelemetry SDK`
- 未接入真实 `OTLP exporter`
- 未接入 `Pino`
- 未直接写入 `Tempo`、`Loki`、`Prometheus`
- 未实现 `traceparent` 的 HTTP/NestJS 自动解析
- 未实现审计记录持久化
- 未接入 provider SDK 自动 instrumentation

这些能力会在后续阶段演进，而不是在当前包中一次性引入。

## 导出能力
- `createTelemetryContext`
- `runWithTelemetryContext`
- `withTelemetryContext`
- `createChildTelemetryContext`
- `patchTelemetryContext`
- `withSpan`
- `registerSpanSink`
- `createJsonLogger`
- `redactText`
- `createLlmAuditRecord`
- `TELEMETRY_SPAN_NAMES`
- `TELEMETRY_ATTRIBUTE_KEYS`

完整导出入口见：
- [index.ts](spec-flow-ai/packages/telemetry-sdk/src/index.ts)

## 当前使用方式

### 示例 1：建立请求上下文并记录日志
```ts
import {
  createJsonLogger,
  createTelemetryContext,
  runWithTelemetryContext,
} from "@enterprise-ai-hub/telemetry-sdk";

const logger = createJsonLogger({ name: "app-service" });

const context = createTelemetryContext({
  tenantId: "tenant-a",
  appId: "sales-assistant",
  userId: "user-1",
  serviceName: "app-service",
  environment: "dev",
});

runWithTelemetryContext(context, () => {
  logger.info("request.accepted", {
    route: "/api/chat",
  });
});
```

效果：
- 自动生成 `trace_id`、`span_id`、`request_id`
- 输出 JSON 日志
- 自动注入当前上下文字段

### 示例 2：在业务调用中创建 Span
```ts
import {
  TELEMETRY_SPAN_NAMES,
  withSpan,
} from "@enterprise-ai-hub/telemetry-sdk";

await withSpan(
  {
    name: TELEMETRY_SPAN_NAMES.RETRIEVAL_SEARCH,
    attributes: {
      "search.query.type": "semantic",
      "knowledge.base.id": "kb_sales",
    },
  },
  async (span) => {
    span.addEvent("retrieval.started");

    // 执行业务逻辑
    const docs = await searchDocuments();

    span.setAttribute("retrieval.hit_count", docs.length);
    span.addEvent("retrieval.completed");

    return docs;
  },
);
```

### 示例 3：对 Prompt 做脱敏与摘要
```ts
import { redactText } from "@enterprise-ai-hub/telemetry-sdk";

const result = redactText("用户邮箱 test@example.com，手机号 13800138000");

console.log(result.preview);
console.log(result.hash);
```

返回内容包含：
- `redactedText`
- `preview`
- `hash`
- `originalLength`
- `redacted`

### 示例 4：注册 Span sink 供测试或导出桥接使用
```ts
import { registerSpanSink, withSpan } from "@enterprise-ai-hub/telemetry-sdk";

const spans: string[] = [];

const unregister = registerSpanSink((record) => {
  spans.push(`${record.name}:${record.status}`);
});

await withSpan({ name: "llm.call" }, async () => {
  // 调用业务逻辑
});

unregister();
```

这类 sink 后续可替换成：
- OTel bridge
- 文件导出
- 队列投递
- 调试打印

## 与 model-gateway 的当前配合方式
`services/model-gateway` 已经使用本包实现了 `llm.call` 的第一版包装器，见：
- [invoke-model-with-telemetry.ts](spec-flow-ai/services/model-gateway/src/observability/invoke-model-with-telemetry.ts)

该包装器当前会：
- 建立 `llm.call` Span
- 记录开始/结束日志
- 构建 LLM 审计记录
- 在失败时抛出带 `traceId/requestId/auditId` 的错误

## 推荐接入顺序
1. 先在服务入口层建立上下文
2. 在应用服务和关键能力调用处使用 `withSpan`
3. 所有日志统一改为 `createJsonLogger()` 产出的 logger
4. Prompt / Response 进入日志前统一走 `redactText`
5. LLM 调用统一走审计构建或包装器

## 后续规划

### 第二阶段
- 接入 `@opentelemetry/api` 与 `@opentelemetry/sdk-node`
- 将 `withSpan` 映射到真实 OTel Span
- 接入 `OTLP Trace Exporter`
- 接入 `pino` 并替换当前最小 JSON logger 实现

### 第三阶段
- 在入口层实现 `traceparent` 解析与透传
- 增加 HTTP / Queue / Workflow 场景的接入 helper
- 增加采样、过滤、字段裁剪策略

### 第四阶段
- 对接 `Tempo` / `Loki`
- 建立审计落库与查询接口
- 接入管理台链路检索和详情展示

### 第五阶段
- 按需接入 `Langfuse` 等 AI 专项观测平台
- 对接 PromptOps、评测、会话回放等能力

## 验证
当前已覆盖的最小测试：
- [context.test.ts](spec-flow-ai/packages/telemetry-sdk/src/context.test.ts)
- [redaction.test.ts](spec-flow-ai/packages/telemetry-sdk/src/redaction.test.ts)
- [tracing.test.ts](spec-flow-ai/packages/telemetry-sdk/src/tracing.test.ts)

本地命令：
```bash
pnpm --filter @enterprise-ai-hub/telemetry-sdk typecheck
pnpm --filter @enterprise-ai-hub/telemetry-sdk test
```
