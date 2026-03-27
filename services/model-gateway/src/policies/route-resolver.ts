import type { ModelGatewayRegisteredModelConfig } from "@enterprise-ai-hub/shared-config/server";

import { ModelGatewayError } from "../domain/errors";
import type { ChatCompletionRouteHints } from "../dto/protocol";
import type {
  ModelGatewayRuntimeConfig,
  ModelGatewayRuntimeProviderInstance,
  ResolvedModelRoute,
} from "../domain/types";
import { findProviderInstance } from "../providers/provider-registry";

type ResolveRouteOptions = Readonly<{
  requestedModel: string;
  tenantId: string;
  appId: string;
  routeHints?: ChatCompletionRouteHints;
}>;

export class ModelRouteResolver {
  public constructor(private readonly config: ModelGatewayRuntimeConfig) {}

  public listModels(): readonly ModelGatewayRegisteredModelConfig[] {
    return this.config.models.filter((item) => item.status !== "inactive");
  }

  public resolve(options: ResolveRouteOptions): ResolvedModelRoute {
    const candidates = this.listModels();
    const exactTarget = this.resolveRouteRule(options) ?? this.resolveModelAlias(options.requestedModel, candidates);

    if (exactTarget === undefined) {
      throw new ModelGatewayError({
        code: "MODEL_NOT_FOUND",
        statusCode: 404,
        message: `未找到已注册模型: ${options.requestedModel}`,
      });
    }

    const providerInstance = findProviderInstance(this.config.providers, exactTarget.providerInstance);
    if (providerInstance === undefined) {
      throw new ModelGatewayError({
        code: "PROVIDER_NOT_SUPPORTED",
        statusCode: 500,
        message: `模型 ${exactTarget.id} 绑定的 provider 实例不存在: ${exactTarget.providerInstance}`,
      });
    }

    this.assertRouteHints(options.routeHints, providerInstance);

    return Object.freeze({
      requestedModel: options.requestedModel,
      resolvedModel: exactTarget,
      providerInstance,
      matchedRouteId: this.resolveMatchedRouteId(options, exactTarget.id),
    });
  }

  private resolveRouteRule(
    options: ResolveRouteOptions,
  ): ModelGatewayRegisteredModelConfig | undefined {
    const matchedRules = this.config.routes
      .filter((route) => route.requestedModel === options.requestedModel)
      .filter((route) => route.tenantIds === undefined || route.tenantIds.includes(options.tenantId))
      .filter((route) => route.appIds === undefined || route.appIds.includes(options.appId))
      .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));

    const matchedRule = matchedRules[0];
    if (matchedRule === undefined) {
      return undefined;
    }

    return this.resolveModelById(matchedRule.targetModel);
  }

  private resolveMatchedRouteId(
    options: ResolveRouteOptions,
    targetModelId: string,
  ): string | undefined {
    return this.config.routes
      .filter((route) => route.requestedModel === options.requestedModel)
      .filter((route) => route.targetModel === targetModelId)
      .filter((route) => route.tenantIds === undefined || route.tenantIds.includes(options.tenantId))
      .filter((route) => route.appIds === undefined || route.appIds.includes(options.appId))
      .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))[0]?.id;
  }

  private resolveModelAlias(
    requestedModel: string,
    candidates: readonly ModelGatewayRegisteredModelConfig[],
  ): ModelGatewayRegisteredModelConfig | undefined {
    return candidates.find(
      (item) => item.id === requestedModel || item.aliases?.includes(requestedModel) === true,
    );
  }

  private resolveModelById(modelId: string): ModelGatewayRegisteredModelConfig | undefined {
    return this.listModels().find((item) => item.id === modelId);
  }

  private assertRouteHints(
    routeHints: ChatCompletionRouteHints | undefined,
    providerInstance: ModelGatewayRuntimeProviderInstance,
  ): void {
    if (routeHints?.provider !== undefined && routeHints.provider !== providerInstance.provider) {
      throw new ModelGatewayError({
        code: "MODEL_NOT_FOUND",
        statusCode: 404,
        message: `请求要求 provider=${routeHints.provider}，但命中模型使用 ${providerInstance.provider}`,
      });
    }

    if (
      routeHints?.providerInstance !== undefined &&
      routeHints.providerInstance !== providerInstance.id
    ) {
      throw new ModelGatewayError({
        code: "MODEL_NOT_FOUND",
        statusCode: 404,
        message: `请求要求 providerInstance=${routeHints.providerInstance}，但命中模型使用 ${providerInstance.id}`,
      });
    }
  }
}
