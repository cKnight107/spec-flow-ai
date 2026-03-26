# 012 Shared Config

## 目标
建立统一的共享配置规约，收敛环境变量定义、配置加载、校验、类型导出与安全边界，避免各应用和服务各自维护一套不一致的配置逻辑。

## 适用范围
- `apps/*` 中需要消费公共配置的前端应用
- `services/*` 中基于 Node.js / NestJS 的服务端应用
- `integrations/*` 中需要统一读取环境变量的适配器
- `tests/*` 与各包内部测试中对配置的隔离、覆盖与验证

## 范围
- `env schema`：统一定义必填项、可选项、默认值、枚举值与转换规则
- 分环境配置加载：约定 `development / test / staging / production` 的加载入口与文件命名
- 配置优先级：明确进程环境、环境文件、代码默认值与测试覆盖值的合并顺序
- 默认值：仅允许对低风险配置提供默认值，敏感项和关键连接信息必须显式提供
- 配置类型导出：向业务侧暴露稳定、可复用的 TypeScript 类型与获取接口
- 前后端共享模型：共享同一份 schema 元信息，但按运行环境导出不同能力
- NestJS 适配：通过 NestJS 生态标准方式接入共享配置能力
- 启动期校验与失败策略：应用启动时 fail-fast，输出可定位但不泄露敏感值的错误信息
- 服务端 / 客户端边界：区分私有配置与可暴露配置，禁止将密钥类变量导出到前端
- 配置来源可观测性：支持查看某个配置来自默认值、环境文件还是运行时注入
- 测试场景支持：提供测试专用装载方式、隔离机制与 fixtures 约定
- 废弃与兼容策略：支持旧变量别名、废弃告警和迁移窗口说明
- 为接入方提供最小使用示例和迁移指引

## 非目标
- 不在本阶段建设远程配置中心或数据库配置下发能力
- 不在本阶段承接模型路由、权限规则等业务策略配置，这些继续落在 `configs/` 或治理服务
- 不要求支持运行时热更新，默认以进程启动快照为准
- 不替代各框架原生的构建期注入能力，仅负责校验、收口与类型统一

## 输入依据
- [docs/rules/code-style.md](docs/rules/code-style.md)
- [docs/rules/architecture-boundaries.md](docs/rules/architecture-boundaries.md)
- [docs/architecture/tech-stack.md](docs/architecture/tech-stack.md)
- [docs/architecture/overview.md](docs/architecture/overview.md)

## 设计原则
- 单一事实来源：配置字段定义只在一处 schema 中维护
- 分端适配：共享的是 schema 与类型，不是同一份运行时入口
- 显式暴露：只有声明为 `public` 的字段才能进入前端
- 启动即校验：服务启动时必须完成解析与校验，缺失即失败
- 默认保守：敏感项、连接串、密钥、租户级鉴权信息不允许默认值
- 只读消费：业务侧拿到的是冻结后的只读配置对象
- 可追踪：每个字段都能回答“值来自哪里”
- 可迁移：允许旧变量短期兼容，但必须伴随告警和移除窗口

## 术语
- `envName`：共享配置内部环境名，限定为 `development | test | staging | production`
- `schema item`：单个配置项定义，包含类型、默认值、是否公开、是否敏感等元信息
- `server config`：仅 Node.js / NestJS 可读的最终配置对象
- `public config`：经白名单筛选后可暴露给浏览器的配置对象
- `source`：配置值的来源，取值为 `default | env-file | process-env | test-override | alias`

## 设计约束
- 共享实现落在 `packages/shared-config`
- 共享类型优先通过包导出，禁止在 `apps/`、`services/` 内复制配置类型
- 前端、Node 服务、NestJS 不直接共享同一套运行时入口，只共享同一份 schema 与类型定义
- NestJS 接入优先兼容 `@nestjs/config` 的模块化与依赖注入方式，不额外发明一套平行配置框架
- 配置规约必须符合 [docs/rules/code-style.md](docs/rules/code-style.md) 与 [docs/rules/architecture-boundaries.md](docs/rules/architecture-boundaries.md)
- 敏感字段在日志、报错、调试输出中必须脱敏
- `packages/shared-config` 只能包含可复用、无业务副作用的逻辑，不得耦合具体服务实现

