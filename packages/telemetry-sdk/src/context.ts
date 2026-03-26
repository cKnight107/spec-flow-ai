import { AsyncLocalStorage } from "node:async_hooks";

import type { TelemetryContext, TelemetryContextInput } from "./types";
import { generateRequestId, generateSpanId, generateTraceId, nowIsoString } from "./utils";

const telemetryContextStorage = new AsyncLocalStorage<TelemetryContext>();

export function createTelemetryContext(input: TelemetryContextInput): TelemetryContext {
  return {
    traceId: input.traceId ?? generateTraceId(),
    spanId: input.spanId ?? generateSpanId(),
    requestId: input.requestId ?? generateRequestId(),
    tenantId: input.tenantId,
    appId: input.appId,
    userId: input.userId,
    serviceName: input.serviceName,
    environment: input.environment,
    timestamp: input.timestamp ?? nowIsoString(),
    sessionId: input.sessionId,
    conversationId: input.conversationId,
    workflowId: input.workflowId,
    executionId: input.executionId,
    toolCallId: input.toolCallId,
    auditId: input.auditId,
  };
}

export function getTelemetryContext(): TelemetryContext | undefined {
  return telemetryContextStorage.getStore();
}

export function requireTelemetryContext(): TelemetryContext {
  const context = getTelemetryContext();

  if (context === undefined) {
    throw new Error("Telemetry context is not available");
  }

  return context;
}

export function runWithTelemetryContext<T>(context: TelemetryContext, callback: () => T): T {
  return telemetryContextStorage.run(context, callback);
}

export function withTelemetryContext<T>(
  input: TelemetryContextInput,
  callback: (context: TelemetryContext) => T,
): T {
  const context = createTelemetryContext(input);
  return runWithTelemetryContext(context, () => callback(context));
}

export function createChildTelemetryContext(
  parent: TelemetryContext,
  overrides?: Partial<Omit<TelemetryContext, "traceId" | "requestId" | "tenantId" | "appId" | "userId">>,
): TelemetryContext {
  return {
    ...parent,
    spanId: overrides?.spanId ?? generateSpanId(),
    timestamp: overrides?.timestamp ?? nowIsoString(),
    serviceName: overrides?.serviceName ?? parent.serviceName,
    environment: overrides?.environment ?? parent.environment,
    sessionId: overrides?.sessionId ?? parent.sessionId,
    conversationId: overrides?.conversationId ?? parent.conversationId,
    workflowId: overrides?.workflowId ?? parent.workflowId,
    executionId: overrides?.executionId ?? parent.executionId,
    toolCallId: overrides?.toolCallId ?? parent.toolCallId,
    auditId: overrides?.auditId ?? parent.auditId,
  };
}

export function patchTelemetryContext(
  patch: Partial<Omit<TelemetryContext, "traceId" | "requestId" | "tenantId" | "appId" | "userId">>,
): TelemetryContext {
  const current = requireTelemetryContext();
  const next = {
    ...current,
    ...patch,
  };

  telemetryContextStorage.enterWith(next);
  return next;
}

export function ensureTelemetryContext(input: Partial<TelemetryContextInput> = {}): TelemetryContext {
  const current = getTelemetryContext();

  if (current !== undefined) {
    return {
      ...current,
      ...input,
      traceId: current.traceId,
      requestId: current.requestId,
      tenantId: current.tenantId,
      appId: current.appId,
      userId: current.userId,
      spanId: input.spanId ?? current.spanId,
      timestamp: input.timestamp ?? current.timestamp,
    };
  }

  return createTelemetryContext({
    tenantId: input.tenantId ?? "unknown-tenant",
    appId: input.appId ?? "unknown-app",
    userId: input.userId ?? "anonymous",
    serviceName: input.serviceName ?? "unknown-service",
    environment: input.environment ?? "local",
    sessionId: input.sessionId,
    conversationId: input.conversationId,
    workflowId: input.workflowId,
    executionId: input.executionId,
    toolCallId: input.toolCallId,
    auditId: input.auditId,
    traceId: input.traceId,
    spanId: input.spanId,
    requestId: input.requestId,
    timestamp: input.timestamp,
  });
}
