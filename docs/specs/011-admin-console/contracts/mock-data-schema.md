# 011 Admin Console Mock 数据结构

## 1. 当前代码落点
- 路由与页面：`apps/admin-console/app/**/page.tsx`
- 数据样例：`apps/admin-console/lib/mocks.tsx`
- 页面消费：`apps/admin-console/app/**/page.tsx`
- 共享组件：`packages/admin-ui/src/*.tsx`

## 2. 数据分层
### 2.1 契约层
用于描述页面路由、未来服务边界、查询参数、风险动作和轮询要求。

```js
{
  route: "/admin/apps/:appId",
  resource: "app",
  query: ["appId", "tab"],
  riskAction: "发布 / 回滚",
  polling: "仅反馈页可选轮询",
  transport: "GET /services/app-service/apps/:appId"
}
```

### 2.2 视图数据层
用于直接驱动页面显示，要求字段贴近组件 ViewModel，而不是后端原始响应。

```js
{
  name: "销售作战助手",
  owner: "销售运营",
  bindings: "2 模型 / 1 工作流 / 3 工具",
  status: "审批中",
  statusTone: "warning"
}
```

### 2.3 时间线层
用于 `ToolExecutionTimeline` 与链路展示。

```js
{
  node: "工具调用",
  status: "审批挂起",
  tone: "warning",
  time: "2m 12s",
  desc: "高风险 CRM 写入动作，等待审批人确认"
}
```

## 3. 替换原则
- 接真实接口时，优先新增 `services/` 适配层，把 DTO 转成当前 mock ViewModel。
- 禁止页面直接消费服务返回的嵌套原始对象，避免页面代码和 API 强耦合。
- 保留 `statusTone`、`trend`、`riskLevel` 这类前端展示字段，必要时由适配层派生。

## 4. 第三阶段交付结论
- mock 数据已从第二阶段单文件原型拆分为 Next 应用内共享数据模块
- 页面契约、视图数据、时间线数据已具备后续替换真实服务的插槽
- 通用组件已与页面实现解耦，集中沉淀在 `packages/admin-ui`
