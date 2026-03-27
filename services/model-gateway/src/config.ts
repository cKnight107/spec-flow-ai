import {
  type AppEnv,
  type InferSchemaOutput,
  formatLastConfigDiagnostics,
  loadConfig,
  modelGatewaySchema,
  type ModelGatewayProviderAuthType,
  type ModelGatewayProviderInstanceConfig,
  type ModelGatewayRegisteredModelConfig,
  type ModelGatewayRouteRuleConfig,
} from "@enterprise-ai-hub/shared-config/server";

export type ModelGatewayConfig = InferSchemaOutput<typeof modelGatewaySchema>;

export type ModelGatewayRuntimeProviderInstance = Readonly<
  Omit<ModelGatewayProviderInstanceConfig, "authType" | "headers"> & {
    authType: ModelGatewayProviderAuthType;
    timeoutMs: number;
    headers: Readonly<Record<string, string>>;
  }
>;

export type ModelGatewayRuntimeConfig = Readonly<{
  port: number;
  appEnv: AppEnv;
  serviceName: string;
  defaultTimeoutMs: number;
  providers: readonly ModelGatewayRuntimeProviderInstance[];
  models: readonly ModelGatewayRegisteredModelConfig[];
  routes: readonly ModelGatewayRouteRuleConfig[];
}>;

let cachedConfig: Readonly<ModelGatewayConfig> | undefined;
let cachedRuntimeConfig: Readonly<ModelGatewayRuntimeConfig> | undefined;

export function getModelGatewayConfig(): Readonly<ModelGatewayConfig> {
  if (cachedConfig === undefined) {
    cachedConfig = loadConfig({
      schema: modelGatewaySchema,
      cwd: process.cwd(),
    });
  }

  return cachedConfig;
}

export function getModelGatewayRuntimeConfig(): Readonly<ModelGatewayRuntimeConfig> {
  if (cachedRuntimeConfig === undefined) {
    cachedRuntimeConfig = resolveModelGatewayRuntimeConfig(getModelGatewayConfig());
  }

  return cachedRuntimeConfig;
}

export function describeModelGatewayConfig(): string {
  if (cachedConfig === undefined) {
    getModelGatewayConfig();
  }

  return formatLastConfigDiagnostics();
}

export function resolveModelGatewayRuntimeConfig(
  config: Readonly<ModelGatewayConfig>,
): Readonly<ModelGatewayRuntimeConfig> {
  const providers = Object.freeze(
    config.MODEL_GATEWAY_PROVIDERS_JSON.map((provider) =>
      Object.freeze({
        ...provider,
        apiKey: resolveProviderApiKey(provider, config),
        authType: provider.authType ?? defaultAuthType(provider.provider),
        timeoutMs: provider.timeoutMs ?? config.MODEL_GATEWAY_TIMEOUT_MS,
        headers: provider.headers ?? Object.freeze({}),
      }),
    ),
  );
  const providerIds = new Set<string>();

  for (const provider of providers) {
    if (providerIds.has(provider.id)) {
      throw new Error(`重复的 provider 实例 ID: ${provider.id}`);
    }

    providerIds.add(provider.id);
  }

  const modelIds = new Set<string>();
  for (const model of config.MODEL_GATEWAY_MODELS_JSON) {
    if (modelIds.has(model.id)) {
      throw new Error(`重复的模型 ID: ${model.id}`);
    }

    if (!providerIds.has(model.providerInstance)) {
      throw new Error(`模型 ${model.id} 绑定了未注册 provider 实例: ${model.providerInstance}`);
    }

    modelIds.add(model.id);
  }

  for (const route of config.MODEL_GATEWAY_ROUTES_JSON) {
    if (!modelIds.has(route.targetModel)) {
      throw new Error(`路由 ${route.id} 指向了未注册模型: ${route.targetModel}`);
    }
  }

  return Object.freeze({
    port: config.PORT,
    appEnv: config.APP_ENV as AppEnv,
    serviceName: "model-gateway",
    defaultTimeoutMs: config.MODEL_GATEWAY_TIMEOUT_MS,
    providers,
    models: config.MODEL_GATEWAY_MODELS_JSON,
    routes: config.MODEL_GATEWAY_ROUTES_JSON,
  });
}

function resolveProviderApiKey(
  provider: ModelGatewayProviderInstanceConfig,
  config: Readonly<ModelGatewayConfig>,
): string | undefined {
  if (provider.apiKey !== undefined) {
    return provider.apiKey;
  }

  if (provider.apiKeyEnv !== undefined) {
    if (provider.apiKeyEnv === "OPENAI_API_KEY") {
      return config.OPENAI_API_KEY;
    }

    if (provider.apiKeyEnv === "ANTHROPIC_API_KEY") {
      return config.ANTHROPIC_API_KEY;
    }
  }

  if (provider.provider === "anthropic") {
    return config.ANTHROPIC_API_KEY;
  }

  return config.OPENAI_API_KEY;
}

function defaultAuthType(provider: ModelGatewayProviderInstanceConfig["provider"]): ModelGatewayProviderAuthType {
  return provider === "anthropic" ? "x-api-key" : "bearer";
}
