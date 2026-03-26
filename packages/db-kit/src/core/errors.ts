/**
 * 数据库错误分类
 */
export enum DbErrorCode {
  /** 唯一键冲突 */
  UniqueViolation = 'UNIQUE_VIOLATION',
  /** 外键约束失败 */
  ForeignKeyViolation = 'FOREIGN_KEY_VIOLATION',
  /** 非空约束 */
  NotNullViolation = 'NOT_NULL_VIOLATION',
  /** 连接失败 */
  ConnectionFailed = 'CONNECTION_FAILED',
  /** 连接超时 */
  ConnectionTimeout = 'CONNECTION_TIMEOUT',
  /** 查询超时 */
  QueryTimeout = 'QUERY_TIMEOUT',
  /** 事务序列化失败（可重试） */
  SerializationFailure = 'SERIALIZATION_FAILURE',
  /** 死锁检测 */
  DeadlockDetected = 'DEADLOCK_DETECTED',
  /** 未知错误 */
  Unknown = 'UNKNOWN',
}

/**
 * 归一化后的数据库错误
 */
export class DbError extends Error {
  constructor(
    message: string,
    public readonly code: DbErrorCode,
    public readonly originalError?: unknown,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = 'DbError';
  }
}

/** pg 错误码到 DbErrorCode 的映射 */
const PG_ERROR_MAP: Record<string, DbErrorCode> = {
  '23505': DbErrorCode.UniqueViolation,
  '23503': DbErrorCode.ForeignKeyViolation,
  '23502': DbErrorCode.NotNullViolation,
  '40001': DbErrorCode.SerializationFailure,
  '40P01': DbErrorCode.DeadlockDetected,
};

/** 可重试的错误码 */
const RETRYABLE_CODES = new Set<DbErrorCode>([
  DbErrorCode.SerializationFailure,
  DbErrorCode.DeadlockDetected,
  DbErrorCode.ConnectionTimeout,
  DbErrorCode.QueryTimeout,
]);

/**
 * 将底层数据库错误归一化为 DbError
 */
export function mapDbError(error: unknown): DbError {
  if (error instanceof DbError) {
    return error;
  }

  const pgError = error as { code?: string; message?: string };
  const code = pgError.code ? PG_ERROR_MAP[pgError.code] : undefined;

  if (code) {
    return new DbError(
      pgError.message ?? `Database error: ${code}`,
      code,
      error,
      RETRYABLE_CODES.has(code),
    );
  }

  const message = (pgError.message ?? '').toLowerCase();

  if (message.includes('connect') && message.includes('fail')) {
    return new DbError(
      pgError.message ?? 'Connection failed',
      DbErrorCode.ConnectionFailed,
      error,
      true,
    );
  }

  if (message.includes('timeout')) {
    return new DbError(
      pgError.message ?? 'Query timeout',
      DbErrorCode.QueryTimeout,
      error,
      true,
    );
  }

  return new DbError(
    pgError.message ?? 'Unknown database error',
    DbErrorCode.Unknown,
    error,
    false,
  );
}
