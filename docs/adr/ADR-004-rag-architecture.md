# ADR-004：RAG 能力拆分为 Ingestion / Retrieval / Memory

## 状态
Accepted

## 决策
知识与记忆中心拆分为 `knowledge-ingestion-service`、`retrieval-service` 与 `memory-service`。

## 原因
- 文档接入、索引构建与在线检索生命周期不同
- 权限继承、引用溯源与记忆管理需要独立治理
- 有利于分别扩展吞吐、缓存与数据模型

## 影响
- 需定义清晰的文档元数据、chunk、citation 与 memory 协议
- 服务间链路需要统一 trace 与审计字段
