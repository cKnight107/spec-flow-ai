import type { QueryContext } from './types.js';

/**
 * 从 telemetry-sdk 或调用方获取链路上下文
 */
export function normalizeQueryContext(input?: QueryContext): QueryContext {
  return {
    traceId: input?.traceId,
    tenantId: input?.tenantId,
    requestId: input?.requestId,
    appId: input?.appId,
  };
}

/**
 * 将 QueryContext 附加为 SQL 查询注释，便于数据库审计
 *
 * PostgreSQL 支持在 SQL 语句中添加注释来传递元信息。
 */
export function contextToComment(context?: QueryContext): string {
  if (!context) return '';

  const fields: string[] = [];
  if (context.traceId) fields.push(`trace_id=${context.traceId}`);
  if (context.tenantId) fields.push(`tenant_id=${context.tenantId}`);
  if (context.requestId) fields.push(`request_id=${context.requestId}`);
  if (context.appId) fields.push(`app_id=${context.appId}`);

  if (fields.length === 0) return '';

  return `/* ${fields.join(', ')} */`;
}
