# ADR-003：模型调用必须统一经过 Model Gateway

## 状态
Accepted

## 决策
应用、Agent 和工作流不得直接调用厂商 SDK，统一走 `model-gateway`。

## 原因
- 统一做模型路由、限流、熔断、降级与灰度
- 统一记录 Token、成本、审计与配额
- 避免业务层绑定具体模型供应商

## 影响
- 需要维护统一模型调用协议
- 厂商差异适配应下沉到 `integrations/model-providers/*`
