# 命名规范

## 文件与目录
- 目录名统一使用 `kebab-case`，例如 `model-gateway`、`user-profile`。
- 普通代码文件统一使用 `kebab-case`，例如 `user-service.ts`、`use-chat-stream.ts`。
- 组件文件可使用 `PascalCase`，前提是团队在该目录内保持一致。

## 变量与函数
- 变量、函数、hooks、普通对象字段统一使用 `camelCase`。
- hooks 必须以 `use` 开头，例如 `useChatSession`。
- 生成 API 的函数统一使用 `fetch{Name}Api`。

## 类型与类
- 类型、接口、类、枚举统一使用 `PascalCase`。
- 泛型命名优先使用有语义的名称，例如 `TResponse`、`TParams`，避免全部写成单字母。

## 常量
- 普通常量使用 `camelCase`。
- 跨模块共享且语义固定的常量可使用 `SCREAMING_SNAKE_CASE`，例如环境变量名、事件主题名。

## 布尔命名
- 布尔值优先使用 `is`、`has`、`can`、`should` 前缀。
- 禁止使用含义不明的布尔命名，例如 `flag`、`status`、`ok`。
