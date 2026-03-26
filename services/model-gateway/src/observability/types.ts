import type {
  CostUsage,
  LlmAuditRecordBundle,
  PromptSource,
  TelemetryContextInput,
  TokenUsage,
} from "@enterprise-ai-hub/telemetry-sdk";

export type ModelPrompt = {
  text: string;
  source: PromptSource;
  templateId?: string;
  version?: string;
};

export type ModelSettings = {
  temperature?: number;
  maxTokens?: number;
};

export type ModelInvocationRequest = {
  context: TelemetryContextInput;
  provider: string;
  model: string;
  modelEndpoint?: string;
  operation?: string;
  prompt: ModelPrompt;
  settings?: ModelSettings;
};

export type ModelProviderSuccess<TResult> = {
  providerResponse: TResult;
  responseText: string;
  finishReason?: string;
  usage: TokenUsage;
  cost: CostUsage;
  httpStatusCode?: number;
};

export type ModelProviderInvoker<TResult> = (
  request: ModelInvocationRequest,
) => Promise<ModelProviderSuccess<TResult>>;

export type InstrumentedModelInvocationResult<TResult> = {
  providerResponse: TResult;
  usage: TokenUsage;
  cost: CostUsage;
  audit: LlmAuditRecordBundle;
  trace: {
    traceId: string;
    spanId: string;
    requestId: string;
  };
};
