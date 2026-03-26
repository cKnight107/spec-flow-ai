# 数据模型

## 核心实体
- Tenant / Organization / User / Role
- Application / Channel / Release
- KnowledgeBase / Document / Chunk / Citation
- Conversation / Message / Memory
- Tool / ToolCredential / ToolCall
- Workflow / WorkflowRun / Task
- Model / ModelRoute / ModelUsage
- AuditEvent / ApprovalRequest / PolicyDecision

## 存储建议
- PostgreSQL：元数据、权限映射、审计索引
- Redis：缓存、会话态、任务协调
- Object Storage：原始文件、解析产物、导出物
- Vector DB：向量索引
- OpenSearch：关键词检索与过滤
