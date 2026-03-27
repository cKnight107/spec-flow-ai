# 001 Model Gateway Test Cases

## P0 正常流
- `GET /v1/models` 可返回已注册且处于 `active` 的模型列表
- `POST /v1/chat/completions` 可通过路由别名命中 OpenAI provider 并返回统一响应
- `POST /v1/chat/completions` 可通过模型别名命中 Anthropic provider 并返回统一响应
- 响应必须包含 `usage / cost / audit / trace / route`

## P0 异常流
- 请求体非法时返回 `INVALID_REQUEST`
- 非法 JSON 请求体返回 `INVALID_JSON_REQUEST`
- `stream=true` 返回 `UNSUPPORTED_STREAM`
- 未注册模型返回 `MODEL_NOT_FOUND`
- provider 鉴权失败时返回 `PROVIDER_AUTH_FAILED`
- provider 超时返回 `PROVIDER_TIMEOUT`
- provider 触发限流返回 `PROVIDER_RATE_LIMITED`

## P0 审计流
- 每次成功调用均生成 `traceId / requestId / auditId`
- 成本字段可关联到租户、应用与用户
- 请求头中的 `traceparent` 可回填同一 `trace_id`

## P1 预留
- 流式调用可稳定输出增量内容
- 上游 provider 超时后可触发回退或熔断
- 配额不足时阻断调用
