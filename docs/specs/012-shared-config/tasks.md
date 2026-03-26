# 012 Shared Config Tasks

## 阶段一：规格冻结
- [x] 明确 `packages/shared-config` 的职责边界、非目标和适用范围
- [x] 明确 `core / server / public / nest` 四层职责与依赖方向
- [x] 统一环境枚举、环境文件命名和加载顺序约定
- [x] 补充配置命名规范，约束环境变量前缀、大小写和分组方式
- [x] 输出最小使用示例，覆盖 Node、NestJS、Next.js 和测试场景

## 阶段二：包结构与 Core 层
- [x] 初始化 `packages/shared-config` 包结构与 `package.json`
- [x] 建立 `core/env.ts`，统一 `APP_ENV` 与 `NODE_ENV` 的映射逻辑
- [x] 建立字段定义助手，支持 `required / optional / default / alias / deprecated`
- [x] 建立基础 schema 分层：`base`、`server`、`public`
- [x] 导出稳定的 TypeScript 类型、环境类型与 schema 类型

## 阶段三：Server 层
- [x] 实现 `.env` 文件发现与分环境加载逻辑
- [x] 实现配置优先级矩阵：默认值、`.env`、环境文件、进程注入、测试覆盖
- [x] 实现 `loadConfig` 与只读配置导出接口
- [x] 实现配置来源元数据，支持定位值来自哪个层级
- [x] 实现脱敏输出与统一错误类型
- [x] 实现启动诊断摘要，输出已加载文件、来源冲突与废弃告警

## 阶段四：Public 层
- [x] 实现 `public` 字段白名单导出
- [x] 实现前端公共配置校验入口
- [x] 约束 Next.js 公共字段必须同时满足 `NEXT_PUBLIC_` 前缀和 `public` 声明
- [x] 禁止未声明字段透传到浏览器

## 阶段五：NestJS 适配
- [x] 设计 `createSharedConfigModule` 或等价工厂入口
- [x] 提供 `SHARED_CONFIG` token 或 `SharedConfigService`
- [x] 保持与 `@nestjs/config` 的模块化和 DI 方式兼容
- [x] 输出 NestJS 最小接入模板，避免业务服务再维护第二套 schema

## 阶段六：测试与迁移
- [x] 提供测试环境注入、覆盖和清理机制
- [x] 补充缺失值、非法值、冲突值、废弃值的测试用例
- [x] 补充来源追踪、脱敏输出、别名兼容的测试用例
- [x] 输出从散落 `process.env` 读取迁移到共享配置的迁移说明
- [x] 补充 `packages/shared-config/README.md` 与接入样例

## 完成定义
- [x] `apps/*` 不再直接散落读取前端公共环境变量
- [x] `services/*` 不再绕过共享 schema 直接读取 `process.env`
- [x] 共享配置包具备文档、类型、示例、单测和最小接入模板
