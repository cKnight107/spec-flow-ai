import type { DbClient } from '../core/types.js';
import { createPgClient, closePgClient } from '../driver/postgres.js';

export { createPgClient as createDbClient, closePgClient as closeDbClient };

/**
 * 安全关闭客户端，忽略关闭过程中的错误
 */
export async function safeClose(client: DbClient): Promise<void> {
  try {
    await closePgClient(client);
  } catch {
    // 连接池关闭时的错误不应阻断调用方
  }
}
