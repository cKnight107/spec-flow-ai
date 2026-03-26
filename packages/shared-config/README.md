# shared-config

共享配置包，统一承接：
- `config.yaml` 公共基线配置
- `config-<profile>.yaml` / `config-<profile>.yml` 环境覆盖配置
- `.env` / `.env.local` 变量注入
- `${ENV_VAR}` 变量插值
- 服务端 / 前端 / Nest 风格统一接入

## 当前设计

当前实现采用“分文件配置”而不是“单文件 profiles”：

1. `config.yaml` 放公共默认配置
2. `config-<profile>.yaml` 放某个环境或场景的覆盖配置
3. `.env` / `.env.local` / `process.env` 提供密钥、端口、地址等运行时变量
4. YAML 中通过 `${PORT}`、`${OPENAI_API_KEY}` 取值
5. profile 可显式指定，也可默认使用 Git 分支名

这套模型更适合：
- 团队多人协作
- 配置评审和回滚
- 避免所有环境堆在一个文件里

## 导出入口
- `@enterprise-ai-hub/shared-config/core`
- `@enterprise-ai-hub/shared-config/server`
- `@enterprise-ai-hub/shared-config/public`
- `@enterprise-ai-hub/shared-config/nest`

## 当前内置 schema
- `baseSchema`
- `adminConsoleSchema`
- `modelGatewaySchema`

## 先看结论

接入时记住四条：

1. 公共配置写 `config.yaml`
2. 环境差异写 `config-<profile>.yaml`
3. secrets 不写死在 YAML，改用 `${ENV_VAR}`
4. Node 服务用 `server`，浏览器可见配置优先用 `loadPublicConfig`

禁止事项：
- 不要继续在 `services/*` 里直接读取 `process.env`
- 不要把服务端完整配置对象传给前端
- 不要在业务目录复制一份新的 schema
- 不要把密钥明文写死在 `config-*.yaml`

## 推荐文件结构

以某个服务目录为例：

```text
services/model-gateway/
├─ config.yaml
├─ config-development.yaml
├─ config-test.yaml
├─ config-production.yaml
├─ .env
└─ .env.local
```

含义：
- `config.yaml`：所有环境都共享的基础配置
- `config-development.yaml`：开发环境覆盖
- `config-test.yaml`：测试环境覆盖
- `config-production.yaml`：生产环境覆盖
- `.env`：变量默认值
- `.env.local`：本地私有变量覆盖

## 配置加载顺序

当前 `server/load-config.ts` 的加载顺序是：

1. `config.yaml` 或 `config.yml`
2. `config-<profile>.yaml` 或 `config-<profile>.yml`
3. `.env`
4. `.env.local`
5. `process.env`
6. `testOverrides`

覆盖规则：
- 后加载覆盖先加载
- 所以 profile 文件会覆盖基础文件
- `process.env` 会覆盖 `.env`
- `testOverrides` 仅测试时使用，优先级最高

## profile 解析顺序

最终 profile 的优先级：

1. `loadConfig({ profile })`
2. `process.env.CONFIG_PROFILE`
3. 当前 Git 分支名
4. `default`

当前 Git 分支来源顺序：

1. `loadConfig({ branchName })`
2. `GIT_BRANCH`
3. `GITHUB_HEAD_REF`
4. `GITHUB_REF_NAME`
5. `CI_COMMIT_REF_NAME`
6. `BRANCH_NAME`
7. `git rev-parse --abbrev-ref HEAD`

说明：
- 如果 profile 是 `development / test / staging / production`，会自动推断 `APP_ENV`
- 如果 profile 是 `main` 这类名字，建议在对应文件里显式写 `APP_ENV`

## 配置文件示例

### `config.yaml`

```yaml
LOG_LEVEL: info
OTEL_ENABLED: false
NEXT_PUBLIC_CONSOLE_TITLE: Enterprise AI Admin Console
NEXT_PUBLIC_API_BASE_URL: /api
```

### `config-development.yaml`

```yaml
APP_ENV: development
MODEL_GATEWAY_PROVIDER: openai
OPENAI_API_KEY: ${OPENAI_API_KEY}
MODEL_GATEWAY_TIMEOUT_MS: ${MODEL_GATEWAY_TIMEOUT_MS}
```

### `config-production.yaml`

```yaml
APP_ENV: production
MODEL_GATEWAY_PROVIDER: azure-openai
OPENAI_API_KEY: ${OPENAI_API_KEY}
MODEL_GATEWAY_TIMEOUT_MS: ${MODEL_GATEWAY_TIMEOUT_MS}
```

### `.env`

```dotenv
MODEL_GATEWAY_TIMEOUT_MS=15000
```

### `.env.local`

```dotenv
OPENAI_API_KEY=sk-local-secret
```

## 变量插值规则

YAML 中可使用：

