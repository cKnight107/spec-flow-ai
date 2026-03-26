# 015 Cache Kit

本目录定义共享缓存基础设施包 `packages/cache-kit` 的职责边界与落地任务，目标是统一 Redis 连接、键命名、序列化、锁与 TTL 处理方式。

## 目录内容
- [spec.md](docs/specs/015-cache-kit/spec.md)：`cache-kit` 的目标、边界、能力范围与验收标准
- [tasks.md](docs/specs/015-cache-kit/tasks.md)：`cache-kit` 的初始化与分阶段实现任务

## 当前状态
- 规格文档：已补齐
- 实现代码：待开始
- 推荐优先落地点：`packages/cache-kit`
