# 015 Cache Kit

## 目标
建立统一的 Redis 缓存基础设施共享包，收敛连接初始化、键命名规范、序列化、TTL、分布式锁与基础可观测能力，避免各服务各自封装一套缓存访问代码。

## 适用范围
- `services/*` 中需要使用 Redis 做缓存、会话态、短期状态或协调锁的服务
- `integrations/*` 中需要临时缓存上游结果或限流状态的适配器
- `tests/*` 中需要 fake cache client 的测试代码

## 范围
- Redis client 创建与生命周期管理
- Key namespace / key builder 规范
- JSON 与文本序列化 helper
- TTL 与过期策略 helper
- 分布式锁与幂等 key helper
- 健康检查与基础指标挂载点
- 测试替身与最小断言工具

## 非目标
- 不承载业务缓存模型与缓存失效策略的业务决策
- 不负责消息队列、Stream 消费组等复杂消息语义
- 不直接承担会话领域、工作流领域或审批领域的业务状态机
- 不将 Redis 作为通用数据库替代品暴露给业务层

## 输入依据
- [docs/rules/architecture-boundaries.md](docs/rules/architecture-boundaries.md)
- [docs/rules/code-style.md](docs/rules/code-style.md)
- [docs/architecture/data-model.md](docs/architecture/data-model.md)

## 设计原则
- 约定优先：统一 key 前缀、编码规则与 TTL 表达方式
- 最小惊讶：默认操作语义应清晰，不隐藏过期、覆盖和锁释放行为
- 成熟生态优先：优先使用社区成熟、维护稳定的 Redis 客户端与常见封装模式，不自研底层协议实现
- 可观测：缓存命中、未命中、加锁失败等结果应可被上层记录
- 安全保守：默认不缓存敏感明文，必要时要求调用方显式声明
- 渐进扩展：先覆盖 KV、TTL、锁，再视需要扩展到更复杂能力

## 术语
- `namespace`：缓存 key 的逻辑命名空间
- `ttl`：缓存过期时间，统一使用秒或毫秒的显式类型
- `lock token`：锁持有者标识，用于安全释放锁
- `cache codec`：缓存值的编解码器

## 设计约束
- 共享实现落在 `packages/cache-kit`
- 包内不得包含具体业务 key 模板常量与业务缓存策略
- 业务侧必须在自身模块内定义缓存键与回源规则
- 需保留与 `packages/telemetry-sdk` 对接的埋点入口
- 首版实现优先基于成熟 Redis 客户端，不自建底层 Redis 连接与协议处理

## 推荐技术组合
- Redis 客户端：`ioredis`
- NestJS 接入：通过 `cache-kit` 提供 provider/helper 与 NestJS DI 集成

选型说明：
- `ioredis` 是常见的 Redis 客户端，适合连接管理、Cluster/Sentinel 演进和锁、TTL 等基础能力封装。
- 首版不建议直接以 `cache-manager` 作为 `cache-kit` 的核心，因为当前目标不仅是普通缓存读写，还包括 key 规范、分布式锁与更底层的 Redis 能力暴露。

## 推荐能力分层

### 1. `core` 层
- 定义配置类型、TTL 类型、编码接口、锁接口

### 2. `client` 层
- 负责 Redis client 创建、关闭、健康检查
- 基于 `ioredis` 暴露受控 client 能力，避免业务侧自行散落连接管理

### 3. `runtime` 层
- 提供 `get`、`set`、`del`、`remember`、`acquireLock` 等 helper
- 提供 key builder 与 namespace helper

### 4. `testing` 层
- 提供 fake cache client 与锁行为测试替身

## 包结构规划

```text
packages/cache-kit/
├─ src/
│  ├─ core/
│  │  ├─ types.ts
│  │  ├─ keys.ts
│  │  ├─ codec.ts
│  │  └─ ttl.ts
│  ├─ client/
│  │  ├─ redis.ts
│  │  └─ health.ts
│  ├─ runtime/
│  │  ├─ cache.ts
│  │  ├─ locks.ts
│  │  └─ remember.ts
│  ├─ testing/
│  │  └─ fake-cache.ts
│  └─ index.ts
└─ README.md
```

## API 边界建议
- `createCacheClient(config)`：创建 Redis 客户端
- `closeCacheClient(client)`：关闭连接
- `checkCacheHealth(client)`：健康检查
- `buildCacheKey(parts, options)`：构建标准缓存 key
- `getJson` / `setJson`：JSON 值读写
- `remember(key, ttl, loader)`：带回源的缓存 helper
- `acquireLock(key, ttl)` / `releaseLock(lock)`：分布式锁 helper

## 与其他目录的职责分工
- `packages/cache-kit`：Redis 运行时基础设施 SDK
- `services/*/src/infrastructure`：具体业务缓存键定义、回源逻辑与失效策略
- `configs/`：如后续需要，可放可版本化的全局缓存策略参数

## 验收标准
- 能统一创建 Redis 客户端并执行基础健康检查
- 能提供稳定的 key builder 与 JSON 编解码能力
- 能提供基础 TTL helper 与 `remember` 模式封装
- 能提供可安全释放的分布式锁 helper
- 能提供 fake client 用于单元测试

## 当前结论
- Redis 适合做共享基础设施包
- 业务缓存规则与缓存键语义仍应保留在服务内部
