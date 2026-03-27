import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { readPublicConfig } from "../public/read-public-config";
import { loadPublicConfig } from "../public/load-public-config";
import { adminConsoleSchema } from "../core/schema/admin-console";
import { modelGatewaySchema } from "../core/schema/model-gateway";
import { defineConfigProperties, defineField, stringParser } from "../core/fields";
import { formatConfigDiagnostics } from "./diagnostics";
import { loadConfigResult } from "./load-config";

function createFixtureDirectory(files: Record<string, string>): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "shared-config-"));

  for (const [relativePath, content] of Object.entries(files)) {
    const targetPath = path.join(directory, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content, "utf8");
  }

  return directory;
}

test("基础配置文件和 profile 配置文件会按顺序叠加，并支持 testOverrides", () => {
  const cwd = createFixtureDirectory({
    "config.yaml": `
LOG_LEVEL: info
MODEL_GATEWAY_PROVIDER: anthropic
`,
    "config-test.yaml": `
APP_ENV: test
MODEL_GATEWAY_PROVIDER: openai
OPENAI_API_KEY: \${OPENAI_API_KEY}
MODEL_GATEWAY_TIMEOUT_MS: \${MODEL_GATEWAY_TIMEOUT_MS}
`,
    ".env": `
OPENAI_API_KEY=env-secret
MODEL_GATEWAY_TIMEOUT_MS=15000
`,
  });

  const result = loadConfigResult({
    schema: modelGatewaySchema,
    cwd,
    profile: "test",
    processEnv: {},
    testOverrides: {
      MODEL_GATEWAY_TIMEOUT_MS: "18000",
    },
  });

  assert.equal(result.profile, "test");
  assert.equal(result.config.APP_ENV, "test");
  assert.equal(result.config.MODEL_GATEWAY_PROVIDER, "openai");
  assert.equal(result.config.OPENAI_API_KEY, "env-secret");
  assert.equal(result.config.MODEL_GATEWAY_TIMEOUT_MS, 18000);
  assert.equal(
    result.sources.find((item) => item.key === "MODEL_GATEWAY_TIMEOUT_MS")?.source,
    "test-override",
  );
});

test("可根据 git 分支名直接选择 config-<branch>.yaml", () => {
  const cwd = createFixtureDirectory({
    "config.yaml": `
LOG_LEVEL: info
`,
    "config-main.yaml": `
APP_ENV: production
MODEL_GATEWAY_PROVIDER: azure-openai
OPENAI_API_KEY: \${OPENAI_API_KEY}
`,
    ".env": `
OPENAI_API_KEY=branch-secret
`,
  });

  const result = loadConfigResult({
    schema: modelGatewaySchema,
    cwd,
    branchName: "main",
    processEnv: {},
  });

  assert.equal(result.profile, "main");
  assert.equal(result.config.APP_ENV, "production");
  assert.equal(result.config.MODEL_GATEWAY_PROVIDER, "azure-openai");
});

test("支持通过别名字段回填并产生告警", () => {
  const cwd = createFixtureDirectory({
    "config.yaml": `
APP_ENV: test
MODEL_GATEWAY_PROVIDER: openai
MODEL_GATEWAY_OPENAI_API_KEY: \${LEGACY_OPENAI_API_KEY}
`,
    ".env": `
LEGACY_OPENAI_API_KEY=legacy-secret
`,
  });

  const result = loadConfigResult({
    schema: modelGatewaySchema,
    cwd,
    processEnv: {},
  });

  assert.equal(result.config.OPENAI_API_KEY, "legacy-secret");
  assert.match(result.warnings[0]?.message ?? "", /别名/);
});

test("public 可直接从基础配置文件和 profile 文件加载声明为 public 的字段", () => {
  const cwd = createFixtureDirectory({
    "config.yaml": `
NEXT_PUBLIC_CONSOLE_TITLE: Shared Console
`,
    "config-development.yaml": `
NEXT_PUBLIC_API_BASE_URL: \${API_BASE_URL}
`,
    ".env": `
API_BASE_URL=/gateway
`,
  });

  const result = loadPublicConfig({
    schema: adminConsoleSchema,
    cwd,
    profile: "development",
    processEnv: {},
  });

  assert.deepEqual(result, {
    WEB_TITLE: "AI中台",
    NEXT_PUBLIC_APP_ENV: "development",
    NEXT_PUBLIC_CONSOLE_TITLE: "Shared Console",
    NEXT_PUBLIC_API_BASE_URL: "/gateway",
  });
});

test("readPublicConfig 仍只返回声明为 public 的字段", () => {
  const result = readPublicConfig({
    schema: adminConsoleSchema,
    rawEnv: {
      NEXT_PUBLIC_CONSOLE_TITLE: "控制台",
      NEXT_PUBLIC_API_BASE_URL: "/gateway",
      APP_ENV: "production",
    },
  });

  assert.deepEqual(result, {
    WEB_TITLE: "AI中台",
    NEXT_PUBLIC_APP_ENV: "development",
    NEXT_PUBLIC_CONSOLE_TITLE: "控制台",
    NEXT_PUBLIC_API_BASE_URL: "/gateway",
  });
});

test("诊断摘要会输出 profile 和 config-file 来源", () => {
  const cwd = createFixtureDirectory({
    "config.yaml": `
APP_ENV: test
MODEL_GATEWAY_PROVIDER: openai
OPENAI_API_KEY: \${OPENAI_API_KEY}
`,
    ".env": `
OPENAI_API_KEY=process-secret
`,
  });

  const result = loadConfigResult({
    schema: modelGatewaySchema,
    cwd,
    processEnv: {},
  });

  const output = formatConfigDiagnostics(result as never);
  assert.match(output, /profile=default/);
  assert.match(output, /MODEL_GATEWAY_PROVIDER <= config-file/);
});

test("支持类似 Spring Boot 的 prefix 配置绑定", () => {
  const wechatSchema = defineConfigProperties({
    prefix: "wechat",
    fields: {
      mchId: defineField({
        parser: stringParser(),
        scope: "server",
        description: "直连商户号",
      }),
      appId: defineField({
        parser: stringParser(),
        scope: "server",
        description: "应用 ID",
      }),
      apiV3Key: defineField({
        parser: stringParser(),
        scope: "server",
        description: "API v3 密钥",
      }),
    },
  });

  const cwd = createFixtureDirectory({
    "config.yaml": `
wechat:
  mch-id: mch-from-yaml
  app-id: app-from-yaml
  api-v3-key: \${WECHAT_API_V3_KEY}
`,
    ".env": `
WECHAT_API_V3_KEY=secret-from-env
`,
  });

  const result = loadConfigResult({
    schema: wechatSchema,
    cwd,
    processEnv: {
      WECHAT_MCH_ID: "mch-from-process-env",
    },
  });

  assert.deepEqual(result.config, {
    mchId: "mch-from-process-env",
    appId: "app-from-yaml",
    apiV3Key: "secret-from-env",
  });
});
