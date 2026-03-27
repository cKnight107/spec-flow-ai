import {
  defineField,
  defineSchema,
  enumParser,
  mergeSchemas,
  numberParser,
  stringParser,
} from "../fields";
import type { ConfigParser } from "../types";
import { baseSchema } from "./base";

export type ModelGatewayProviderKind = "openai" | "anthropic" | "azure-openai";

export type ModelGatewayModelType = "chat" | "embedding" | "reranker";

export type ModelGatewayProviderAuthType = "bearer" | "x-api-key";

export type ModelGatewayPricingConfig = Readonly<{
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
  currency: "USD";
}>;

export type ModelGatewayProviderInstanceConfig = Readonly<{
  id: string;
  provider: ModelGatewayProviderKind;
  baseUrl: string;
  apiKey?: string;
  apiKeyEnv?: string;
  authType?: ModelGatewayProviderAuthType;
  timeoutMs?: number;
  headers?: Readonly<Record<string, string>>;
}>;

export type ModelGatewayRegisteredModelConfig = Readonly<{
  id: string;
  providerModel: string;
  providerInstance: string;
  type: ModelGatewayModelType;
  displayName?: string;
  aliases?: readonly string[];
  maxTokens?: number;
  capabilities?: readonly string[];
  scenarioTags?: readonly string[];
  timeoutMs?: number;
  status?: "active" | "inactive";
  pricing?: ModelGatewayPricingConfig;
}>;

export type ModelGatewayRouteRuleConfig = Readonly<{
  id: string;
  requestedModel: string;
  targetModel: string;
  priority?: number;
  tenantIds?: readonly string[];
  appIds?: readonly string[];
}>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} 必须是非空字符串`);
  }

  return value.trim();
}

function requireOptionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return requireString(value, fieldName);
}

function requireOptionalNumber(value: unknown, fieldName: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${fieldName} 必须是合法数字`);
  }

  return value;
}

