import type { DbClient, HealthCheckResult } from '../core/types.js';

/**
 * 执行数据库健康检查
 *
 * 通过 SELECT 1 验证连接可用性，返回延迟与状态。
 */
export async function checkDbHealth(client: DbClient): Promise<HealthCheckResult> {
  const start = performance.now();

  try {
    await client.pool.query('SELECT 1');
    const latencyMs = Math.round(performance.now() - start);
    return { ok: true, latencyMs };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, latencyMs, error: message };
  }
}
