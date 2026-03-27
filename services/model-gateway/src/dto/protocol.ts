import type { JsonValue } from "@enterprise-ai-hub/telemetry-sdk";

import { ModelGatewayError } from "../domain/errors";

export type ChatCompletionRole = "system" | "user" | "assistant" | "tool";

export type ChatCompletionMessage = Readonly<{
  role: ChatCompletionRole;
  content: string;
  name?: string;
  toolCallId?: string;
}>;

export type ChatCompletionToolDefinition = Readonly<{
  type: "function";
  function: Readonly<{
    name: string;
    description?: string;
    parameters?: JsonValue;
  }>;
}>;

export type ChatCompletionRouteHints = Readonly<{
  provider?: string;
  providerInstance?: string;
}>;

export type ChatCompletionQuotaSubject = Readonly<{
  tenantId?: string;
  appId?: string;
  userId?: string;
  departmentId?: string;
}>;

export type ChatCompletionRequest = Readonly<{
  model: string;
  messages: readonly ChatCompletionMessage[];
  system?: string;
  tools?: readonly ChatCompletionToolDefinition[];
  stream?: boolean;
  metadata?: Readonly<Record<string, JsonValue>>;
  routeHints?: ChatCompletionRouteHints;
  quotaSubject?: ChatCompletionQuotaSubject;
  user?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: readonly string[];
}>;

export type ChatCompletionChoice = Readonly<{
  index: number;
  message: ChatCompletionMessage;
  finishReason?: string;
}>;

export type ChatCompletionSuccessResponse = Readonly<{
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: readonly ChatCompletionChoice[];
  usage: Readonly<{
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  }>;
  cost: Readonly<{
    estimatedUsd: number;
  }>;
  audit: Readonly<{
    auditId: string;
    status: "success";
  }>;
  trace: Readonly<{
    traceId: string;
    requestId: string;
    spanId: string;
  }>;
  route: Readonly<{
    provider: string;
    providerInstance: string;
    requestedModel: string;
    resolvedModel: string;
  }>;
}>;

export type RegisteredModelSummary = Readonly<{
  id: string;
  displayName: string;
  provider: string;
  providerInstance: string;
  type: string;
  aliases: readonly string[];
  capabilities: readonly string[];
  scenarioTags: readonly string[];
  maxTokens?: number;
}>;

export type ListModelsResponse = Readonly<{
  object: "list";
  data: readonly RegisteredModelSummary[];
}>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ModelGatewayError({
      code: "INVALID_REQUEST",
      statusCode: 400,
      message: `${fieldName} 必须是非空字符串`,
    });
  }

  return value.trim();
}

function optionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return requireString(value, fieldName);
}

function optionalNumber(value: unknown, fieldName: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ModelGatewayError({
      code: "INVALID_REQUEST",
      statusCode: 400,
      message: `${fieldName} 必须是合法数字`,
    });
  }

  return value;
}

function optionalBoolean(value: unknown, fieldName: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new ModelGatewayError({
      code: "INVALID_REQUEST",
      statusCode: 400,
      message: `${fieldName} 必须是布尔值`,
    });
  }

  return value;
}

function optionalStringArray(value: unknown, fieldName: string): readonly string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new ModelGatewayError({
      code: "INVALID_REQUEST",
      statusCode: 400,
      message: `${fieldName} 必须是字符串数组`,
    });
  }

  return Object.freeze(value.map((item, index) => requireString(item, `${fieldName}[${index}]`)));
}

function toJsonValue(value: unknown, fieldName: string): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => toJsonValue(item, `${fieldName}[${index}]`));
  }

  if (isObject(value)) {
    const output: Record<string, JsonValue> = {};

    for (const [key, item] of Object.entries(value)) {
      output[key] = toJsonValue(item, `${fieldName}.${key}`);
    }

    return output;
  }

  throw new ModelGatewayError({
    code: "INVALID_REQUEST",
    statusCode: 400,
    message: `${fieldName} 包含不支持的 JSON 值`,
  });
}

