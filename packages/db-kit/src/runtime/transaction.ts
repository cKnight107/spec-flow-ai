import { sql } from 'kysely';
import type { DbClient, Transaction, TransactionOptions } from '../core/types.js';
import { DbError, mapDbError } from '../core/errors.js';

const SAVEPOINT_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

function assertSavepointName(name: string): void {
  if (!SAVEPOINT_NAME_PATTERN.test(name)) {
    throw new Error(`Invalid savepoint name: ${name}`);
  }
}

function rethrowTransactionError(error: unknown): never {
  if (error instanceof DbError) {
    throw error;
  }

  const candidate = error as { code?: unknown; detail?: unknown; severity?: unknown };
  if (
    typeof candidate.code === 'string' ||
    typeof candidate.detail === 'string' ||
    typeof candidate.severity === 'string'
  ) {
    throw mapDbError(error);
  }

  throw error;
}

/**
 * 在事务中执行异步操作
 *
 * - handler 执行完毕返回后自动 commit
 * - handler 抛出异常时自动 rollback
 * - 事务被外部手动 rollback 时，后续调用将抛出错误
 */
export async function withTransaction<T>(
  client: DbClient,
  handler: (trx: Transaction) => Promise<T>,
  options?: TransactionOptions,
): Promise<T> {
  const isolationLevel = options?.isolationLevel;
  const transactionBuilder = isolationLevel
    ? client.kysely.transaction().setIsolationLevel(isolationLevel as never)
    : client.kysely.transaction();

  return transactionBuilder
    .execute(async (trx) => {
      const transaction: Transaction = {
        kysely: trx as unknown as Transaction['kysely'],
        savepoint: async (name: string) => {
          assertSavepointName(name);
          await sql.raw(`SAVEPOINT ${name}`).execute(trx);
          return transaction;
        },
      };

      return handler(transaction);
    })
    .catch((err) => {
      rethrowTransactionError(err);
    });
}
