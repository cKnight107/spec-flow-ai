# model-gateway 约束

- 对外暴露统一模型调用协议。
- 厂商 SDK 适配逻辑应下沉到 `integrations/model-providers/*`。
- 路由、配额、审计与成本字段必须稳定。
