# 016 OSS Kit Tasks

> 状态标记说明
> - `可立即实施`：当前仓库已有对应目录或依赖条件，可直接进入实现
> - `依赖新建项目/目录`：当前仓库尚无对应 package，需要先建项
> - `依赖后续业务代码`：需要有具体服务接入后才能完成验证

- [ ] `依赖新建项目/目录` 在 `packages/` 新增 `oss-kit` 包骨架与 `README.md`
- [ ] `可立即实施` 定义 bucket、endpoint、region、metadata 与对象错误类型
- [ ] `可立即实施` 提供 `createObjectStorageClient`、`closeObjectStorageClient`、`checkObjectStorageHealth`
- [ ] `可立即实施` 提供上传、下载、删除、存在性检查与元数据查询 helper
- [ ] `可立即实施` 提供签名上传 URL、签名下载 URL 能力
- [ ] `可立即实施` 提供 metadata 规范化与流式读写 helper
- [ ] `可立即实施` 提供 fake object storage client 与基础测试工具
- [ ] `依赖后续业务代码` 在至少一个服务接入 `oss-kit`，验证对象 key 规范、上传下载与错误处理
  当前说明：知识接入、审计归档、导出物等服务尚未实现，可先完成包设计与单测。
- [ ] `依赖后续业务代码` 补充与对象元数据索引表的协同规范
  当前说明：对象本体在对象存储中，结构化索引与领域绑定仍需由具体服务持有。
