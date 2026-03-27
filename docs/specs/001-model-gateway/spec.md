# 001 Model Gateway

## 目标
建设统一模型接入层，屏蔽不同模型供应商差异，并提供路由、配额、审计与成本统计能力。

## 范围
- 模型注册与配置
- 统一调用协议
- 路由策略与回退
- Token 与成本统计
- 调用审计字段规范

## P0 范围
- 仅支持 `chat.completion` 非流式调用
- 提供 `GET /v1/models` 与 `POST /v1/chat/completions`
- 至少接入两类 provider：`openai`、`anthropic`
- 统一输出 `usage / cost / audit / trace / route`
- 通过 `traceparent` 透传 `trace_id`，并统一生成 `request_id`

## 统一请求协议

### `POST /v1/chat/completions`

#### 请求体字段
- `model`：请求模型名，允许传模型 ID、模型别名或路由别名
- `messages`：消息数组，首版支持 `system / user / assistant / tool`
- `system`：可选系统提示，P0 会并入统一 prompt 审计文本
- `tools`：可选工具定义，首版只透传 schema，不在网关内执行
- `stream`：是否流式；P0 固定要求为 `false`
- `metadata`：透传业务元数据，预留 `promptSource / promptTemplateId / promptVersion`
- `routeHints`：可选路由提示，当前支持 `provider / providerInstance`
- `quotaSubject`：可选配额主体，当前用于补齐 `tenantId / appId / userId`
- `user`：业务侧最终用户标识，缺省时回退到请求头
- `temperature / maxTokens / topP / stop`：统一采样与生成参数

#### 请求头
- `traceparent`：若提供，则提取其中的 `trace_id`
- `x-request-id`：若未提供，由网关自动生成
- `x-tenant-id / x-app-id / x-user-id`：构建调用上下文
- `x-session-id / x-conversation-id / x-workflow-id / x-execution-id`：透传到审计与 trace

## 统一响应协议

### 成功响应
- `id`：统一 completion ID
- `object`：固定为 `chat.completion`
- `created`：Unix 秒级时间戳
- `model`：最终命中的已注册模型 ID
- `choices[0].message`：统一消息结构
- `usage`：`inputTokens / outputTokens / totalTokens`
- `cost`：当前返回 `estimatedUsd`
- `audit`：当前返回 `auditId / status`
- `trace`：返回 `traceId / requestId / spanId`
- `route`：返回 `provider / providerInstance / requestedModel / resolvedModel`

### 错误响应
统一格式：

```json
{
  "error": {
    "code": "MODEL_NOT_FOUND",
    "message": "未找到已注册模型: missing-model",
    "retryable": false,
    "requestId": "req_xxx",
    "traceId": "trace_xxx",
    "auditId": "aud_xxx"
  }
}
```

## 错误码
- `INVALID_REQUEST`：请求体结构非法或字段缺失，HTTP 400
- `INVALID_JSON_REQUEST`：请求体不是合法 JSON，HTTP 400
- `UNSUPPORTED_STREAM`：P0 收到 `stream=true`，HTTP 400
- `MODEL_NOT_FOUND`：未命中注册模型或路由规则，HTTP 404
- `NOT_FOUND`：未命中路由，HTTP 404
- `METHOD_NOT_ALLOWED`：HTTP 方法不支持，HTTP 405
- `PROVIDER_AUTH_MISSING`：provider 实例缺少凭据，HTTP 500
- `PROVIDER_NOT_SUPPORTED`：provider adapter 未注册，HTTP 500
- `PROVIDER_BAD_REQUEST`：上游 provider 拒绝请求，HTTP 400
- `PROVIDER_AUTH_FAILED`：上游 provider 鉴权失败，HTTP 502
- `PROVIDER_RATE_LIMITED`：上游 provider 限流，HTTP 429
- `PROVIDER_TIMEOUT`：上游 provider 超时，HTTP 504
- `PROVIDER_UPSTREAM_ERROR`：上游 provider 其他错误，HTTP 502
- `INTERNAL_ERROR`：网关内部错误，HTTP 500

## 路由规则
- 先按 `routes` 里 `requestedModel` 命中，再按 `appIds / tenantIds` 过滤
- 同时命中多条规则时按 `priority` 从高到低选择
- 若无显式路由规则，则按模型 ID 或 `aliases` 直接解析
- 若请求携带 `routeHints.provider / providerInstance`，则最终命中结果必须与提示一致

## 审计字段
- 基础身份维度：`tenantId / appId / userId / sessionId / conversationId`
- 链路维度：`traceId / requestId / auditId / workflowId / executionId`
- 模型维度：`provider / model / modelEndpoint`
- Prompt 维度：`promptSource / promptTemplateId / promptVersion / promptHash / promptPreview`
- 结果维度：`responseHash / responsePreview / finishReason / status / errorCode`
- 成本维度：`inputTokens / outputTokens / totalTokens / estimatedCost / latencyMs`

## 配置结构
- `MODEL_GATEWAY_PROVIDERS_JSON`：provider 实例注册表
- `MODEL_GATEWAY_MODELS_JSON`：模型注册表
- `MODEL_GATEWAY_ROUTES_JSON`：基础路由规则
- `OPENAI_API_KEY / ANTHROPIC_API_KEY`：默认凭据注入
- `MODEL_GATEWAY_TIMEOUT_MS`：默认超时

P0 推荐 provider 实例字段：
- `id / provider / baseUrl / apiKey 或 apiKeyEnv / authType / timeoutMs / headers`

P0 推荐模型字段：
- `id / providerModel / providerInstance / type / displayName / aliases / maxTokens / capabilities / scenarioTags / pricing / status`

## 不做项
- 模型训练与微调平台
- 厂商 SDK 直连开放给业务层

## 验收标准
- P0：支持至少两类模型提供方接入，并通过 HTTP 完成非流式 chat completion
- P0：输出稳定的 `usage / cost / audit / trace / route` 元数据
- P1：补齐流式输出
