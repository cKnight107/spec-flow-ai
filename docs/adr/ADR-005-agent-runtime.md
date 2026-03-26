# ADR-005：Agent / Workflow 运行时优先复用 LangGraph JS

## 状态
Accepted

## 决策
Agent Runtime 与 Workflow Service 以 LangGraph JS 为主执行引擎，平台治理能力保持自研。

## 原因
- 满足单 Agent、工具调用、状态追踪、checkpoint 与恢复需求
- 避免在执行引擎上重复造轮子
- 让中台团队聚焦模型、知识、权限、审计与运营治理

## 影响
- 需封装统一运行时接口，避免上层直接耦合框架细节
- 长任务与复杂编排后续可接入 Temporal 等能力