## 推荐技术组合
- 基础 schema 与类型推导：`zod`
- Node 环境文件加载：`dotenv`
- NestJS 配置集成：`@nestjs/config`
- 前端环境变量加载：复用框架原生能力，当前以 Next.js 约定为准

## 包结构规划

```text
packages/shared-config/
├─ src/
│  ├─ core/
│  │  ├─ env.ts                 # 环境枚举与标准化逻辑
│  │  ├─ fields.ts              # schema item 定义助手
│  │  ├─ schema/
│  │  │  ├─ base.ts             # 跨端通用字段
│  │  │  ├─ server.ts           # 仅服务端字段
│  │  │  └─ public.ts           # 可公开字段映射
│  │  └─ types.ts               # 共享类型导出
│  ├─ server/
│  │  ├─ load-config.ts         # .env 加载  校验  只读导出
│  │  ├─ sources.ts             # 来源跟踪与冲突说明
│  │  ├─ diagnostics.ts         # 启动摘要与脱敏输出
│  │  └─ test-utils.ts          # 测试覆盖与清理助手
│  ├─ public/
│  │  ├─ read-public-config.ts  # 前端公共配置读取与校验
│  │  └─ index.ts
│  ├─ nest/
│  │  ├─ shared-config.module.ts
│  │  ├─ shared-config.service.ts
│  │  └─ tokens.ts
│  └─ index.ts
└─ README.md
```

## 分层设计

### 1. `core` 层
- 存放与运行时无关的 schema、字段元信息、类型推导和环境枚举
- 这一层是前后端共享的唯一事实来源
- 不直接读取 `process.env`，不依赖浏览器或 Node 专属 API

### 2. `server` 层
- 面向 Node.js 运行时
- 负责读取环境变量、加载 `.env` 文件、执行 schema 校验、输出只读配置对象
- 可暴露 `loadConfig`、`parseEnv`、`maskSecret`、`getConfigSources` 等能力

### 3. `public` 层
- 面向浏览器与前端构建产物
- 只导出显式声明为 `public` 的字段及其类型
- 不允许读取或推导 `secret` 字段
- 在 Next.js 中复用框架已有环境变量注入机制，仅承担校验与类型整理职责

### 4. `nest` 层
- 面向未来 `services/*` 中的 NestJS 服务
- 基于 `@nestjs/config` 提供适配器、provider 或 helper
- 负责将 `server` 层解析结果接入 NestJS 的 `ConfigModule`、`ConfigService` 与 DI 生命周期
- 允许业务服务继续使用 NestJS 习惯的配置消费方式，但底层 schema 与校验保持统一

## 命名与分组规约

### 环境名
- 共享配置内部只接受 `development`、`test`、`staging`、`production`
- 优先读取 `APP_ENV`
- 当 `APP_ENV` 未提供时，允许从 `NODE_ENV` 映射：
  - `development -> development`
  - `test -> test`
  - `production -> production`
  - 其他值一律视为非法

### 环境变量命名
- 统一使用全大写蛇形命名，例如 `APP_ENV`、`DATABASE_URL`
- 一个变量只表达一个含义，禁止复合语义
- 共享基础字段可使用平台保留名：
  - `APP_ENV`
  - `PORT`
  - `LOG_LEVEL`
  - `OTEL_ENABLED`
- 应用或服务私有字段必须带所属域前缀，避免冲突：
  - `ADMIN_CONSOLE_API_BASE_URL`
  - `MODEL_GATEWAY_TIMEOUT_MS`
  - `RETRIEVAL_SERVICE_REDIS_URL`
- Next.js 暴露到浏览器的字段必须保留 `NEXT_PUBLIC_` 前缀，同时在 schema 中显式声明 `public`

