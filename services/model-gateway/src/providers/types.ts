import type { TokenUsage } from "@enterprise-ai-hub/telemetry-sdk";

import type { ChatCompletionMessage, ChatCompletionRequest } from "../dto/protocol";
import type { ModelGatewayRuntimeProviderInstance } from "../domain/types";
import type { ModelGatewayRegisteredModelConfig } from "@enterprise-ai-hub/shared-config/server";

export type ProviderChatCompletionResponse = Readonly<{
  id: string;
  created: number;
  model: string;
  message: ChatCompletionMessage;
  finishReason?: string;
  usage: TokenUsage;
  httpStatusCode?: number;
  rawResponse?: unknown;
}>;

export type ProviderChatCompletionRequest = Readonly<{
  providerInstance: ModelGatewayRuntimeProviderInstance;
  model: ModelGatewayRegisteredModelConfig;
  request: ChatCompletionRequest;
  timeoutMs: number;
}>;

export type ModelProviderAdapter = Readonly<{
  kind: ModelGatewayRuntimeProviderInstance["provider"];
  chatCompletion: (
    request: ProviderChatCompletionRequest,
  ) => Promise<ProviderChatCompletionResponse>;
}>;