```yaml
PORT: ${PORT}
OPENAI_API_KEY: ${OPENAI_API_KEY}
NEXT_PUBLIC_API_BASE_URL: ${API_BASE_URL}
```

变量值来源优先级：

1. `.env`
2. `.env.local`
3. `process.env`
4. `testOverrides`

补充规则：
- 如果整个值就是 `${VAR}`，且变量不存在，该字段视为未提供
- 如果是 `"http://x/${VAR}"` 这种字符串模板，而变量不存在，会直接抛错

## 人员快速接入

### 1. 服务端接入

适用：
- `services/*`
- Node runtime 的 `integrations/*`

示例：

```ts
import {
  type InferSchemaOutput,
  loadConfig,
  formatLastConfigDiagnostics,
  modelGatewaySchema,
} from "@enterprise-ai-hub/shared-config/server";

export type ModelGatewayConfig = InferSchemaOutput<typeof modelGatewaySchema>;

let cachedConfig: Readonly<ModelGatewayConfig> | undefined;

export function getModelGatewayConfig(): Readonly<ModelGatewayConfig> {
  if (cachedConfig === undefined) {
    cachedConfig = loadConfig({
      schema: modelGatewaySchema,
      cwd: process.cwd(),
      profile: "development",
    });
  }

  return cachedConfig;
}

export function describeModelGatewayConfig(): string {
  if (cachedConfig === undefined) {
    getModelGatewayConfig();
  }

  return formatLastConfigDiagnostics();
}
```

说明：
- `cwd` 决定配置文件查找目录
- `profile` 决定叠加哪个 `config-<profile>.yaml`
- 不传 `profile` 时，会尝试用 `CONFIG_PROFILE` 或 Git 分支名

### 2. 前端接入

适用：
- `apps/*` 中需要暴露到浏览器的配置
- Next.js 服务端布局或入口模块

推荐方式：

```ts
import {
  adminConsoleSchema,
  loadPublicConfig,
} from "@enterprise-ai-hub/shared-config/public";

export const publicConfig = loadPublicConfig({
  schema: adminConsoleSchema,
  cwd: process.cwd(),
  profile: "development",
});
```

说明：
- `loadPublicConfig()` 会走同一套文件加载逻辑
- 最终只返回 `scope: "public"` 的字段
- 服务端字段不会暴露给前端

如果某些场景只能读取框架已注入变量，也可继续使用：

```ts
import {
  adminConsoleSchema,
  readPublicConfig,
} from "@enterprise-ai-hub/shared-config/public";

export const publicConfig = readPublicConfig({
  schema: adminConsoleSchema,
  rawEnv: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
});
```

### 3. Nest 风格接入

```ts
import { createSharedConfigModule } from "@enterprise-ai-hub/shared-config/nest";
import { modelGatewaySchema } from "@enterprise-ai-hub/shared-config/nest";

export const sharedConfigModule = createSharedConfigModule({
  schema: modelGatewaySchema,
  cwd: process.cwd(),
  profile: "production",
});
```

## AI 快速接入

如果是 AI 或 agent 接入共享配置，按这个顺序：

1. 判断目标运行时
2. 修改 `packages/shared-config/src/core/schema/*`
3. 创建或更新 `config.yaml`
4. 创建或更新 `config-<profile>.yaml`
5. 把敏感值改成 `${ENV_VAR}`
6. 替换散落的 env 读取
7. 跑 `typecheck` 和单测

AI checklist：
- 结构化默认配置进 `config.yaml`
- 环境差异进 `config-<profile>.yaml`
- 密钥和地址优先通过 `${ENV_VAR}` 注入
- 服务端字段使用 `scope: "server"`
- 浏览器字段使用 `scope: "public"`
- 密钥字段必须 `secret: true`
- 兼容旧变量名时使用 `aliases`

## 如何新增一个配置项

### 1. 给现有服务新增字段

在 `packages/shared-config/src/core/schema/model-gateway.ts` 中扩展：

```ts
import { defineField, numberParser } from "../fields.js";

const modelGatewayOnlySchema = defineSchema({
  MODEL_GATEWAY_RETRY_TIMES: defineField({
    parser: numberParser({ integer: true, min: 0, max: 5 }),
    scope: "server",
    required: false,
    defaultValue: 1,
    description: "模型请求重试次数",
  }),
});
```

然后补文件：

`config.yaml`
```yaml
MODEL_GATEWAY_RETRY_TIMES: 1
```

或按环境覆盖：

`config-production.yaml`
```yaml
MODEL_GATEWAY_RETRY_TIMES: 3
```

### 2. 给前端新增公共字段

在 `packages/shared-config/src/core/schema/admin-console.ts` 中扩展：

