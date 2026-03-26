# 014 DB Kit

## 目标
建立统一的数据库基础设施共享包，收敛连接管理、事务封装、错误归一化、分页 helper 与测试替身能力，减少各服务重复搭建底层数据库访问代码。

## 适用范围
- `services/*` 中需要访问 PostgreSQL 等结构化数据库的 Node.js / NestJS 服务
- `integrations/*` 中需要持久化结构化元数据的适配器
- `tests/*` 中需要模拟数据库事务、连接与查询结果的测试代码

## 范围
- 连接工厂与生命周期管理
- 连接池参数约定与健康检查接口
- 事务 helper 与事务上下文透传接口
- 常见数据库错误归一化与重试建议分类
- 分页、游标、批量写入等通用 helper
- 查询审计元信息挂载点，例如 `trace_id`、`tenant_id`、`request_id`
- 测试替身、内存 fake 与最小测试工具

## 非目标
- 不提供面向任意表的一键式通用 CRUD
- 不承载业务 Repository、DAO、聚合根持久化逻辑
- 不维护业务表结构、迁移脚本与种子数据，这些继续放在 `database/`
- 不在本阶段统一绑定某一个具体 ORM 的全部高级能力
- 不负责数据库部署、备份、主从拓扑与运维脚本

## 输入依据
- [docs/rules/architecture-boundaries.md](docs/rules/architecture-boundaries.md)
- [docs/rules/code-style.md](docs/rules/code-style.md)
- [docs/architecture/data-model.md](docs/architecture/data-model.md)
- [docs/structure.md](docs/structure.md)

## 设计原则
- 基础设施优先：共享的是连接、事务与错误处理，不是业务表访问代码
- 显式边界：服务自身仍持有 Repository 与领域持久化规则
- 方言可控：优先围绕 PostgreSQL 设计，但保留驱动适配边界
- 成熟生态优先：优先使用社区成熟、维护稳定的数据库驱动与查询框架，不自研 SQL 执行框架
- 可观测：所有查询入口应支持附带链路上下文与慢查询标记
- 可测试：对上暴露稳定接口，便于 fake 与 mock
- 渐进式：先提供最小可用能力，再按服务落地经验扩展

## 术语
- `db client`：数据库连接客户端或连接池句柄
- `transaction scope`：一次显式事务执行边界
- `query context`：与查询关联的链路与租户上下文
- `cursor page`：基于游标的分页读取协议

## 设计约束
- 共享实现落在 `packages/db-kit`
- 包内不得引入具体服务的领域对象与业务表 schema
- 不得绕过服务边界让上层应用直接依赖业务 Repository
- 数据表定义、DDL、初始化脚本继续落在 `database/`
- 默认输出应兼容 `packages/telemetry-sdk` 的上下文字段
- 首版实现优先基于成熟 PostgreSQL 生态，不自建自定义 ORM 或查询 DSL

## 推荐技术组合
- 底层驱动：`pg`
- 查询构建与事务辅助：`kysely`
- NestJS 接入：通过 `db-kit` 提供 provider/helper 与 NestJS DI 集成，不直接把业务耦合进包内

选型说明：
- `pg` 是 PostgreSQL 生态中的常用基础驱动，适合承接连接池、事务和健康检查等基础设施能力。
- `kysely` 适合在不绑定业务 schema 生成流程的前提下提供类型安全查询构建能力，比直接自研 query helper 更稳妥。
- 首版不建议把 `prisma` 作为 `db-kit` 的唯一基础，因为 Prisma 更偏向“按业务 schema 生成 client”的使用方式，和当前“共享基础设施包、不承载业务表模型”的边界不完全一致。

## 推荐能力分层

### 1. `core` 层
- 定义连接配置类型、事务接口、查询上下文类型
- 定义错误枚举、分页协议、批量执行返回结构

### 2. `driver` 层
- 封装 PostgreSQL 驱动与查询框架的最小接入适配
- 管理连接池创建、关闭、健康检查

### 3. `runtime` 层
- 提供 `withTransaction`、`runQuery`、`runBatch` 等 helper
- 支持将 `trace_id`、`tenant_id` 等上下文传入执行路径
- 对上暴露 `pg` / `kysely` 的受控封装，避免业务侧直接散落连接与事务处理细节

### 4. `testing` 层
- 提供 fake client、fake transaction 与断言 helper
- 提供最小 fixture builder，帮助测试编排数据库返回结果

## 包结构规划

```text
packages/db-kit/
├─ src/
│  ├─ core/
│  │  ├─ types.ts
│  │  ├─ errors.ts
│  │  ├─ pagination.ts
│  │  └─ context.ts
│  ├─ driver/
│  │  ├─ postgres.ts
│  │  └─ health.ts
│  ├─ runtime/
│  │  ├─ client.ts
│  │  ├─ transaction.ts
│  │  └─ query.ts
│  ├─ testing/
│  │  ├─ fake-client.ts
│  │  └─ fake-transaction.ts
│  └─ index.ts
└─ README.md
```

## API 边界建议
- `createDbClient(config)`：创建数据库客户端
- `closeDbClient(client)`：关闭连接池
- `checkDbHealth(client)`：执行健康检查
- `withTransaction(client, handler, options)`：在事务中执行逻辑
- `mapDbError(error)`：归一化数据库错误
- `encodeCursor(input)` / `decodeCursor(input)`：游标分页工具

## 与其他目录的职责分工
- `database/`：数据库 schema、迁移、种子、初始化脚本
- `packages/db-kit`：数据库运行时基础设施 SDK
- `services/*/src/infrastructure`：具体业务 Repository 与数据访问实现

## 验收标准
- 能为至少一个服务提供统一数据库连接创建与关闭能力
- 能提供事务 helper，并覆盖提交、回滚、异常抛出三类路径
- 能归一化常见唯一键冲突、连接失败、超时等错误
- 能提供游标分页 helper，避免服务重复实现
- 能提供测试替身，支持不接真实数据库进行单测

## 当前结论
- 适合共享的是数据库基础设施能力
- 不适合共享的是面向业务表的通用 CRUD 与通用 Repository
