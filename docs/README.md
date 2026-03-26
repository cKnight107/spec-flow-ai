# Docs 总览

`docs/` 是本仓库的事实源，产品、架构、规则、规格、运行手册和 AI 变更记录都应优先沉淀在这里。

## 目录导航
- [product](./product/README.md)
  - 产品需求、范围、路线图、用户场景
- [architecture](./architecture/README.md)
  - 技术路线、分层架构、部署、数据模型、安全治理、可观测
- [adr](./adr/README.md)
  - 关键架构决策记录
- [rules](./rules/README.md)
  - 代码与协作约束
- [specs](./specs/README.md)
  - 模块级规格与实施任务
- [runbooks](./runbooks/README.md)
  - 本地开发、发布、故障响应、数据回补手册
- [ai-change-log](./ai-change-log/README.md)
  - AI 参与变更的摘要记录

## 使用顺序
1. 先看 `product/` 与 `architecture/`
2. 再确认 `rules/` 与 `adr/`
3. 然后按 `specs/` 实施
4. 运行与交付参考 `runbooks/`
