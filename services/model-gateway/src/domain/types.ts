import type {
  AppEnv,
  ModelGatewayProviderAuthType,
  ModelGatewayProviderInstanceConfig,
  ModelGatewayRegisteredModelConfig,
  ModelGatewayRouteRuleConfig,
} from "@enterprise-ai-hub/shared-config/server";

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

export type ResolvedModelRoute = Readonly<{
  requestedModel: string;
  resolvedModel: ModelGatewayRegisteredModelConfig;
  providerInstance: ModelGatewayRuntimeProviderInstance;
  matchedRouteId?: string;
}>;
