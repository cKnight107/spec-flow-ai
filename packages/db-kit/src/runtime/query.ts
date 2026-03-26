import type { DbClient, QueryContext, BatchWriteResult } from '../core/types.js';
import { mapDbError } from '../core/errors.js';
import { contextToComment } from '../core/context.js';

/**
 * 执行单条查询，可附带链路上下文
 */
export async function runQuery<T>(
  client: DbClient,
  sql: string,
  params?: unknown[],
  context?: QueryContext,
): Promise<T[]> {
  const comment = contextToComment(context);
  const fullSql = comment ? `${comment} ${sql}` : sql;

  try {
    const result = await client.pool.query(fullSql, params as never[]);
    return result.rows as T[];
  } catch (err) {
    throw mapDbError(err);
  }
}

/**
 * 批量执行写入语句
 *
 * 使用单连接执行多条语句，适合小批量写入。
 * 大批量场景建议在 withTransaction 内分批执行。
 */
export async function runBatch(
  client: DbClient,
  statements: Array<{ sql: string; params?: unknown[] }>,
  context?: QueryContext,
): Promise<BatchWriteResult> {
  let affectedRows = 0;

  try {
    const poolClient = await client.pool.connect();
    try {
      const comment = contextToComment(context);

      for (const stmt of statements) {
        const fullSql = comment ? `${comment} ${stmt.sql}` : stmt.sql;
        const result = await poolClient.query(fullSql, stmt.params as never[]);
        affectedRows += result.rowCount ?? 0;
      }
    } finally {
      poolClient.release();
    }
  } catch (err) {
    throw mapDbError(err);
  }

  return { affectedRows };
}
