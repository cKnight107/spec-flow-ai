# 015 Cache Kit Tasks

> 状态标记说明
> - `可立即实施`：当前仓库已有对应目录或依赖条件，可直接进入实现
> - `依赖新建项目/目录`：当前仓库尚无对应 package，需要先建项
> - `依赖后续业务代码`：需要有具体服务接入后才能完成验证

- [ ] `依赖新建项目/目录` 在 `packages/` 新增 `cache-kit` 包骨架与 `README.md`
- [ ] `可立即实施` 定义基于 `ioredis` 的 Redis 配置、TTL、编解码器、锁接口与 key namespace 规范
- [ ] `可立即实施` 提供 `createCacheClient`、`closeCacheClient`、`checkCacheHealth`
- [ ] `可立即实施` 提供 key builder、JSON 编解码与基础 KV helper
- [ ] `可立即实施` 提供 `remember` 与显式 TTL helper
- [ ] `可立即实施` 提供分布式锁与幂等 key helper
- [ ] `可立即实施` 提供 fake cache client 与锁测试替身
- [ ] `依赖后续业务代码` 在至少一个服务接入缓存包，验证命中率、锁行为与错误处理
  当前说明：需要后续服务形成真实缓存场景后再做集成验证，当前可先完成包设计与单测。
- [ ] `依赖后续业务代码` 补充与观测链路的埋点对接
  当前说明：缓存命中、未命中、锁竞争等事件需结合服务端调用链统一记录。
- [ ] `可立即实施` 在 README 中明确 `ioredis` 能力边界，避免调用方把 `cache-kit` 混同为业务缓存框架
