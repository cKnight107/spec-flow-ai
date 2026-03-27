import OpenAI from "openai";

type ProviderAuthType = "bearer" | "x-api-key";

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

type OpenAIAdapterRequest = Readonly<{
  providerInstance: Readonly<{
    provider: "openai" | "azure-openai";
    baseUrl: string;
    apiKey?: string;
    authType: ProviderAuthType;
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

type OpenAIAdapterResponse = Readonly<{
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

export function createOpenAIProviderAdapter(): Readonly<{
  kind: "openai";
  chatCompletion: (request: OpenAIAdapterRequest) => Promise<OpenAIAdapterResponse>;
}> {
  return Object.freeze({
    kind: "openai" as const,
    chatCompletion: async (request) => {
      const client = new OpenAI({
        apiKey: request.providerInstance.apiKey,
        baseURL: request.providerInstance.baseUrl,
        timeout: request.timeoutMs,
        maxRetries: 0,
        defaultHeaders: request.providerInstance.headers,
      });

      try {
        const { data, response } = await client.chat.completions
          .create({
            model: request.model.providerModel,
            messages: buildMessages(request.request.system, request.request.messages),
            tools: request.request.tools?.map(toOpenAITool),
            temperature: request.request.temperature,
            max_tokens: request.request.maxTokens,
            top_p: request.request.topP,
            stop: request.request.stop === undefined ? undefined : [...request.request.stop],
            stream: false,
          })
          .withResponse();
        const choice = data.choices[0];
        const content = choice?.message?.content ?? "";
        const inputTokens = data.usage?.prompt_tokens ?? 0;
        const outputTokens = data.usage?.completion_tokens ?? 0;
        const totalTokens = data.usage?.total_tokens ?? inputTokens + outputTokens;

        return Object.freeze({
          id: data.id,
          created: data.created,
          model: data.model,
          message: Object.freeze({
            role: "assistant" as const,
            content,
          }),
          finishReason: choice?.finish_reason ?? undefined,
          usage: Object.freeze({
            inputTokens,
            outputTokens,
            totalTokens,
          }),
          httpStatusCode: response.status,
          rawResponse: data,
        });
      } catch (error) {
        throw mapOpenAIError(error);
      }
    },
  });
}

function buildMessages(
  system: string | undefined,
  messages: readonly ProviderChatMessage[],
): Array<OpenAI.ChatCompletionMessageParam> {
  const output: Array<OpenAI.ChatCompletionMessageParam> = [];

  if (system !== undefined) {
    output.push({
      role: "system",
      content: system,
    });
  }

  for (const message of messages) {
    if (message.role === "tool") {
      output.push({
        role: "tool",
        content: message.content,
        tool_call_id: message.toolCallId ?? message.name ?? "tool",
      });
      continue;
    }

    if (message.role === "assistant") {
      output.push({
        role: "assistant",
        content: message.content,
        name: message.name,
      });
      continue;
    }

    output.push({
      role: message.role,
      content: message.content,
      name: message.name,
    });
  }

  return output;
}

function toOpenAITool(tool: ProviderToolDefinition): OpenAI.ChatCompletionTool {
  return {
    type: "function",
    function: {
      name: tool.function.name,
      description: tool.function.description,
      parameters: asFunctionParameters(tool.function.parameters),
    },
  };
}

function asFunctionParameters(value: unknown): OpenAI.FunctionParameters | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as OpenAI.FunctionParameters;
  }

  return {
    type: "object",
    properties: {},
  };
}

function mapOpenAIError(error: unknown): ErrorWithCode {
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return createError("PROVIDER_TIMEOUT", 504, "OpenAI provider 请求超时", true, error);
  }

  if (error instanceof OpenAI.AuthenticationError || error instanceof OpenAI.PermissionDeniedError) {
    return createError("PROVIDER_AUTH_FAILED", 502, error.message, false, error);
  }

  if (error instanceof OpenAI.RateLimitError) {
    return createError("PROVIDER_RATE_LIMITED", 429, error.message, true, error);
  }

  if (error instanceof OpenAI.BadRequestError || error instanceof OpenAI.UnprocessableEntityError) {
    return createError("PROVIDER_BAD_REQUEST", 400, error.message, false, error);
  }

  if (error instanceof OpenAI.APIConnectionError || error instanceof OpenAI.InternalServerError) {
    return createError("PROVIDER_UPSTREAM_ERROR", 502, error.message, true, error);
  }

  return createError(
    "PROVIDER_UPSTREAM_ERROR",
    502,
    error instanceof Error ? error.message : "OpenAI provider 请求失败",
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
