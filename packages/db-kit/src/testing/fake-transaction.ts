import type { Transaction } from '../core/types.js';

/**
 * fake transaction 的行为配置
 */
export interface FakeTransactionConfig {
  /** 模拟查询返回结果 */
  queryResults?: unknown[];
  /** 模拟查询抛出的错误 */
  queryError?: Error;
  /** 是否在创建 savepoint 时抛出错误 */
  failOnSavepoint?: boolean;
}

/**
 * 被捕获的事务操作
 */
export interface CapturedOperation {
  type: 'query' | 'savepoint';
  sql?: string;
  params?: unknown[];
  name?: string;
}

/**
 * 创建 fake transaction，用于单元测试
 *
 * 使用方式：
 * ```ts
 * const { transaction, operations } = createFakeTransaction({
 *   queryResults: [{ id: 1 }],
 * });
 *
 * // 传给被测代码
 * await someService.createUser(transaction, { name: 'test' });
 *
 * // 验证操作序列
 * expect(operations).toHaveLength(1);
 * expect(operations[0].type).toBe('query');
 * ```
 */
export function createFakeTransaction(
  config: FakeTransactionConfig = {},
): { transaction: FakeTransaction; operations: CapturedOperation[] } {
  const operations: CapturedOperation[] = [];

  const transaction: FakeTransaction = {
    kysely: {} as unknown as Transaction['kysely'],
    savepoint: async (name: string) => {
      if (config.failOnSavepoint) {
        throw new Error(`Savepoint ${name} failed`);
      }
      operations.push({ type: 'savepoint', name });
      return transaction;
    },
    executeQuery: async (sql: string, params?: unknown[]) => {
      operations.push({ type: 'query', sql, params });
      if (config.queryError) {
        throw config.queryError;
      }
      return config.queryResults ?? [];
    },
  };

  return { transaction, operations };
}

export interface FakeTransaction extends Transaction {
  executeQuery: (sql: string, params?: unknown[]) => Promise<unknown[]>;
}
