# 012 Shared Config

本目录定义跨 `apps/`、`services/`、`integrations/` 复用的共享配置规约，作为后续 `packages/shared-config` 实现与接入的依据。

## 目录内容
- [spec.md](docs/specs/012-shared-config/spec.md)：共享配置的范围、边界、加载顺序、API 规划与验收标准
- [tasks.md](docs/specs/012-shared-config/tasks.md)：按阶段拆解的实现任务清单
- [examples.md](docs/specs/012-shared-config/examples.md)：Node、NestJS、Next.js 与测试场景的最小使用实例

## 当前状态
- 规格文档：已补齐
- 使用实例：已补齐
- 代码实现：已在 `packages/shared-config` 落地
- 当前实现模式：`config.yaml + config-<profile>.yaml + ${ENV_VAR}` 插值

## 实现说明
- 运行时使用分文件 YAML 配置：`config.yaml` 作为基础配置，`config-<profile>.yaml` 作为环境覆盖
- `.env` / `.env.local` 当前仅承担变量插值与本地敏感值注入，不再承担多环境主配置职责
- profile 可显式指定，也可默认由 Git 分支名推断
