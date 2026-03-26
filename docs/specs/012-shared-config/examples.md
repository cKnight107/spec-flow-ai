# 012 Shared Config 使用实例

> 以下示例对应仓库中已落地的 `@enterprise-ai-hub/shared-config` 实现。

## 示例 1：定义共享 schema

```ts
// packages/shared-config/src/core/schema/model-gateway.ts
import {
  defineField,
  defineSchema,
  enumParser,
  mergeSchemas,
  numberParser,
  stringParser,
} from "../fields.js";
import { baseSchema } from "./base.js";

const modelGatewayOnlySchema = defineSchema({
  PORT: defineField({
    parser: numberParser({ integer: true, min: 1, max: 65535 }),
    scope: "server",
    required: false,
    defaultValue: 3001,
    description: "模型网关监听端口",
  }),
  MODEL_GATEWAY_PROVIDER: defineField({
    parser: enumParser(["openai", "azure-openai", "anthropic"]),
    scope: "server",
    description: "上游模型提供方",
  }),
  OPENAI_API_KEY: defineField({
    parser: stringParser(),
    scope: "server",
    secret: true,
    description: "调用上游模型供应商的凭据",
    aliases: ["MODEL_GATEWAY_OPENAI_API_KEY"],
  }),
});

export const modelGatewaySchema = mergeSchemas(baseSchema, modelGatewayOnlySchema);
```

要点：
- 字段定义使用共享包内置解析器，不再散落手写校验逻辑
- `OPENAI_API_KEY` 只能是 `server` 字段，并标记 `secret: true`
- 旧变量名可通过 `aliases` 做兼容迁移

## 示例 2：Node 服务加载服务端配置

```ts
// services/model-gateway/src/config.ts
import {
  type InferSchemaOutput,
  formatLastConfigDiagnostics,
  loadConfig,
  modelGatewaySchema,
} from "@enterprise-ai-hub/shared-config/server";

export type ModelGatewayConfig = InferSchemaOutput<typeof modelGatewaySchema>;

let cachedConfig: Readonly<ModelGatewayConfig> | undefined;

export function getModelGatewayConfig(): Readonly<ModelGatewayConfig> {
  if (cachedConfig === undefined) {
    cachedConfig = loadConfig({
      schema: modelGatewaySchema,
      cwd: process.cwd(),
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

要点：
- 服务端通过 `schema` 显式选择本服务的配置定义
- `loadConfig` 返回冻结后的只读配置对象
- 诊断输出通过 `formatLastConfigDiagnostics()` 获取

## 示例 3：Nest 风格接入

```ts
// packages/shared-config/src/nest/shared-config.module.ts
import type { ConfigSchema, LoadConfigOptions } from "../core/types.js";
import { loadConfig } from "../server/load-config.js";
import { SharedConfigService } from "./shared-config.service.js";
import { SHARED_CONFIG } from "./tokens.js";

export function createSharedConfigModule<TSchema extends ConfigSchema>(
  options: LoadConfigOptions<TSchema>,
) {
  const config = loadConfig(options);

  return {
    module: SharedConfigModule,
    global: true,
    providers: [
      { provide: SHARED_CONFIG, useValue: config },
      { provide: SharedConfigService, useValue: new SharedConfigService(config) },
    ],
    exports: [SHARED_CONFIG, SharedConfigService],
  };
}
```

要点：
- 保持 `Module + provider + token` 的 Nest 风格接入形态
- 业务服务可通过 `SHARED_CONFIG` 或 `SharedConfigService` 消费只读配置
- 底层仍只保留一套共享 schema

## 示例 4：Next.js 读取公共配置

```ts
// apps/admin-console/lib/public-config.ts
import {
  adminConsoleSchema,
  readPublicConfig,
} from "@enterprise-ai-hub/shared-config/public";

export const publicConfig = readPublicConfig({
  schema: adminConsoleSchema,
  rawEnv: {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_CONSOLE_TITLE: process.env.NEXT_PUBLIC_CONSOLE_TITLE,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
});
```

```ts
// apps/admin-console/app/layout.tsx
import { publicConfig } from "../lib/public-config";

export const metadata = {
  title: publicConfig.NEXT_PUBLIC_CONSOLE_TITLE,
};
```

要点：
- 前端只消费 `public` 入口
- `readPublicConfig` 只会返回 `scope: "public"` 的字段
- 未声明字段不会透传到浏览器

## 示例 5：测试覆盖与恢复

```ts
// packages/shared-config/src/server/shared-config.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { loadConfigResult } from "./load-config.js";
import { modelGatewaySchema } from "../core/schema/model-gateway.js";

test("process.env 优先级高于 env-file，且支持 testOverrides", () => {
  const result = loadConfigResult({
    schema: modelGatewaySchema,
    appEnv: "test",
    envFiles: [],
    processEnv: {
      APP_ENV: "test",
      MODEL_GATEWAY_PROVIDER: "openai",
      OPENAI_API_KEY: "process-secret",
      MODEL_GATEWAY_TIMEOUT_MS: "15000",
    },
    testOverrides: {
      MODEL_GATEWAY_TIMEOUT_MS: "18000",
    },
  });

  assert.equal(result.config.MODEL_GATEWAY_TIMEOUT_MS, 18000);
});
```

测试覆盖：
- `process.env` 与 `testOverrides` 的优先级
- 别名字段回填与告警
- `public` 白名单筛选
- 诊断摘要来源输出

## 示例 6：`.env` 文件约定

`.env`

```dotenv
APP_ENV=development
LOG_LEVEL=info
OTEL_ENABLED=false
```

`.env.development.local`

```dotenv
MODEL_GATEWAY_PROVIDER=openai
OPENAI_API_KEY=sk-local-example
MODEL_GATEWAY_TIMEOUT_MS=15000
```

`.env.test`

```dotenv
APP_ENV=test
MODEL_GATEWAY_PROVIDER=openai
OPENAI_API_KEY=sk-test-example
```

建议：
- 开发机本地密钥放在 `*.local`
- `test` 环境默认不加载 `*.local`
- 生产环境敏感值优先由容器、CI 或云平台注入
