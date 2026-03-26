import assert from 'node:assert/strict';
import test from 'node:test';

import { DbError, DbErrorCode, mapDbError } from './errors.js';

test('mapDbError keeps DbError instances untouched', () => {
  const error = new DbError('duplicate key', DbErrorCode.UniqueViolation, undefined, false);

  assert.equal(mapDbError(error), error);
});

test('mapDbError maps postgres error codes to normalized error codes', () => {
  const mapped = mapDbError({
    code: '23505',
    message: 'duplicate key value violates unique constraint',
  });

  assert.equal(mapped.code, DbErrorCode.UniqueViolation);
  assert.equal(mapped.retryable, false);
});

test('mapDbError marks serialization and timeout errors as retryable', () => {
  const serialization = mapDbError({
    code: '40001',
    message: 'could not serialize access due to concurrent update',
  });
  const timeout = mapDbError(new Error('Query timeout exceeded'));

  assert.equal(serialization.code, DbErrorCode.SerializationFailure);
  assert.equal(serialization.retryable, true);
  assert.equal(timeout.code, DbErrorCode.QueryTimeout);
  assert.equal(timeout.retryable, true);
});

test('mapDbError detects connection failures from message heuristics', () => {
  const mapped = mapDbError(new Error('connect fail to database host'));

  assert.equal(mapped.code, DbErrorCode.ConnectionFailed);
  assert.equal(mapped.retryable, true);
});

test('mapDbError falls back to unknown for non database errors', () => {
  const mapped = mapDbError(new Error('unexpected boom'));

  assert.equal(mapped.code, DbErrorCode.Unknown);
  assert.equal(mapped.retryable, false);
});
