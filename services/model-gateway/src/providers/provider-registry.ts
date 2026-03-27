import { createAnthropicProviderAdapter } from "@enterprise-ai-hub/model-provider-anthropic";
import { createOpenAIProviderAdapter } from "@enterprise-ai-hub/model-provider-openai";

import { ModelGatewayError } from "../domain/errors";
import type { ModelGatewayRuntimeProviderInstance } from "../domain/types";

import type {
  ModelProviderAdapter,
  ProviderChatCompletionRequest,
  ProviderChatCompletionResponse,
} from "./types";

export class ModelProviderRegistry {
  private readonly adapters = new Map<string, ModelProviderAdapter>();

  public constructor(adapters: readonly ModelProviderAdapter[]) {
    for (const adapter of adapters) {
      this.adapters.set(adapter.kind, adapter);
    }
  }

  public async chatCompletion(
    request: ProviderChatCompletionRequest,
  ): Promise<ProviderChatCompletionResponse> {
    const adapter = this.adapters.get(request.providerInstance.provider);

    if (adapter === undefined) {
      throw new ModelGatewayError({
        code: "PROVIDER_NOT_SUPPORTED",
        statusCode: 500,
        message: `当前未注册 provider adapter: ${request.providerInstance.provider}`,
      });
    }

    if (request.providerInstance.apiKey === undefined || request.providerInstance.apiKey.length === 0) {
      throw new ModelGatewayError({
        code: "PROVIDER_AUTH_MISSING",
        statusCode: 500,
        message: `provider 实例 ${request.providerInstance.id} 缺少鉴权配置`,
      });
    }

    return adapter.chatCompletion(request);
  }
}

export function createDefaultProviderRegistry(): ModelProviderRegistry {
  const openaiAdapter = createOpenAIProviderAdapter();
  const anthropicAdapter = createAnthropicProviderAdapter();

  return new ModelProviderRegistry([
    {
      kind: "openai",
      chatCompletion: async (request) => openaiAdapter.chatCompletion(request as never),
    },
    {
      kind: "azure-openai",
      chatCompletion: async (request) => openaiAdapter.chatCompletion(request as never),
    },
    {
      kind: "anthropic",
      chatCompletion: async (request) => anthropicAdapter.chatCompletion(request as never),
    },
  ]);
}

export function normalizeProviderHeaders(
  headers: Readonly<Record<string, string>> | undefined,
): Readonly<Record<string, string>> {
  return headers === undefined ? Object.freeze({}) : headers;
}

export function findProviderInstance(
  providerInstances: readonly ModelGatewayRuntimeProviderInstance[],
  providerInstanceId: string,
): ModelGatewayRuntimeProviderInstance | undefined {
  return providerInstances.find((item) => item.id === providerInstanceId);
}
