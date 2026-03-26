# 规则总览

本目录用于沉淀仓库级代码约束、架构边界和质量要求，避免实现偏离平台化设计。

## 文件概述
- [ts](./ts.md)
  - TypeScript 规范，包括类型安全、可选链、空值处理等要求
- [code-names](./code-names.md)
  - 命名规范，包括 kebab-case、camelCase、PascalCase 的使用约定
- [comment](./comment.md)
  - 注释规范，包括 JSDoc 与 `@ai-context`、`@ai-rules` 文件头说明
- [lint](./lint.md)
  - 基础代码风格规范，包括单引号、末尾换行、导入顺序等
- [style](./style.md)
  - 样式规范，包括 Tailwind CSS 与 less 文件使用约束
- [pages](./pages.md)
  - 页面目录结构规范，包括 constants、services、hooks、components 分层
- [service](./service.md)
  - API 接口生成规范，包括 `fetch{Name}Api` 命名与 `UniversalResp<T>` 约定
- [architecture-boundaries](./architecture-boundaries.md)
  - `apps / services / packages / integrations / configs` 的边界规则
- [testing-quality](./testing-quality.md)
  - 测试分层、覆盖重点与交付门槛
- [code-style](./code-style.md)
  - 仓库级通用编码约束补充

## 执行原则
- 新功能先补 `docs/specs/*`
- 关键设计变化先补 `docs/adr/*`
- 代码实现必须满足本目录规则，否则视为未完成交付
