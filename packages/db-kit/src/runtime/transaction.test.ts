import assert from 'node:assert/strict';
import test from 'node:test';

import type { DbClient, Transaction } from '../core/types.js';
import { DbError, DbErrorCode } from '../core/errors.js';
import { withTransaction } from './transaction.js';

interface MockTransactionBuilder {
  setIsolationLevel: (level: string) => MockTransactionBuilder;
  execute: <T>(handler: (trx: unknown) => Promise<T>) => Promise<T>;
}

function createMockClient(options?: {
  executeError?: unknown;
  onIsolationLevel?: (level: string) => void;
}): DbClient {
  const builder: MockTransactionBuilder = {
    setIsolationLevel(level: string) {
      options?.onIsolationLevel?.(level);
      return builder;
    },
    async execute<T>(handler: (trx: unknown) => Promise<T>): Promise<T> {
      if (options?.executeError) {
        throw options.executeError;
      }

      return handler({});
    },
  };

  return {
    kysely: {
      transaction: () => builder,
    } as unknown as DbClient['kysely'],
    pool: {} as DbClient['pool'],
    closed: false,
  };
}

test('withTransaction passes through isolation level and returns handler result', async () => {
  let isolationLevel = '';
  const client = createMockClient({
    onIsolationLevel(level) {
      isolationLevel = level;
    },
  });

  const result = await withTransaction(
    client,
    async (trx: Transaction) => {
      assert.ok(trx.kysely);
      return 'ok';
    },
    { isolationLevel: 'serializable' },
  );

  assert.equal(result, 'ok');
  assert.equal(isolationLevel, 'serializable');
});

test('withTransaction preserves non database errors from handler', async () => {
  const client = createMockClient();

  await assert.rejects(
    async () => {
      await withTransaction(client, async () => {
        throw new Error('domain failure');
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.ok(!(err instanceof DbError));
      assert.equal(err.message, 'domain failure');
      return true;
    },
  );
});

test('withTransaction maps database-looking errors into DbError', async () => {
  const client = createMockClient({
    executeError: {
      code: '23505',
      message: 'duplicate key',
    },
  });

  await assert.rejects(
    async () => {
      await withTransaction(client, async () => 'never');
    },
    (err: unknown) => {
      assert.ok(err instanceof DbError);
      assert.equal(err.code, DbErrorCode.UniqueViolation);
      return true;
    },
  );
});
