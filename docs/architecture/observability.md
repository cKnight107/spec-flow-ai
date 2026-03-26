# 可观测设计

## 关键维度
- 请求量、成功率、平均响应时间
- Token 输入输出、模型成本、配额消耗
- 检索命中率、引用率、重排序耗时
- 工具调用成功率、审批等待时长
- 工作流执行成功率与恢复次数

## 标准埋点字段
- `tenant_id`
- `app_id`
- `model_id`
- `prompt_version`
- `workflow_id`
- `tool_calls`
- `token_in` / `token_out`
- `latency_ms`
- `estimated_cost`

## 交付要求
- 每次请求可追踪完整链路
- 关键异常具备日志、trace 与告警联动
- 审计事件与业务 trace 通过关联 ID 串联
