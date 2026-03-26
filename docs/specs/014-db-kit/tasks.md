# 014 DB Kit Tasks

> 状态标记说明
> - `可立即实施`：当前仓库已有对应目录或依赖条件，可直接进入实现
> - `依赖新建项目/目录`：当前仓库尚无对应 package，需要先建项
> - `依赖后续业务代码`：需要有具体服务接入后才能完成验证

- [ ] `依赖新建项目/目录` 在 `packages/` 新增 `db-kit` 包骨架与 `README.md`
- [ ] `可立即实施` 定义数据库连接配置、事务接口、查询上下文与错误类型
- [ ] `可立即实施` 设计基于 `pg` + `kysely` 的 PostgreSQL 优先适配层，明确与业务 Repository 的解耦方式
- [ ] `可立即实施` 提供 `createDbClient`、`closeDbClient`、`checkDbHealth` 基础接口
- [ ] `可立即实施` 提供 `withTransaction` 与事务传播约定
- [ ] `可立即实施` 提供游标分页、批量写入、错误映射等 helper
- [ ] `依赖后续业务代码` 在至少一个服务接入 `db-kit`，验证连接、事务与错误处理能力
  当前说明：现有仓库尚未形成真实数据库访问服务，可先落包与测试，再等待服务接入。
- [ ] `可立即实施` 提供 fake client / fake transaction 测试工具
- [ ] `依赖后续业务代码` 补充与 `packages/telemetry-sdk` 的上下文字段集成
  当前说明：需在真实查询执行链路中验证 `trace_id`、`tenant_id` 等字段的透传方式。
- [ ] `可立即实施` 在 README 中明确 `pg` 与 `kysely` 的使用边界，避免调用方把 `db-kit` 误用为通用 ORM
