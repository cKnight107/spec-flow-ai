// Core types, errors, pagination, context
export type {
  DbConnectionConfig,
  DbPoolOptions,
  DbClient,
  IsolationLevel,
  TransactionOptions,
  Transaction,
  HealthCheckResult,
  QueryContext,
  CursorPageInput,
  CursorPageResult,
  BatchWriteResult,
} from './core/types.js';

export { DbErrorCode, DbError, mapDbError } from './core/errors.js';

export {
  encodeCursor,
  decodeCursor,
  normalizePageInput,
  buildPageResult,
} from './core/pagination.js';

export { normalizeQueryContext, contextToComment } from './core/context.js';

// Driver layer
export { createPgClient, closePgClient } from './driver/postgres.js';
export { checkDbHealth } from './driver/health.js';

// Runtime layer
export { createDbClient, closeDbClient, safeClose } from './runtime/client.js';
export { withTransaction } from './runtime/transaction.js';
export { runQuery, runBatch } from './runtime/query.js';

// Testing layer
export {
  createFakeClient,
  type FakeDbClient,
  type FakeClientConfig,
  type CapturedQuery,
} from './testing/fake-client.js';

export {
  createFakeTransaction,
  type FakeTransaction,
  type FakeTransactionConfig,
  type CapturedOperation,
} from './testing/fake-transaction.js';
