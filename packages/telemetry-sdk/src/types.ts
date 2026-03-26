export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export type JsonObject = {
  [key: string]: JsonValue;
};

export type TelemetryPrimitive = JsonPrimitive;

export type TelemetryAttributes = Record<string, TelemetryPrimitive>;

export type LogLevel = "debug" | "info" | "warn" | "error";

export type TelemetryContext = {
  traceId: string;
  spanId: string;
  requestId: string;
  tenantId: string;
  appId: string;
  userId: string;
  serviceName: string;
  environment: string;
  timestamp: string;
  sessionId?: string;
  conversationId?: string;
  workflowId?: string;
  executionId?: string;
  toolCallId?: string;
  auditId?: string;
};

export type TelemetryContextInput = Omit<TelemetryContext, "traceId" | "spanId" | "requestId" | "timestamp"> & {
  traceId?: string;
  spanId?: string;
  requestId?: string;
  timestamp?: string;
};

export type SpanKind = "internal" | "server" | "client" | "consumer" | "producer";

export type SpanStatus = "ok" | "error";

export type SpanEvent = {
  name: string;
  timestamp: string;
  attributes?: TelemetryAttributes;
};

export type CompletedSpanRecord = {
  name: string;
  kind: SpanKind;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  serviceName: string;
  environment: string;
  startedAt: string;
  endedAt: string;
  status: SpanStatus;
  attributes: TelemetryAttributes;
  events: SpanEvent[];
  error?: SerializedError;
};

export type SerializedError = {
  name: string;
  message: string;
  stack?: string;
  code?: string;
};

export type TextRedactionResult = {
  redactedText: string;
  preview: string;
  hash: string;
  originalLength: number;
  redacted: boolean;
};

export type PromptSource = "template" | "inline" | "system-generated" | "fallback";

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type CostUsage = {
  estimatedUsd: number;
};

export type LlmAuditStatus = "success" | "error";

export type LlmAuditRecord = {
  auditId: string;
  traceId: string;
  requestId: string;
  tenantId: string;
  appId: string;
  userId: string;
  sessionId?: string;
  conversationId?: string;
  workflowId?: string;
  executionId?: string;
  provider: string;
  model: string;
  modelEndpoint?: string;
  promptTemplateId?: string;
  promptVersion?: string;
  promptSource: PromptSource;
  promptHash: string;
  promptPreview: string;
  responseHash?: string;
  responsePreview?: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  latencyMs: number;
  status: LlmAuditStatus;
  finishReason?: string;
  errorCode?: string;
  startedAt: string;
  finishedAt: string;
};

export type LlmAuditArchiveRecord = {
  promptTextRedacted: string;
  responseTextRedacted?: string;
  toolInputsRedacted?: string;
  toolOutputsRedacted?: string;
  attachmentsMetadata?: JsonValue;
  safetyLabels?: string[];
  retentionPolicy?: string;
  redactionVersion: string;
};

export type LlmAuditRecordBundle = {
  record: LlmAuditRecord;
  archive: LlmAuditArchiveRecord;
};
