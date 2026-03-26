import assert from 'node:assert/strict';
import test from 'node:test';

import { contextToComment, normalizeQueryContext } from './context.js';

test('normalizeQueryContext keeps supported telemetry fields only', () => {
  const context = normalizeQueryContext({
    traceId: 'trace-1',
    tenantId: 'tenant-a',
    requestId: 'request-9',
    appId: 'app-sales',
  });

  assert.deepEqual(context, {
    traceId: 'trace-1',
    tenantId: 'tenant-a',
    requestId: 'request-9',
    appId: 'app-sales',
  });
});

test('contextToComment serializes telemetry fields using SQL comment format', () => {
  const comment = contextToComment({
    traceId: 'trace-1',
    tenantId: 'tenant-a',
    requestId: 'request-9',
    appId: 'app-sales',
  });

  assert.equal(
    comment,
    '/* trace_id=trace-1, tenant_id=tenant-a, request_id=request-9, app_id=app-sales */',
  );
});

test('contextToComment returns empty string for empty input', () => {
  assert.equal(contextToComment(), '');
  assert.equal(contextToComment({}), '');
});
