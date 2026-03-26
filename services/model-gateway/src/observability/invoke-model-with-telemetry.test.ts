import assert from "node:assert/strict";
import test from "node:test";

import { createJsonLogger, parseJsonLogLine, type JsonObject } from "@enterprise-ai-hub/telemetry-sdk";

import {
  InstrumentedModelInvocationError,
  invokeModelWithTelemetry,
} from "./invoke-model-with-telemetry";
import type { ModelInvocationRequest } from "./types";

test("invokeModelWithTelemetry returns usage, cost and audit metadata", async () => {
  const logLines: string[] = [];
  const logger = createJsonLogger({
    name: "test-model-gateway",
    writer: (line: string) => {
      logLines.push(line);
    },
  });
  const request: ModelInvocationRequest = {
    context: {
      tenantId: "tenant-a",
      appId: "sales-assistant",
      userId: "user-1",
      serviceName: "model-gateway",
      environment: "test",
      workflowId: "wf-sales",
      executionId: "exec-1",
    },
    provider: "openai",
    model: "gpt-4.1",
    prompt: {
      text: "总结用户 test@example.com 的对话",
      source: "template",
      templateId: "sales-summary",
      version: "v1",
    },
  };
  const result = await invokeModelWithTelemetry({
    request,
    logger,
    invoke: async () => ({
      providerResponse: {
        id: "resp-1",
      },
      responseText: "已为用户生成摘要。",
      finishReason: "stop",
      usage: {
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
      },
      cost: {
        estimatedUsd: 0.01,
      },
      httpStatusCode: 200,
    }),
  });

  assert.equal(result.usage.totalTokens, 15);
  assert.equal(result.audit.record.provider, "openai");
  assert.equal(result.audit.record.promptTemplateId, "sales-summary");
  assert.equal(result.audit.record.responsePreview, "已为用户生成摘要。");
  assert.equal(result.trace.traceId.length, 32);

  const completedLog = parseJsonLogLine(logLines[1] ?? "") as JsonObject;
  assert.equal(completedLog.audit_id, result.audit.record.auditId);
  assert.equal(completedLog.trace_id, result.trace.traceId);
});

test("invokeModelWithTelemetry wraps provider failures with trace metadata", async () => {
  const request: ModelInvocationRequest = {
    context: {
      tenantId: "tenant-a",
      appId: "sales-assistant",
      userId: "user-1",
      serviceName: "model-gateway",
      environment: "test",
    },
    provider: "openai",
    model: "gpt-4.1",
    prompt: {
      text: "失败样例",
      source: "inline",
    },
  };

  await assert.rejects(
    invokeModelWithTelemetry({
      request,
      invoke: async () => {
        const error = new Error("upstream failed");
        Object.assign(error, {
          code: "UPSTREAM_TIMEOUT",
        });
        throw error;
      },
    }),
    (error: unknown) => {
      assert.equal(error instanceof InstrumentedModelInvocationError, true);

      if (!(error instanceof InstrumentedModelInvocationError)) {
        return false;
      }

      assert.equal(error.errorCode, "UPSTREAM_TIMEOUT");
      assert.match(error.auditId, /^aud_/);
      assert.equal(error.traceId.length, 32);
      return true;
    },
  );
});
