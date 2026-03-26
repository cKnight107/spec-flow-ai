import { TELEMETRY_REDACTION_VERSION } from "./constants";
import { redactText } from "./redaction";
import type {
  CostUsage,
  JsonValue,
  LlmAuditArchiveRecord,
  LlmAuditRecord,
  LlmAuditRecordBundle,
  LlmAuditStatus,
  PromptSource,
  TelemetryContext,
  TokenUsage,
} from "./types";
import { generateAuditId } from "./utils";

export type CreateLlmAuditRecordInput = {
  context: TelemetryContext;
  provider: string;
  model: string;
  modelEndpoint?: string;
  promptTemplateId?: string;
  promptVersion?: string;
  promptSource: PromptSource;
  promptText: string;
  responseText?: string;
  usage: TokenUsage;
  cost: CostUsage;
  status: LlmAuditStatus;
  finishReason?: string;
  errorCode?: string;
  startedAt: string;
  finishedAt: string;
  latencyMs: number;
  toolInputs?: string;
  toolOutputs?: string;
  attachmentsMetadata?: JsonValue;
  safetyLabels?: string[];
  retentionPolicy?: string;
};

export function createLlmAuditRecord(input: CreateLlmAuditRecordInput): LlmAuditRecordBundle {
  const prompt = redactText(input.promptText);
  const response = input.responseText === undefined ? undefined : redactText(input.responseText);
  const archive: LlmAuditArchiveRecord = {
    promptTextRedacted: prompt.redactedText,
    responseTextRedacted: response?.redactedText,
    toolInputsRedacted: input.toolInputs === undefined ? undefined : redactText(input.toolInputs).redactedText,
    toolOutputsRedacted: input.toolOutputs === undefined ? undefined : redactText(input.toolOutputs).redactedText,
    attachmentsMetadata: input.attachmentsMetadata,
    safetyLabels: input.safetyLabels,
    retentionPolicy: input.retentionPolicy,
    redactionVersion: TELEMETRY_REDACTION_VERSION,
  };
  const record: LlmAuditRecord = {
    auditId: generateAuditId(),
    traceId: input.context.traceId,
    requestId: input.context.requestId,
    tenantId: input.context.tenantId,
    appId: input.context.appId,
    userId: input.context.userId,
    sessionId: input.context.sessionId,
    conversationId: input.context.conversationId,
    workflowId: input.context.workflowId,
    executionId: input.context.executionId,
    provider: input.provider,
    model: input.model,
    modelEndpoint: input.modelEndpoint,
    promptTemplateId: input.promptTemplateId,
    promptVersion: input.promptVersion,
    promptSource: input.promptSource,
    promptHash: prompt.hash,
    promptPreview: prompt.preview,
    responseHash: response?.hash,
    responsePreview: response?.preview,
    inputTokens: input.usage.inputTokens,
    outputTokens: input.usage.outputTokens,
    totalTokens: input.usage.totalTokens,
    estimatedCost: input.cost.estimatedUsd,
    latencyMs: input.latencyMs,
    status: input.status,
    finishReason: input.finishReason,
    errorCode: input.errorCode,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
  };

  return {
    record,
    archive,
  };
}