### 值编码规则
- 布尔值统一使用 `true | false`
- 数组默认使用英文逗号分隔，解析前需要 `trim`
- URL 类型必须是完整协议地址
- 枚举值大小写固定，不允许隐式容错

## 配置字段元模型

每个字段至少包含以下元信息：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `key` | 是 | 环境变量名 |
| `type` | 是 | `string | number | boolean | enum | url | array` |
| `scope` | 是 | `server | public` |
| `required` | 是 | 是否必填 |
| `defaultValue` | 否 | 仅低风险字段允许提供 |
| `secret` | 否 | 是否需要脱敏，仅 `server` 可用 |
| `description` | 是 | 字段用途说明 |
| `example` | 否 | 文档示例值 |
| `aliases` | 否 | 兼容旧变量名列表 |
| `deprecated` | 否 | 废弃说明与移除时间窗口 |

约束：
- 同一字段不得同时为 `public` 与 `secret`
- 标记 `secret: true` 的字段必须 `scope: server`
- `defaultValue` 不得用于以下类型字段：
  - 数据库连接串
  - API Key / Token / Secret
  - 第三方凭据
  - 租户级权限控制字段

## 分环境文件与加载顺序

### 文件命名
- `.env`
- `.env.local`
- `.env.development`
- `.env.development.local`
- `.env.test`
- `.env.staging`
- `.env.staging.local`
- `.env.production`

### 生效规则

| 环境 | 默认读取文件 | 说明 |
| --- | --- | --- |
| `development` | `.env` -> `.env.development` -> `.env.local` -> `.env.development.local` | 本地开发允许 local 覆盖 |
| `test` | `.env` -> `.env.test` | 为保证可重复性，默认忽略所有 `*.local` |
| `staging` | `.env` -> `.env.staging` -> `.env.staging.local` | 允许预发环境保留局部覆盖 |
| `production` | `.env` -> `.env.production` | 生产以运行时注入为主，默认忽略 `*.local` |

### 最终优先级

从低到高：

1. schema 中的 `defaultValue`
2. `.env`
3. `.env.{envName}`
4. `.env.local` 或 `.env.{envName}.local`
5. `process.env`
6. `testOverrides` 或显式测试注入

补充规则：
- 若来源相同但字段重复，以后加载者覆盖先加载者，并记录来源轨迹
- 若运行时进程注入覆盖了环境文件，应在诊断输出中标记 `process-env > env-file`
- `testOverrides` 只允许在测试助手中使用，禁止业务代码显式传入生产入口

## Server API 规约

建议导出以下接口：

```ts
type LoadConfigOptions = {
  schema?: ConfigSchema;
  appEnv?: "development" | "test" | "staging" | "production";
  cwd?: string;
  envFiles?: string[];
  processEnv?: NodeJS.ProcessEnv;
  testOverrides?: Record<string, string | undefined>;
};

type ConfigSource = {
  key: string;
  source: "default" | "env-file" | "process-env" | "test-override" | "alias";
  sourceName: string;
  masked: boolean;
};

declare function loadConfig(options?: LoadConfigOptions): Readonly<ServerConfig>;
declare function loadConfigResult(options?: LoadConfigOptions): LoadConfigResult<ServerConfig>;
declare function getConfigSources(): ReadonlyArray<ConfigSource>;
declare function printConfigDiagnostics(): void;
```

要求：
- `loadConfig` 必须幂等，同一进程重复调用时返回同一份冻结对象或显式刷新结果
- 最终配置对象必须 `Object.freeze`
- 诊断输出必须脱敏
- 字段缺失、转换失败、非法枚举值均应抛出统一错误类型

## Public API 规约

建议导出以下接口：

```ts
declare function readPublicConfig(options: {
  schema?: ConfigSchema;
  rawEnv: Record<string, string | undefined>;
}): Readonly<PublicConfig>;
```

要求：
- 只能消费 schema 中声明 `scope: "public"` 的字段
- 遇到未声明字段时默认忽略，不透传
- 若字段同时缺失且无默认值，构建或启动阶段应直接失败

