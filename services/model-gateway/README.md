# model-gateway

统一承接模型注册、路由、调用、配额、降级、成本统计与审计埋点。

## 当前状态
当前已完成第一阶段观测接入：
- 已接入统一 telemetry SDK
- 已新增 `llm.call` 调用包装器
- 已能输出 usage / cost / audit 元数据
- 已能生成 `trace_id`、`request_id`、`audit_id`

当前尚未完成：
- 真实 provider adapter 接入
- NestJS controller / service 入口接入
- 审计持久化
- OTel exporter 与日志后端接入

## 当前可用能力

### 1. 模型调用包装器
入口文件：
- [src/observability/index.ts](spec-flow-ai/services/model-gateway/src/observability/index.ts)

核心实现：
- [src/observability/invoke-model-with-telemetry.ts](spec-flow-ai/services/model-gateway/src/observability/invoke-model-with-telemetry.ts)

当前包装器支持：
- 建立 `llm.call` Span
- 输出开始日志与完成日志
- 构建成功/失败两类审计记录
- 返回 `usage`、`cost`、`audit`、`trace`
- 失败时抛出 `InstrumentedModelInvocationError`

### 2. 输入输出协议
类型定义：
- [src/observability/types.ts](spec-flow-ai/services/model-gateway/src/observability/types.ts)

主要类型：
- `ModelInvocationRequest`
- `ModelProviderInvoker`
- `InstrumentedModelInvocationResult`
- `ModelPrompt`
- `ModelSettings`

## 当前使用示例

### 示例：包装一次模型调用
```ts
import { invokeModelWithTelemetry } from "@enterprise-ai-hub/model-gateway-service";

const result = await invokeModelWithTelemetry({
  request: {
    context: {
      tenantId: "tenant-a",
      appId: "sales-assistant",
      userId: "user-1",
      serviceName: "model-gateway",
      environment: "dev",
      workflowId: "wf-sales",
      executionId: "exec-1",
    },
    provider: "openai",
    model: "gpt-4.1",
    prompt: {
      text: "总结本轮销售沟通重点",
      source: "template",
      templateId: "sales-summary",
      version: "v1",
    },
    settings: {
      temperature: 0.2,
      maxTokens: 800,
    },
  },
  invoke: async () => {
    return {
      providerResponse: {
        id: "resp_001",
      },
      responseText: "本轮沟通主要涉及预算、交付周期和采购流程。",
      finishReason: "stop",
      usage: {
        inputTokens: 128,
        outputTokens: 42,
        totalTokens: 170,
      },
      cost: {
        estimatedUsd: 0.0134,
      },
      httpStatusCode: 200,
    };
  },
});

console.log(result.trace.traceId);
console.log(result.audit.record.auditId);
console.log(result.usage.totalTokens);
```

返回结果中当前包含：
- `providerResponse`
- `usage`
- `cost`
- `audit`
- `trace`

### 失败场景示例
```ts
import {
  InstrumentedModelInvocationError,
  invokeModelWithTelemetry,
} from "@enterprise-ai-hub/model-gateway-service";

try {
  await invokeModelWithTelemetry({
    request,
    invoke: async () => {
      const error = new Error("upstream timeout");
      Object.assign(error, {
        code: "UPSTREAM_TIMEOUT",
      });
      throw error;
    },
  });
} catch (error) {
  if (error instanceof InstrumentedModelInvocationError) {
    console.log(error.traceId);
    console.log(error.requestId);
    console.log(error.auditId);
  }
}
```

## 目录约定
- `src/controllers`：对外接口
- `src/application`：应用服务与用例编排
- `src/domain`：领域模型与规则
- `src/infrastructure`：存储、队列、外部依赖
- `src/providers`：模型提供方适配编排
- `src/policies`：路由、配额、熔断、治理策略
- `src/dto`：输入输出协议对象
- `src/observability`：观测包装器、埋点类型与调用封装
- `test`：单元与集成测试

## 后续规划
- 接入真实 provider adapter，使包装器进入真实调用链
- 在入口层统一建立请求上下文，接入 `traceparent`
- 接入真实 OTel Span 与 OTLP exporter
- 接入审计持久化与链路查询接口
- 将同样的埋点模式复用到 `retrieval-service`、`tool-gateway`、`workflow-service`

## 验证
相关测试：
- [src/observability/invoke-model-with-telemetry.test.ts](spec-flow-ai/services/model-gateway/src/observability/invoke-model-with-telemetry.test.ts)

本地命令：
```bash
pnpm --filter @enterprise-ai-hub/model-gateway-service typecheck
pnpm --filter @enterprise-ai-hub/model-gateway-service test
```
