import type { DbClient, HealthCheckResult } from '../core/types.js';

/**
 * fake client 的行为配置
 */
export interface FakeClientConfig {
  /** 模拟查询返回结果 */
  queryResults?: unknown[];
  /** 模拟查询抛出的错误 */
  queryError?: Error;
  /** 模拟健康检查结果 */
  healthResult?: HealthCheckResult;
  /** 跟踪所有调用的 sql 语句 */
  captureQueries?: boolean;
}

/**
 * 被捕获的查询记录
 */
export interface CapturedQuery {
  sql: string;
  params?: unknown[];
}

/**
 * 创建 fake db client，用于单元测试，不连接真实数据库
 *
 * 使用方式：
 * ```ts
 * const fake = createFakeClient({
 *   queryResults: [{ id: 1, name: 'test' }],
 * });
 *
 * const rows = await runQuery(fake, 'SELECT * FROM users');
 * // rows === [{ id: 1, name: 'test' }]
 * ```
 */
export function createFakeClient(config: FakeClientConfig = {}): FakeDbClient {
  const queries: CapturedQuery[] = [];
  let closed = false;

  const execute = async (sql: string, params?: unknown[]) => {
    if (config.captureQueries) {
      queries.push({ sql, params });
    }

    if (sql === 'SELECT 1' && config.healthResult) {
      if (!config.healthResult.ok) {
        throw new Error(config.healthResult.error ?? 'Database health check failed');
      }

      return {
        rows: [{ ok: 1 }],
        rowCount: 1,
      };
    }

    if (config.queryError) {
      throw config.queryError;
    }

    return {
      rows: config.queryResults ?? [],
      rowCount: (config.queryResults ?? []).length,
    };
  };

  const fakePool = {
    query: execute,
    connect: async () => {
      return {
        query: execute,
        release: () => {},
      };
    },
    end: async () => {
      closed = true;
    },
  } as unknown as import('pg').Pool;

  return {
    kysely: {} as unknown as DbClient['kysely'],
    pool: fakePool,
    get closed() {
      return closed;
    },
    close: () => {
      closed = true;
    },
    queries,
  };
}

export interface FakeDbClient extends DbClient {
  close: () => void;
  queries: CapturedQuery[];
}
