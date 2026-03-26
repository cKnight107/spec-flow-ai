import pg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import type { DbClient, DbConnectionConfig, DbPoolOptions } from '../core/types.js';

const DEFAULT_POOL: Required<DbPoolOptions> = {
  max: 10,
  idleTimeoutMs: 30_000,
  connectionTimeoutMs: 5_000,
};

const CLIENT_CLOSERS = new WeakMap<DbClient, () => void>();

/**
 * 基于 pg + kysely 创建数据库客户端
 */
export function createPgClient(config: DbConnectionConfig): DbClient {
  const poolOpts = { ...DEFAULT_POOL, ...config.pool };

  const pool = new pg.Pool({
    connectionString: config.connectionString,
    max: poolOpts.max,
    idleTimeoutMillis: poolOpts.idleTimeoutMs,
    connectionTimeoutMillis: poolOpts.connectionTimeoutMs,
  });

  const dialect = new PostgresDialect({ pool });
  const kysely = new Kysely<unknown>({ dialect });

  let closed = false;

  const client: DbClient = {
    get kysely() {
      return kysely;
    },
    get pool() {
      return pool;
    },
    get closed() {
      return closed;
    },
  };

  CLIENT_CLOSERS.set(client, () => {
    closed = true;
  });

  return client;
}

/**
 * 关闭数据库客户端（排空连接池）
 */
export async function closePgClient(client: DbClient): Promise<void> {
  if (client.closed) return;
  await client.pool.end();
  CLIENT_CLOSERS.get(client)?.();
}
