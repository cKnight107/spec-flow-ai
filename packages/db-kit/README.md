# db-kit

共享数据库基础设施包，提供 PostgreSQL 连接管理、事务封装、错误归一化、分页 helper 与测试替身能力。

## 能力范围

- **连接管理**：`createDbClient` / `closeDbClient`，基于 `pg` 连接池
- **健康检查**：`checkDbHealth`
- **事务 helper**：`withTransaction`，覆盖提交、回滚、异常路径
- **错误归一化**：`mapDbError`，统一唯一键冲突、连接失败、超时等错误
- **游标分页**：`encodeCursor` / `decodeCursor`
- **链路上下文**：支持 `trace_id`、`tenant_id` 等字段透传
- **测试工具**：fake client / fake transaction，无需真实数据库

## 使用边界

| 用途 | 是否支持 |
|------|----------|
| 连接池与事务管理 | ✅ |
| 类型安全查询构建（kysely） | ✅ |
| 业务表 CRUD | ❌（由各服务 Repository 负责） |
| 数据库迁移/DDL | ❌（由 `database/` 负责） |
| 通用 ORM | ❌ |

## 技术栈

- 底层驱动：`pg`
- 查询构建：`kysely`
- 可观测：默认兼容 `@enterprise-ai-hub/telemetry-sdk` 的上下文字段，当前通过查询注释透传 `trace_id`、`tenant_id`、`request_id`、`app_id`

## 快速使用

```typescript
import {
  checkDbHealth,
  closeDbClient,
  createDbClient,
  runQuery,
  withTransaction,
} from '@enterprise-ai-hub/db-kit';

const client = createDbClient({
  connectionString: process.env.DATABASE_URL,
  pool: {
    max: 20,
    idleTimeoutMs: 30_000,
    connectionTimeoutMs: 5_000,
  },
});

const health = await checkDbHealth(client);
if (!health.ok) {
  throw new Error(`database unavailable: ${health.error ?? 'unknown error'}`);
}

const users = await runQuery<{ id: string; email: string }>(
  client,
  'select id, email from users where tenant_id = $1 order by created_at desc limit $2',
  ['tenant-a', 20],
  {
    traceId: 'trace-001',
    tenantId: 'tenant-a',
    requestId: 'req-001',
    appId: 'portal-web',
  },
);

const result = await withTransaction(client, async (trx) => {
  await trx.savepoint('before_user_insert');
  return {
    inserted: users.length,
  };
});

console.log(result.inserted);

await closeDbClient(client);
```

## 适用场景

- 需要在多个 `services/*` 中复用 PostgreSQL 连接池与事务边界
- 需要统一数据库错误归一化，避免业务代码散落 `pg` 错误码判断
- 需要在 SQL 执行路径中附带 `trace_id`、`tenant_id`、`request_id`
- 需要不连接真实数据库也能测试 Repository 或基础设施代码

## 核心 API

| API | 作用 | 典型场景 |
|------|------|----------|
| `createDbClient(config)` | 创建 `pg + kysely` 客户端 | 服务启动时初始化数据库连接 |
| `closeDbClient(client)` | 关闭连接池 | 服务关闭、测试清理 |
| `safeClose(client)` | 忽略关闭异常的安全关闭 | `finally` 清理阶段 |
| `checkDbHealth(client)` | 执行 `SELECT 1` 健康检查 | readiness / 启动自检 |
| `withTransaction(client, handler, options)` | 包装事务提交与回滚 | 多条写操作原子执行 |
| `runQuery(client, sql, params, context)` | 执行单条 SQL 并附带上下文注释 | 简单读查询、临时 SQL |
| `runBatch(client, statements, context)` | 串行执行多条写语句 | 小批量写入、批处理 |
| `mapDbError(error)` | 归一化数据库异常 | 统一异常映射与重试判断 |
| `encodeCursor` / `decodeCursor` | 游标编解码 | 游标分页 API |
| `createFakeClient()` | 提供 fake 数据库客户端 | 单元测试 |
| `createFakeTransaction()` | 提供 fake 事务对象 | 测试事务内逻辑 |

## 使用示例

### 1. 初始化与健康检查

```typescript
import { checkDbHealth, createDbClient, safeClose } from '@enterprise-ai-hub/db-kit';

const db = createDbClient({
  connectionString: process.env.DATABASE_URL!,
});

try {
  const health = await checkDbHealth(db);
  if (!health.ok) {
    throw new Error(`database not ready: ${health.error ?? 'unknown error'}`);
  }
} finally {
  await safeClose(db);
}
```

### 2. 执行带链路上下文的查询

```typescript
import { runQuery } from '@enterprise-ai-hub/db-kit';

const rows = await runQuery<{ id: string; name: string }>(
  db,
  'select id, name from users where tenant_id = $1 order by created_at desc limit $2',
  ['tenant-a', 10],
  {
    traceId: 'trace-001',
    tenantId: 'tenant-a',
    requestId: 'req-001',
    appId: 'admin-console',
  },
);
```

