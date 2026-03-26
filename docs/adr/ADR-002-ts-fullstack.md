# ADR-002：采用 TypeScript 全栈作为主研发语言

## 状态
Accepted

## 决策
前端应用、后端服务和共享协议优先统一使用 TypeScript。

## 原因
- 降低前后端对象模型与工具协议的维护成本
- 便于共享类型、Schema 与测试工具
- 更适合当前以 Web、Node.js 与 Agent JS 生态为主的技术路线

## 影响
- 少量高性能或特殊运行时能力可按需引入其他语言
- 团队需统一 lint、typecheck 与构建规范
