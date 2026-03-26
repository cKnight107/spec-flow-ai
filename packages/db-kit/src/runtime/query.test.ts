import assert from 'node:assert/strict';
import test from 'node:test';

import { DbError, DbErrorCode } from '../core/errors.js';
import { createFakeClient } from '../testing/fake-client.js';
import { runBatch, runQuery } from './query.js';

test('runQuery appends query context comment and returns rows', async () => {
  const client = createFakeClient({
    captureQueries: true,
    queryResults: [{ id: 1, name: 'Alice' }],
  });

  const rows = await runQuery<{ id: number; name: string }>(
    client,
    'select * from users where id = $1',
    [1],
    {
      traceId: 'trace-1',
      tenantId: 'tenant-a',
    },
  );

  assert.deepEqual(rows, [{ id: 1, name: 'Alice' }]);
  assert.equal(
    client.queries[0]?.sql,
    '/* trace_id=trace-1, tenant_id=tenant-a */ select * from users where id = $1',
  );
});

test('runBatch executes all statements on a single fake connection', async () => {
  const client = createFakeClient({
    captureQueries: true,
    queryResults: [{ id: 1 }, { id: 2 }],
  });

  const result = await runBatch(
    client,
    [
      { sql: 'insert into users(id) values($1)', params: [1] },
      { sql: 'insert into users(id) values($1)', params: [2] },
    ],
    { requestId: 'req-1' },
  );

  assert.equal(result.affectedRows, 4);
  assert.equal(client.queries.length, 2);
  assert.equal(
    client.queries[0]?.sql,
    '/* request_id=req-1 */ insert into users(id) values($1)',
  );
});

test('runQuery maps database errors into DbError', async () => {
  const error = Object.assign(new Error('duplicate key'), { code: '23505' });
  const client = createFakeClient({ queryError: error });

  await assert.rejects(
    async () => {
      await runQuery(client, 'select 1');
    },
    (err: unknown) => {
      assert.ok(err instanceof DbError);
      assert.equal(err.code, DbErrorCode.UniqueViolation);
      return true;
    },
  );
});