上面的 `context` 会被转成 SQL 注释并挂到语句前缀，便于数据库侧审计和链路排查。

### 3. 事务封装

```typescript
import { withTransaction } from '@enterprise-ai-hub/db-kit';

await withTransaction(
  db,
  async (trx) => {
    await trx.savepoint('before_create_order');

    // 这里通常继续调用服务内自己的 Repository。
    // Repository 可以接受 trx.kysely 继续组织查询。
    await orderRepository.create(trx.kysely, orderInput);
    await orderAuditRepository.append(trx.kysely, auditLog);
  },
  {
    isolationLevel: 'serializable',
  },
);
```

`withTransaction` 负责提交和回滚。若底层抛出数据库错误，会被归一化为 `DbError`；若是业务异常，则保持原样抛出。

### 4. 批量写入

```typescript
import { runBatch } from '@enterprise-ai-hub/db-kit';

const batch = await runBatch(
  db,
  [
    {
      sql: 'insert into user_tags(user_id, tag) values($1, $2)',
      params: ['user-1', 'alpha'],
    },
    {
      sql: 'insert into user_tags(user_id, tag) values($1, $2)',
      params: ['user-1', 'beta'],
    },
  ],
  {
    traceId: 'trace-002',
    tenantId: 'tenant-a',
  },
);

console.log(batch.affectedRows);
```

`runBatch` 适合小批量顺序写入。更复杂的大批量场景，建议在 `withTransaction` 内部分批执行。

### 5. 游标分页

```typescript
import {
  buildPageResult,
  decodeCursor,
  encodeCursor,
  normalizePageInput,
} from '@enterprise-ai-hub/db-kit';

const input = normalizePageInput({
  cursor: undefined,
  limit: 20,
});

const page = buildPageResult(
  [
    { id: 1, createdAt: '2026-03-15T10:00:00.000Z' },
    { id: 2, createdAt: '2026-03-15T10:01:00.000Z' },
    { id: 3, createdAt: '2026-03-15T10:02:00.000Z' },
  ],
  input.limit,
  'createdAt',
  'id',
);

const next = page.nextCursor ? decodeCursor(page.nextCursor) : undefined;
const cursor = encodeCursor({ value: '2026-03-15T10:01:00.000Z', tieBreaker: 2 });
```

推荐调用方式是“多取一条”后交给 `buildPageResult` 构造 `nextCursor`。

### 6. 单元测试中使用 fake client

```typescript
import assert from 'node:assert/strict';
import test from 'node:test';

import { createFakeClient, runQuery } from '@enterprise-ai-hub/db-kit';

test('repository maps rows', async () => {
  const db = createFakeClient({
    captureQueries: true,
    queryResults: [{ id: 'user-1', name: 'Alice' }],
  });

  const rows = await runQuery<{ id: string; name: string }>(
    db,
    'select id, name from users where id = $1',
    ['user-1'],
  );

  assert.equal(rows[0]?.name, 'Alice');
  assert.equal(db.queries[0]?.sql, 'select id, name from users where id = $1');
});
```

## 详细说明

### 错误模型

`mapDbError` 会把常见 PostgreSQL 错误码映射为统一的 `DbError`：

- `23505` -> `UNIQUE_VIOLATION`
- `23503` -> `FOREIGN_KEY_VIOLATION`
- `23502` -> `NOT_NULL_VIOLATION`
- `40001` -> `SERIALIZATION_FAILURE`
- `40P01` -> `DEADLOCK_DETECTED`

其中序列化失败、死锁、超时类错误会标记为 `retryable = true`，便于调用方决定是否重试。

### 上下文字段透传

`db-kit` 当前兼容以下上下文字段：

- `traceId`
- `tenantId`
- `requestId`
- `appId`

这些字段会被格式化成 SQL 注释：

```sql
/* trace_id=trace-001, tenant_id=tenant-a, request_id=req-001, app_id=portal-web */
select id, email from users where tenant_id = $1
```

当前实现重点是兼容 `telemetry-sdk` 的字段命名与执行路径，不负责日志采集、span 管理或审计事件落库。

### 推荐接入方式

推荐在服务内部按下面的层次使用：

1. 服务启动阶段创建单例 `DbClient`
2. Repository 层接收 `DbClient` 或 `trx.kysely`
3. 应用服务层决定是否开启事务
4. 业务表结构、DDL、迁移和种子仍放在 `database/`

这样可以保持 `db-kit` 只承担基础设施职责，不侵入业务建模。

## 与 `pg` / `kysely` 的边界

- `db-kit` 负责连接池、事务边界、错误归一化、游标分页和最小测试替身
- `kysely` 仍由调用方在服务内部组织具体查询与 Repository 逻辑
- `pg` 仍是底层驱动实现细节，调用方不应在服务代码里重复创建连接池
- `db-kit` 不提供通用表 CRUD，也不持有业务 schema、迁移或种子
