import assert from 'node:assert/strict';
import test from 'node:test';

import { createFakeClient } from '../testing/fake-client.js';
import { checkDbHealth } from './health.js';

test('checkDbHealth returns ok=true for healthy fake clients', async () => {
  const client = createFakeClient({
    healthResult: {
      ok: true,
      latencyMs: 3,
    },
  });

  const result = await checkDbHealth(client);

  assert.equal(result.ok, true);
  assert.equal(typeof result.latencyMs, 'number');
});

test('checkDbHealth returns ok=false when fake client health is configured as failed', async () => {
  const client = createFakeClient({
    healthResult: {
      ok: false,
      latencyMs: 3,
      error: 'database unavailable',
    },
  });

  const result = await checkDbHealth(client);

  assert.equal(result.ok, false);
  assert.equal(result.error, 'database unavailable');
});