## NestJS 接入规约

建议提供：

```ts
declare function createSharedConfigModule(options: LoadConfigOptions): DynamicModuleLike;
declare const SHARED_CONFIG: unique symbol;
```

接入要求：
- 底层仍调用 `server/loadConfig`
- `ConfigModule.forRoot()` 与共享配置只保留一套 schema 定义，不允许双份校验
- 业务 Provider 可以通过 `@Inject(SHARED_CONFIG)` 或包装后的 `SharedConfigService` 获取只读配置
- 禁止在 NestJS 业务代码中继续散落读取 `process.env`

## 错误处理与诊断输出

### 启动失败场景
- 缺失必填项
- 字段值类型转换失败
- 枚举值非法
- 字段同时声明 `public` 与 `secret`
- 使用了已移除的别名变量

### 错误输出约束
- 输出字段名、约束、来源、建议修复方式
- 不输出完整密钥、完整连接串和完整 Token
- 对敏感值使用掩码，如 `sk-***9d2a`

### 诊断摘要要求
- 输出当前 `appEnv`
- 输出已加载文件清单
- 输出来源冲突提示
- 输出废弃变量告警

## 测试规约
- 使用 `server/test-utils` 提供环境变量注入与恢复助手
- 测试结束后必须恢复原始 `process.env`
- 缺失值、非法值、别名兼容、来源覆盖、脱敏输出都需要最小单测覆盖
- 测试夹具放入 `tests/fixtures` 或包内 `__fixtures__`，不得混入生产配置目录

## 废弃与兼容策略
- 新旧变量映射必须在 schema 中显式声明 `aliases`
- 当旧变量生效时，仍按新字段名输出最终配置，同时记录 `source: alias`
- 废弃项至少包含：
  - 废弃开始版本
  - 最晚移除版本或日期
  - 替代字段名
- 跨两个稳定版本后仍未迁移的别名，可从 schema 中删除

## 安全边界
- 服务端不得向前端直接传递完整 `server config`
- 前端只允许读取 `public config`
- 日志、异常、启动摘要中必须统一调用脱敏逻辑
- CI、容器、云平台中的敏感变量优先通过进程环境注入，不依赖仓库内 `.env` 文件
- 禁止在 `apps/`、`services/` 中直接复制 schema 片段或二次封装冲突字段

## 包与消费边界
- `apps/*` 只消费 `public` 层，最多在服务端渲染场景消费明确允许的 `server` 入口
- `services/*` 统一消费 `server` 或 `nest` 入口
- `integrations/*` 若为 Node 运行时，统一消费 `server` 入口
- `configs/` 继续承载业务路由、模型策略、权限策略等可版本化业务配置

## 使用实例
- 最小使用示例见 [examples.md](docs/specs/012-shared-config/examples.md)
- 示例覆盖：
  - 共享 schema 定义
  - Node 服务接入
  - NestJS 接入
  - Next.js 公共配置接入
  - 单元测试覆盖方式

## 交付物
- [spec.md](docs/specs/012-shared-config/spec.md)
- [tasks.md](docs/specs/012-shared-config/tasks.md)
- [examples.md](docs/specs/012-shared-config/examples.md)
- `packages/shared-config` 的目录与 API 规划
- 配置命名、加载顺序、优先级与安全边界说明文档
- 面向 NestJS 的接入约定文档

## 验收标准
- 任一应用或服务接入后，都能通过统一入口完成配置加载与校验
- 缺失必填项时，启动失败且报错信息可直接定位字段和来源
- 前端只能访问明确声明为 `public` 的配置
- 默认值、环境文件、进程注入与测试覆盖的顺序文档化且有测试覆盖
- 共享类型由 `packages/shared-config` 或相关共享包统一导出，不再散落重复定义
- 敏感字段在日志、异常、诊断输出中不会明文泄露
- 废弃变量的兼容期、告警方式和迁移路径明确
- NestJS 服务可以通过标准模块方式接入共享配置，而不是单独维护第二套 schema
