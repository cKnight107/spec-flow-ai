# 011 Admin Console 页面契约

## 1. 约定
- 所有页面仅读写 `services/*` 的公开 API，不直接访问底层数据库、对象存储或消息系统。
- 列表查询统一支持 `page`、`pageSize`、`sortBy`、`sortOrder` 扩展位，即便当前 mock 未全部使用。
- 所有写操作默认返回 `operationId`，若命中高风险策略则返回 `approvalRequired: true`。
- 链路类、任务类、审批类接口允许返回 `traceId`、`requestId`、`approvalId` 作为跳转标识。

## 2. 页面清单
| 页面 | 路由 | 读取边界 | 核心查询 | 写入动作 | 风险等级 |
| --- | --- | --- | --- | --- | --- |
| 仪表盘 | `/admin/dashboard` | `GET /services/observability/overview` | `range` `tenantId` | 无 | 低 |
| 应用中心 | `/admin/apps` | `GET /services/app-service/apps` | `keyword` `ownerId` `status` `channel` | 下线、归档 | 中 |
| 应用详情 | `/admin/apps/:appId` | `GET /services/app-service/apps/:appId` | `appId` `tab` | 保存、发布、回滚 | 高 |
| 模型路由 | `/admin/models/:modelId/routing` | `GET /services/model-gateway/models/:modelId` | `modelId` | 修改主备、灰度、降级 | 高 |
| 知识导入 | `/admin/knowledge/:knowledgeBaseId/pipelines` | `GET /services/retrieval-service/knowledge-bases/:knowledgeBaseId` | `knowledgeBaseId` `status` | 重试导入、修改权限映射 | 高 |
| 工具中心 | `/admin/tools` | `GET /services/tool-gateway/tools` | `keyword` `protocol` `riskLevel` | 修改鉴权、启停工具 | 高 |
| 工作流 | `/admin/workflows` | `GET /services/workflow-service/workflows` | `keyword` `status` | 发布版本、重试运行 | 高 |
| PromptOps | `/admin/promptops/playground` | `GET /services/app-service/prompts` | `promptId` `version` | 保存 Prompt、发布版本 | 中 |
| 审计与审批 | `/admin/governance/approvals` | `GET /services/approval-service/approvals` | `status` `resourceType` `timeRange` | 审批通过、驳回 | 高 |
| 观测与成本 | `/admin/observability/traces` | `GET /services/observability-service/traces` | `traceId` `appId` `timeRange` | 无 | 低 |
| 权限治理 | `/admin/access/roles` | `GET /services/policy-service/roles` | `keyword` `status` | 修改角色策略 | 高 |

## 3. 通用读取结构
```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 0,
  "filters": {
    "keyword": "",
    "status": []
  },
  "meta": {
    "requestId": "req_xxx",
    "traceId": "trc_xxx"
  }
}
```

## 4. 通用写入结构
```json
{
  "operationId": "op_xxx",
  "status": "accepted",
  "approvalRequired": true,
  "approvalId": "ap_xxx",
  "traceId": "trc_xxx",
  "message": "变更已提交，等待审批"
}
```

## 5. 页面重点字段
### 5.1 应用中心
- 列表字段：`appId` `name` `ownerName` `channels[]` `status` `boundModels[]` `boundKnowledgeBases[]` `riskLevel`
- 发布页字段：`currentVersion` `draftVersion` `changeSummary[]` `approvalRequired`

### 5.2 模型中心
- 路由字段：`primaryModel` `fallbackModel` `rolloutPercentage` `downgradeTarget`
- 配额字段：`quotaMonthly` `quotaDaily` `qpsLimit` `alertThreshold`

### 5.3 知识中心
- 导入任务字段：`jobId` `stage` `progress` `retryable` `failedReason`
- 权限映射字段：`orgUnitId` `inheritMode` `visibilityScope`

### 5.4 工具中心
- 工具字段：`toolId` `protocol` `provider` `riskLevel` `authType`
- 执行字段：`executionId` `status` `latencyMs` `traceId` `approvalState`

### 5.5 审计与审批
- 审批字段：`approvalId` `resourceType` `resourceId` `initiator` `approver` `approvalStatus`
- 审计字段：`auditId` `action` `result` `operatorId` `occurredAt`

## 6. 前端对接要求
- 页面级服务封装放在未来对应页面的 `services/` 目录，不直接在组件中请求数据。
- 组件只消费规整后的 ViewModel，不直接消费后端原始 DTO。
- 所有时间字段统一使用 ISO 8601 字符串，前端负责本地格式化。
- 风险动作按钮必须消费 `approvalRequired`，不得在前端自行猜测是否要审批。
