/**
 * 数据库连接配置
 */
export interface DbConnectionConfig {
  connectionString: string;
  pool?: DbPoolOptions;
}

/**
 * 连接池参数
 */
export interface DbPoolOptions {
  /** 最大连接数，默认 10 */
  max?: number;
  /** 连接空闲超时（ms），默认 30000 */
  idleTimeoutMs?: number;
  /** 连接超时（ms），默认 5000 */
  connectionTimeoutMs?: number;
}

/**
 * 数据库客户端句柄
 */
export interface DbClient {
  /** 底层 kysely 实例 */
  readonly kysely: import('kysely').Kysely<unknown>;
  /** 底层 pg Pool */
  readonly pool: import('pg').Pool;
  /** 是否已关闭 */
  readonly closed: boolean;
}

/**
 * 事务隔离级别
 */
export type IsolationLevel = 'read committed' | 'repeatable read' | 'serializable';

/**
 * 事务选项
 */
export interface TransactionOptions {
  isolationLevel?: IsolationLevel;
}

/**
 * 事务句柄，可在事务内执行查询
 */
export interface Transaction {
  readonly kysely: import('kysely').Kysely<unknown>;
  readonly savepoint: (name: string) => Promise<Transaction>;
}

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

/**
 * 查询上下文，支持链路上下文透传
 */
export interface QueryContext {
  traceId?: string;
  tenantId?: string;
  requestId?: string;
  appId?: string;
}

/**
 * 游标分页输入
 */
export interface CursorPageInput {
  cursor?: string;
  limit: number;
}

/**
 * 游标分页结果
 */
export interface CursorPageResult<T> {
  items: T[];
  nextCursor?: string;
}

/**
 * 批量写入结果
 */
export interface BatchWriteResult {
  affectedRows: number;
}