```ts
NEXT_PUBLIC_CONSOLE_DOCS_URL: defineField({
  parser: stringParser(),
  scope: "public",
  required: false,
  defaultValue: "/docs",
  description: "控制台文档入口",
}),
```

然后在文件里补：

`config.yaml`
```yaml
NEXT_PUBLIC_CONSOLE_DOCS_URL: /docs
```

## 如何新增一个服务 schema

如果新增 `services/retrieval-service`，推荐做法：

1. 新建 `packages/shared-config/src/core/schema/retrieval-service.ts`
2. 通过 `mergeSchemas(baseSchema, retrievalServiceOnlySchema)` 组合
3. 在对应入口导出
4. 在服务目录新增 `config.yaml` 和 `config-<profile>.yaml`

最小模板：

```ts
import {
  defineField,
  defineSchema,
  mergeSchemas,
  stringParser,
  urlParser,
} from "../fields.js";
import { baseSchema } from "./base.js";

const retrievalServiceOnlySchema = defineSchema({
  RETRIEVAL_SERVICE_REDIS_URL: defineField({
    parser: urlParser(),
    scope: "server",
    description: "检索服务 Redis 地址",
  }),
  RETRIEVAL_SERVICE_INDEX_NAME: defineField({
    parser: stringParser(),
    scope: "server",
    description: "检索索引名",
  }),
});

export const retrievalServiceSchema = mergeSchemas(
  baseSchema,
  retrievalServiceOnlySchema,
);
```

对应：

`config.yaml`
```yaml
RETRIEVAL_SERVICE_INDEX_NAME: retrieval-index
```

`config-development.yaml`
```yaml
RETRIEVAL_SERVICE_REDIS_URL: ${RETRIEVAL_SERVICE_REDIS_URL}
```

## 常用 API

### `server`
- `loadConfig`
- `loadConfigResult`
- `prepareConfigLoad`
- `getConfigSources`
- `getConfigWarnings`
- `formatLastConfigDiagnostics`
- `printConfigDiagnostics`
- `loadConfigForTest`
- `restoreProcessEnv`

示例：

```ts
const result = loadConfigResult({
  schema: modelGatewaySchema,
  cwd: process.cwd(),
  profile: "production",
});

console.log(result.profile);
console.log(result.appEnv);
console.log(result.loadedFiles);
console.log(result.sources);
console.log(result.warnings);
```

### `public`
- `loadPublicConfig`
- `readPublicConfig`
- `adminConsoleSchema`

### `nest`
- `createSharedConfigModule`
- `SHARED_CONFIG`
- `SharedConfigService`

## 内置字段说明

### `baseSchema`
- `CONFIG_PROFILE`
- `APP_ENV`
- `LOG_LEVEL`
- `OTEL_ENABLED`

### `adminConsoleSchema`
- 继承 `baseSchema`
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_CONSOLE_TITLE`
- `NEXT_PUBLIC_API_BASE_URL`

### `modelGatewaySchema`
- 继承 `baseSchema`
- `PORT`
- `MODEL_GATEWAY_PROVIDER`
- `MODEL_GATEWAY_TIMEOUT_MS`
- `OPENAI_API_KEY`

## 测试示例

包内已有单测覆盖：
- `config.yaml + config-<profile>.yaml` 叠加
- Git 分支名到 `config-<branch>.yaml` 的选择
- 别名字段兼容告警
- `loadPublicConfig()` 读取公共字段
- 诊断输出中的 `profile` 和 `config-file` 来源

本地运行：

```bash
pnpm --filter @enterprise-ai-hub/shared-config typecheck
pnpm --filter @enterprise-ai-hub/shared-config test
```

## 故障排查

### 启动时报缺少配置
- 先确认字段是否在 schema 中声明
- 再确认 `config.yaml` 或 `config-<profile>.yaml` 是否提供了该字段
- 再确认 `${VAR}` 引用的变量是否来自 `.env`、`.env.local` 或 `process.env`

### profile 不符合预期
- 先看是否显式传了 `profile`
- 再看 `CONFIG_PROFILE`
- 再看当前 Git 分支名
- 再确认是否存在对应的 `config-<profile>.yaml`

### 前端读不到变量
- 确认字段是否为 `scope: "public"`
- 确认是否写在 `config.yaml` 或 `config-<profile>.yaml`
- 若走 `readPublicConfig()`，确认字段是否加入了 `rawEnv`

### 服务端配置来源不明确
- 使用 `loadConfigResult()` 查看 `loadedFiles`、`sources`、`warnings`
- 或调用 `formatLastConfigDiagnostics()` 输出摘要

## 相关文件
- `src/core/schema/base.ts`
- `src/core/schema/admin-console.ts`
- `src/core/schema/model-gateway.ts`
- `src/server/load-config.ts`
- `src/public/read-public-config.ts`
- `src/nest/shared-config.module.ts`
- `src/server/shared-config.test.ts`
