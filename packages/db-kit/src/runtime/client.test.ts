import assert from 'node:assert/strict';
import test from 'node:test';

import { createFakeClient } from '../testing/fake-client.js';
import { closeDbClient, safeClose } from './client.js';

test('closeDbClient updates fake client closed state', async () => {
  const client = createFakeClient();

  assert.equal(client.closed, false);

  await closeDbClient(client);

  assert.equal(client.closed, true);
});

test('safeClose swallows pool end failures', async () => {
  const client = createFakeClient();
  client.pool.end = async () => {
    throw new Error('close failed');
  };

  await assert.doesNotReject(async () => {
    await safeClose(client);
  });
});