function requireStringArray(value: unknown, fieldName: string): readonly string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} 必须是字符串数组`);
  }

  const output = value.map((item, index) => requireString(item, `${fieldName}[${index}]`));
  return Object.freeze(output);
}

function requireOptionalStringArray(value: unknown, fieldName: string): readonly string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  return requireStringArray(value, fieldName);
}

function requireUrl(value: unknown, fieldName: string): string {
  const text = requireString(value, fieldName);

  try {
    new URL(text);
    return text;
  } catch {
    throw new Error(`${fieldName} 不是合法 URL`);
  }
}

function requireProviderKind(value: unknown, fieldName: string): ModelGatewayProviderKind {
  const text = requireString(value, fieldName);

  if (text !== "openai" && text !== "anthropic" && text !== "azure-openai") {
    throw new Error(`${fieldName} 必须是 openai / anthropic / azure-openai 之一`);
  }

  return text;
}

function requireModelType(value: unknown, fieldName: string): ModelGatewayModelType {
  const text = requireString(value, fieldName);

  if (text !== "chat" && text !== "embedding" && text !== "reranker") {
    throw new Error(`${fieldName} 必须是 chat / embedding / reranker 之一`);
  }

  return text;
}

function requireAuthType(value: unknown, fieldName: string): ModelGatewayProviderAuthType {
  const text = requireString(value, fieldName);

  if (text !== "bearer" && text !== "x-api-key") {
    throw new Error(`${fieldName} 必须是 bearer / x-api-key 之一`);
  }

  return text;
}

function parsePricing(value: unknown, fieldName: string): ModelGatewayPricingConfig {
  if (!isObject(value)) {
    throw new Error(`${fieldName} 必须是对象`);
  }

  const inputPerMillionUsd = requireOptionalNumber(value.inputPerMillionUsd, `${fieldName}.inputPerMillionUsd`) ?? 0;
  const outputPerMillionUsd =
    requireOptionalNumber(value.outputPerMillionUsd, `${fieldName}.outputPerMillionUsd`) ?? 0;
  const currency = value.currency === undefined ? "USD" : requireString(value.currency, `${fieldName}.currency`);

  if (currency !== "USD") {
    throw new Error(`${fieldName}.currency 当前仅支持 USD`);
  }

  return Object.freeze({
    inputPerMillionUsd,
    outputPerMillionUsd,
    currency,
  });
}

function parseHeaders(value: unknown, fieldName: string): Readonly<Record<string, string>> {
  if (!isObject(value)) {
    throw new Error(`${fieldName} 必须是对象`);
  }

  const headers: Record<string, string> = {};

  for (const [key, headerValue] of Object.entries(value)) {
    headers[key] = requireString(headerValue, `${fieldName}.${key}`);
  }

  return Object.freeze(headers);
}

function parseProviderInstance(
  value: unknown,
  fieldName: string,
): ModelGatewayProviderInstanceConfig {
  if (!isObject(value)) {
    throw new Error(`${fieldName} 必须是对象`);
  }

  return Object.freeze({
    id: requireString(value.id, `${fieldName}.id`),
    provider: requireProviderKind(value.provider, `${fieldName}.provider`),
    baseUrl: requireUrl(value.baseUrl, `${fieldName}.baseUrl`),
    apiKey: requireOptionalString(value.apiKey, `${fieldName}.apiKey`),
    apiKeyEnv: requireOptionalString(value.apiKeyEnv, `${fieldName}.apiKeyEnv`),
    authType: value.authType === undefined ? undefined : requireAuthType(value.authType, `${fieldName}.authType`),
    timeoutMs: requireOptionalNumber(value.timeoutMs, `${fieldName}.timeoutMs`),
    headers: value.headers === undefined ? undefined : parseHeaders(value.headers, `${fieldName}.headers`),
  });
}

function parseRegisteredModel(
  value: unknown,
  fieldName: string,
): ModelGatewayRegisteredModelConfig {
  if (!isObject(value)) {
    throw new Error(`${fieldName} 必须是对象`);
  }

  const status = value.status === undefined ? "active" : requireString(value.status, `${fieldName}.status`);

  if (status !== "active" && status !== "inactive") {
    throw new Error(`${fieldName}.status 必须是 active / inactive 之一`);
  }

  return Object.freeze({
    id: requireString(value.id, `${fieldName}.id`),
    providerModel: requireString(value.providerModel, `${fieldName}.providerModel`),
    providerInstance: requireString(value.providerInstance, `${fieldName}.providerInstance`),
    type: requireModelType(value.type, `${fieldName}.type`),
    displayName: requireOptionalString(value.displayName, `${fieldName}.displayName`),
    aliases: requireOptionalStringArray(value.aliases, `${fieldName}.aliases`),
    maxTokens: requireOptionalNumber(value.maxTokens, `${fieldName}.maxTokens`),
    capabilities: requireOptionalStringArray(value.capabilities, `${fieldName}.capabilities`),
    scenarioTags: requireOptionalStringArray(value.scenarioTags, `${fieldName}.scenarioTags`),
    timeoutMs: requireOptionalNumber(value.timeoutMs, `${fieldName}.timeoutMs`),
    status,
    pricing: value.pricing === undefined ? undefined : parsePricing(value.pricing, `${fieldName}.pricing`),
  });
}

function parseRouteRule(value: unknown, fieldName: string): ModelGatewayRouteRuleConfig {
  if (!isObject(value)) {
    throw new Error(`${fieldName} 必须是对象`);
  }

  return Object.freeze({
    id: requireString(value.id, `${fieldName}.id`),
    requestedModel: requireString(value.requestedModel, `${fieldName}.requestedModel`),
    targetModel: requireString(value.targetModel, `${fieldName}.targetModel`),
    priority: requireOptionalNumber(value.priority, `${fieldName}.priority`),
    tenantIds: requireOptionalStringArray(value.tenantIds, `${fieldName}.tenantIds`),
    appIds: requireOptionalStringArray(value.appIds, `${fieldName}.appIds`),
  });
}

function jsonParser<TValue>(
  kind: string,
  parseValue: (value: unknown, fieldName: string) => TValue,
): ConfigParser<TValue> {
  return {
    kind,
    parse: (raw, context) => {
      let parsed: unknown;

      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error(`${context.key} 不是合法 JSON`);
      }

      return parseValue(parsed, context.key);
    },
  };
}

function jsonArrayParser<TValue>(
  kind: string,
  parseItem: (value: unknown, fieldName: string) => TValue,
): ConfigParser<readonly TValue[]> {
  return jsonParser(kind, (value, fieldName) => {
    if (!Array.isArray(value)) {
      throw new Error(`${fieldName} 必须是数组`);
    }

    const output = value.map((item, index) => parseItem(item, `${fieldName}[${index}]`));
    return Object.freeze(output);
  });
}

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
    required: false,
    defaultValue: "openai",
    description: "旧版单 provider 配置，保留用于兼容历史环境变量",
  }),
  MODEL_GATEWAY_TIMEOUT_MS: defineField({
    parser: numberParser({ integer: true, min: 1000 }),
    scope: "server",
    required: false,
    defaultValue: 30000,
    description: "模型请求超时时间",
  }),
  OPENAI_API_KEY: defineField({
    parser: stringParser(),
    scope: "server",
    secret: true,
    description: "调用上游模型供应商的凭据",
    aliases: ["MODEL_GATEWAY_OPENAI_API_KEY"],
    deprecated: {
      since: "0.1.0",
      removeBy: "0.3.0",
      replacement: "OPENAI_API_KEY",
    },
  }),
  ANTHROPIC_API_KEY: defineField({
    parser: stringParser(),
    scope: "server",
    required: false,
    secret: true,
    description: "调用 Anthropic 的凭据",
    aliases: ["MODEL_GATEWAY_ANTHROPIC_API_KEY"],
  }),
  MODEL_GATEWAY_PROVIDERS_JSON: defineField({
    parser: jsonArrayParser("json-array:model-gateway-providers", parseProviderInstance),
    scope: "server",
    required: false,
    defaultValue: Object.freeze([]) as readonly ModelGatewayProviderInstanceConfig[],
    description: "模型网关 provider 实例注册表 JSON",
  }),
  MODEL_GATEWAY_MODELS_JSON: defineField({
    parser: jsonArrayParser("json-array:model-gateway-models", parseRegisteredModel),
    scope: "server",
    required: false,
    defaultValue: Object.freeze([]) as readonly ModelGatewayRegisteredModelConfig[],
    description: "模型注册表 JSON",
  }),
  MODEL_GATEWAY_ROUTES_JSON: defineField({
    parser: jsonArrayParser("json-array:model-gateway-routes", parseRouteRule),
    scope: "server",
    required: false,
    defaultValue: Object.freeze([]) as readonly ModelGatewayRouteRuleConfig[],
    description: "模型路由规则 JSON",
  }),
});

export const modelGatewaySchema = mergeSchemas(baseSchema, modelGatewayOnlySchema);