function parseMessages(value: unknown): readonly ChatCompletionMessage[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ModelGatewayError({
      code: "INVALID_REQUEST",
      statusCode: 400,
      message: "messages 必须是非空数组",
    });
  }

  return Object.freeze(
    value.map((item, index) => {
      if (!isObject(item)) {
        throw new ModelGatewayError({
          code: "INVALID_REQUEST",
          statusCode: 400,
          message: `messages[${index}] 必须是对象`,
        });
      }

      const role = requireString(item.role, `messages[${index}].role`);
      if (role !== "system" && role !== "user" && role !== "assistant" && role !== "tool") {
        throw new ModelGatewayError({
          code: "INVALID_REQUEST",
          statusCode: 400,
          message: `messages[${index}].role 必须是 system / user / assistant / tool 之一`,
        });
      }

      return Object.freeze({
        role,
        content: requireString(item.content, `messages[${index}].content`),
        name: optionalString(item.name, `messages[${index}].name`),
        toolCallId: optionalString(item.toolCallId, `messages[${index}].toolCallId`),
      });
    }),
  );
}

function parseTools(value: unknown): readonly ChatCompletionToolDefinition[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new ModelGatewayError({
      code: "INVALID_REQUEST",
      statusCode: 400,
      message: "tools 必须是数组",
    });
  }

  return Object.freeze(
    value.map((item, index) => {
      if (!isObject(item) || !isObject(item.function)) {
        throw new ModelGatewayError({
          code: "INVALID_REQUEST",
          statusCode: 400,
          message: `tools[${index}] 必须包含 function 定义`,
        });
      }

      const toolType = requireString(item.type, `tools[${index}].type`);
      if (toolType !== "function") {
        throw new ModelGatewayError({
          code: "INVALID_REQUEST",
          statusCode: 400,
          message: `tools[${index}].type 当前仅支持 function`,
        });
      }

      return Object.freeze({
        type: "function" as const,
        function: Object.freeze({
          name: requireString(item.function.name, `tools[${index}].function.name`),
          description: optionalString(item.function.description, `tools[${index}].function.description`),
          parameters:
            item.function.parameters === undefined
              ? undefined
              : toJsonValue(item.function.parameters, `tools[${index}].function.parameters`),
        }),
      });
    }),
  );
}

function parseMetadata(value: unknown): Readonly<Record<string, JsonValue>> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isObject(value)) {
    throw new ModelGatewayError({
      code: "INVALID_REQUEST",
      statusCode: 400,
      message: "metadata 必须是对象",
    });
  }

  const output: Record<string, JsonValue> = {};

  for (const [key, item] of Object.entries(value)) {
    output[key] = toJsonValue(item, `metadata.${key}`);
  }

  return Object.freeze(output);
}

function parseRouteHints(value: unknown): ChatCompletionRouteHints | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isObject(value)) {
    throw new ModelGatewayError({
      code: "INVALID_REQUEST",
      statusCode: 400,
      message: "routeHints 必须是对象",
    });
  }

  return Object.freeze({
    provider: optionalString(value.provider, "routeHints.provider"),
    providerInstance: optionalString(value.providerInstance, "routeHints.providerInstance"),
  });
}

function parseQuotaSubject(value: unknown): ChatCompletionQuotaSubject | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isObject(value)) {
    throw new ModelGatewayError({
      code: "INVALID_REQUEST",
      statusCode: 400,
      message: "quotaSubject 必须是对象",
    });
  }

  return Object.freeze({
    tenantId: optionalString(value.tenantId, "quotaSubject.tenantId"),
    appId: optionalString(value.appId, "quotaSubject.appId"),
    userId: optionalString(value.userId, "quotaSubject.userId"),
    departmentId: optionalString(value.departmentId, "quotaSubject.departmentId"),
  });
}

export function parseChatCompletionRequest(input: unknown): ChatCompletionRequest {
  if (!isObject(input)) {
    throw new ModelGatewayError({
      code: "INVALID_REQUEST",
      statusCode: 400,
      message: "请求体必须是 JSON 对象",
    });
  }

  return Object.freeze({
    model: requireString(input.model, "model"),
    messages: parseMessages(input.messages),
    system: optionalString(input.system, "system"),
    tools: parseTools(input.tools),
    stream: optionalBoolean(input.stream, "stream") ?? false,
    metadata: parseMetadata(input.metadata),
    routeHints: parseRouteHints(input.routeHints),
    quotaSubject: parseQuotaSubject(input.quotaSubject),
    user: optionalString(input.user, "user"),
    temperature: optionalNumber(input.temperature, "temperature"),
    maxTokens: optionalNumber(input.maxTokens, "maxTokens"),
    topP: optionalNumber(input.topP, "topP"),
    stop: optionalStringArray(input.stop, "stop"),
  });
}
