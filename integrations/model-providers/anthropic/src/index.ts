import Anthropic from "@anthropic-ai/sdk";

type ProviderChatMessage = Readonly<{
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  toolCallId?: string;
}>;

type ProviderToolDefinition = Readonly<{
  type: "function";
  function: Readonly<{
    name: string;
    description?: string;
    parameters?: unknown;
  }>;
}>;

type AnthropicAdapterRequest = Readonly<{
  providerInstance: Readonly<{
    provider: "anthropic";
    baseUrl: string;
    apiKey?: string;
    authType: "x-api-key";
    headers: Readonly<Record<string, string>>;
  }>;
  model: Readonly<{
    providerModel: string;
  }>;
  request: Readonly<{
    system?: string;
    messages: readonly ProviderChatMessage[];
    tools?: readonly ProviderToolDefinition[];
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    stop?: readonly string[];
  }>;
  timeoutMs: number;
}>;

type AnthropicAdapterResponse = Readonly<{
  id: string;
  created: number;
  model: string;
  message: ProviderChatMessage;
  finishReason?: string;
  usage: Readonly<{
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  }>;
  httpStatusCode?: number;
  rawResponse?: unknown;
}>;

type ErrorWithCode = Error & {
  code: string;
  statusCode?: number;
  retryable?: boolean;
};

export function createAnthropicProviderAdapter(): Readonly<{
  kind: "anthropic";
  chatCompletion: (request: AnthropicAdapterRequest) => Promise<AnthropicAdapterResponse>;
}> {
  return Object.freeze({
    kind: "anthropic" as const,
    chatCompletion: async (request) => {
      const client = new Anthropic({
        apiKey: request.providerInstance.apiKey ?? null,
        baseURL: normalizeAnthropicBaseUrl(request.providerInstance.baseUrl),
        timeout: request.timeoutMs,
        maxRetries: 0,
        defaultHeaders: request.providerInstance.headers,
      });

      try {
        const { data, response } = await client.messages
          .create({
            model: request.model.providerModel,
            system: request.request.system,
            messages: buildMessages(request.request.messages),
            tools: request.request.tools?.map(toAnthropicTool),
            temperature: request.request.temperature,
            max_tokens: request.request.maxTokens ?? 1024,
            top_p: request.request.topP,
            stop_sequences: request.request.stop === undefined ? undefined : [...request.request.stop],
            stream: false,
          })
          .withResponse();
        const content = data.content
          .filter((item) => item.type === "text")
          .map((item) => item.text)
          .join("");
        const inputTokens = data.usage.input_tokens;
        const outputTokens = data.usage.output_tokens;

        return Object.freeze({
          id: data.id,
          created: Math.floor(Date.now() / 1000),
          model: data.model,
          message: Object.freeze({
            role: "assistant" as const,
            content,
          }),
          finishReason: data.stop_reason ?? undefined,
          usage: Object.freeze({
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
          }),
          httpStatusCode: response.status,
          rawResponse: data,
        });
      } catch (error) {
        throw mapAnthropicError(error);
      }
    },
  });
}

function buildMessages(
  messages: readonly ProviderChatMessage[],
): Array<Anthropic.MessageParam> {
  return messages.map((message) => {
    if (message.role === "assistant" || message.role === "user") {
      return {
        role: message.role,
        content: message.content,
      };
    }

    return {
      role: "user",
      content:
        message.role === "tool"
          ? `tool(${message.name ?? message.toolCallId ?? "tool"}): ${message.content}`
          : message.content,
    };
  });
}

function toAnthropicTool(tool: ProviderToolDefinition): Anthropic.Tool {
  return {
    name: tool.function.name,
    description: tool.function.description,
    input_schema: asInputSchema(tool.function.parameters),
  };
}

function asInputSchema(value: unknown): Anthropic.Tool.InputSchema {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const candidate = value as Record<string, unknown>;

    return {
      type: candidate.type === "object" ? "object" : "object",
      ...candidate,
    };
  }

  return {
    type: "object",
    properties: {},
  };
}

function normalizeAnthropicBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/v1") ? baseUrl.slice(0, -3) : baseUrl;
}

function mapAnthropicError(error: unknown): ErrorWithCode {
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return createError("PROVIDER_TIMEOUT", 504, "Anthropic provider 请求超时", true, error);
  }

  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return createError("PROVIDER_AUTH_FAILED", 502, error.message, false, error);
  }

  if (error instanceof Anthropic.RateLimitError) {
    return createError("PROVIDER_RATE_LIMITED", 429, error.message, true, error);
  }

  if (
    error instanceof Anthropic.BadRequestError ||
    error instanceof Anthropic.UnprocessableEntityError
  ) {
    return createError("PROVIDER_BAD_REQUEST", 400, error.message, false, error);
  }

  if (error instanceof Anthropic.APIConnectionError || error instanceof Anthropic.InternalServerError) {
    return createError("PROVIDER_UPSTREAM_ERROR", 502, error.message, true, error);
  }

  return createError(
    "PROVIDER_UPSTREAM_ERROR",
    502,
    error instanceof Error ? error.message : "Anthropic provider 请求失败",
    true,
    error,
  );
}

function createError(
  code: string,
  statusCode: number,
  message: string,
  retryable: boolean,
  cause: unknown,
): ErrorWithCode {
  const error = new Error(message, { cause }) as ErrorWithCode;
  error.code = code;
  error.statusCode = statusCode;
  error.retryable = retryable;
  return error;
}
