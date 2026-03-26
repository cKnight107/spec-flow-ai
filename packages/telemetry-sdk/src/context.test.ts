import assert from "node:assert/strict";
import test from "node:test";

import { createTelemetryContext, getTelemetryContext, runWithTelemetryContext } from "./context";

test("runWithTelemetryContext stores and exposes the current request context", () => {
  const context = createTelemetryContext({
    tenantId: "tenant-a",
    appId: "app-sales",
    userId: "user-1",
    serviceName: "model-gateway",
    environment: "test",
  });

  assert.equal(getTelemetryContext(), undefined);

  runWithTelemetryContext(context, () => {
    assert.deepEqual(getTelemetryContext(), context);
  });

  assert.equal(getTelemetryContext(), undefined);
});
