import assert from "node:assert/strict";
import test from "node:test";

import { createTelemetryContext, runWithTelemetryContext } from "./context";
import { registerSpanSink, withSpan } from "./tracing";

test("withSpan preserves trace id and emits a completed span record", async () => {
  const records: Array<{ traceId: string; parentSpanId?: string; spanId: string; name: string }> = [];
  const context = createTelemetryContext({
    tenantId: "tenant-a",
    appId: "app-sales",
    userId: "user-1",
    serviceName: "model-gateway",
    environment: "test",
  });
  const unregister = registerSpanSink((record) => {
    records.push({
      traceId: record.traceId,
      parentSpanId: record.parentSpanId,
      spanId: record.spanId,
      name: record.name,
    });
  });

  await runWithTelemetryContext(context, async () => {
    await withSpan(
      {
        name: "llm.call",
      },
      async () => undefined,
    );
  });

  unregister();

  assert.equal(records.length, 1);
  assert.equal(records[0]?.traceId, context.traceId);
  assert.equal(records[0]?.parentSpanId, context.spanId);
  assert.notEqual(records[0]?.spanId, context.spanId);
  assert.equal(records[0]?.name, "llm.call");
});
