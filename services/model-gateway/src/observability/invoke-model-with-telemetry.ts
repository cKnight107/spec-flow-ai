import {
  TELEMETRY_ATTRIBUTE_KEYS,
  TELEMETRY_SPAN_NAMES,
  createJsonLogger,
  createLlmAuditRecord,
  createTelemetryContext,
  patchTelemetryContext,
  runWithTelemetryContext,
  type TelemetryLogger,
  withSpan,
} from "@enterprise-ai-hub/telemetry-sdk";

import type {
  InstrumentedModelInvocationResult,
  ModelInvocationRequest,
  ModelProviderInvoker,
} from "./types";

export class InstrumentedModelInvocationError extends Error {
  public readonly traceId: string;
  public readonly requestId: string;
  public readonly auditId: string;
  public readonly errorCode?: string;

  public constructor(options: {
    message: string;
    traceId: string;
    requestId: string;
    auditId: string;
    errorCode?: string;
    cause?: unknown;
  }) {
    super(options.message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "InstrumentedModelInvocationError";
    this.traceId = options.traceId;
    this.requestId = options.requestId;
    this.auditId = options.auditId;
    this.errorCode = options.errorCode;
  }
}

export type InvokeModelWithTelemetryOptions<TResult> = {
  request: ModelInvocationRequest;
  invoke: ModelProviderInvoker<TResult>;
  logger?: TelemetryLogger;
};

export async function invokeModelWithTelemetry<TResult>(
  options: InvokeModelWithTelemetryOptions<TResult>,
): Promise<InstrumentedModelInvocationResult<TResult>> {
  const context = createTelemetryContext(options.request.context);
  const logger = (options.logger ?? createJsonLogger({ name: "model-gateway" })).child({
    provider: options.request.provider,
    model: options.request.model,
  });

  return runWithTelemetryContext(context, async () =>
    withSpan(
      {
        name: TELEMETRY_SPAN_NAMES.LLM_CALL,
        kind: "client",
        attributes: {
          [TELEMETRY_ATTRIBUTE_KEYS.OPERATION]: options.request.operation ?? "chat.completion",
          [TELEMETRY_ATTRIBUTE_KEYS.PROVIDER]: options.request.provider,
          [TELEMETRY_ATTRIBUTE_KEYS.MODEL]: options.request.model,
          [TELEMETRY_ATTRIBUTE_KEYS.PROMPT_TEMPLATE_ID]: options.request.prompt.templateId,
          [TELEMETRY_ATTRIBUTE_KEYS.PROMPT_VERSION]: options.request.prompt.version,
          [TELEMETRY_ATTRIBUTE_KEYS.PROMPT_SOURCE]: options.request.prompt.source,
          [TELEMETRY_ATTRIBUTE_KEYS.TENANT_ID]: context.tenantId,
          [TELEMETRY_ATTRIBUTE_KEYS.APP_ID]: context.appId,
          [TELEMETRY_ATTRIBUTE_KEYS.ENDUSER_ID]: context.userId,
          [TELEMETRY_ATTRIBUTE_KEYS.WORKFLOW_ID]: context.workflowId,
          [TELEMETRY_ATTRIBUTE_KEYS.EXECUTION_ID]: context.executionId,
        },
      },
      async (span) => {
        logger.info("llm.call.started", {
          prompt_template_id: options.request.prompt.templateId,
          prompt_version: options.request.prompt.version,
          prompt_source: options.request.prompt.source,
          temperature: options.request.settings?.temperature,
          max_tokens: options.request.settings?.maxTokens,
        });

        const startedAt = new Date();

        try {
          const providerResult = await options.invoke(options.request);
          const finishedAt = new Date();
          const latencyMs = finishedAt.getTime() - startedAt.getTime();
          const audit = createLlmAuditRecord({
            context,
            provider: options.request.provider,
            model: options.request.model,
            modelEndpoint: options.request.modelEndpoint,
            promptTemplateId: options.request.prompt.templateId,
            promptVersion: options.request.prompt.version,
            promptSource: options.request.prompt.source,
            promptText: options.request.prompt.text,
            responseText: providerResult.responseText,
            usage: normalizeUsage(providerResult.usage),
            cost: providerResult.cost,
            status: "success",
            finishReason: providerResult.finishReason,
            startedAt: startedAt.toISOString(),
            finishedAt: finishedAt.toISOString(),
            latencyMs,
          });

          patchTelemetryContext({
            auditId: audit.record.auditId,
          });

          span.setAttribute(TELEMETRY_ATTRIBUTE_KEYS.PROMPT_HASH, audit.record.promptHash);
          span.setAttribute(TELEMETRY_ATTRIBUTE_KEYS.RESPONSE_HASH, audit.record.responseHash);
          span.setAttribute(TELEMETRY_ATTRIBUTE_KEYS.INPUT_TOKENS, audit.record.inputTokens);
          span.setAttribute(TELEMETRY_ATTRIBUTE_KEYS.OUTPUT_TOKENS, audit.record.outputTokens);
          span.setAttribute(TELEMETRY_ATTRIBUTE_KEYS.TOTAL_TOKENS, audit.record.totalTokens);
          span.setAttribute(TELEMETRY_ATTRIBUTE_KEYS.ESTIMATED_COST_USD, audit.record.estimatedCost);
          span.setAttribute(TELEMETRY_ATTRIBUTE_KEYS.FINISH_REASON, audit.record.finishReason);
          span.setAttribute(TELEMETRY_ATTRIBUTE_KEYS.HTTP_STATUS_CODE, providerResult.httpStatusCode);
          span.addEvent("llm.audit.created", {
            audit_id: audit.record.auditId,
          });

          logger.info("llm.call.completed", {
            audit_id: audit.record.auditId,
            input_tokens: audit.record.inputTokens,
            output_tokens: audit.record.outputTokens,
            total_tokens: audit.record.totalTokens,
            estimated_cost: audit.record.estimatedCost,
            latency_ms: audit.record.latencyMs,
            finish_reason: audit.record.finishReason,
            prompt_preview: audit.record.promptPreview,
            response_preview: audit.record.responsePreview,
          });

          return {
            providerResponse: providerResult.providerResponse,
            usage: normalizeUsage(providerResult.usage),
            cost: providerResult.cost,
            audit,
            trace: {
              traceId: context.traceId,
              spanId: span.spanId,
              requestId: context.requestId,
            },
          };
        } catch (error) {
          const finishedAt = new Date();
          const latencyMs = finishedAt.getTime() - startedAt.getTime();
          const errorCode = extractErrorCode(error);
          const audit = createLlmAuditRecord({
            context,
            provider: options.request.provider,
            model: options.request.model,
            modelEndpoint: options.request.modelEndpoint,
            promptTemplateId: options.request.prompt.templateId,
            promptVersion: options.request.prompt.version,
            promptSource: options.request.prompt.source,
            promptText: options.request.prompt.text,
            usage: {
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
            },
            cost: {
              estimatedUsd: 0,
            },
            status: "error",
            errorCode,
            startedAt: startedAt.toISOString(),
            finishedAt: finishedAt.toISOString(),
            latencyMs,
          });

          patchTelemetryContext({
            auditId: audit.record.auditId,
          });

          span.recordError(error);
          span.setAttribute(TELEMETRY_ATTRIBUTE_KEYS.ERROR_CODE, errorCode);
          span.addEvent("llm.call.failed", {
            audit_id: audit.record.auditId,
          });

          logger.error("llm.call.failed", {
            audit_id: audit.record.auditId,
            error_code: errorCode,
            latency_ms: latencyMs,
            prompt_preview: audit.record.promptPreview,
            error,
          });

          throw new InstrumentedModelInvocationError({
            message: error instanceof Error ? error.message : "Model invocation failed",
            traceId: context.traceId,
            requestId: context.requestId,
            auditId: audit.record.auditId,
            errorCode,
            cause: error,
          });
        }
      },
    ),
  );
}

function normalizeUsage(usage: {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}): {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
} {
  const totalTokens = usage.totalTokens === 0 ? usage.inputTokens + usage.outputTokens : usage.totalTokens;

  return {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens,
  };
}

function extractErrorCode(error: unknown): string {
  if (error instanceof Error && "code" in error && typeof error.code === "string") {
    return error.code;
  }

  return "MODEL_INVOCATION_FAILED";
}
