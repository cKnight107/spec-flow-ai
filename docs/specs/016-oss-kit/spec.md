# 016 OSS Kit

## 目标
建立统一的对象存储基础设施共享包，收敛 bucket 配置、对象上传下载、删除、签名 URL、元数据归一化与测试替身能力，减少各服务重复封装对象存储 SDK。

## 适用范围
- `services/*` 中需要上传文档原件、解析产物、导出物或审计归档文件的服务
- `integrations/*` 中需要同步对象文件到外部存储的适配器
- `tests/*` 中需要 fake object storage client 的测试代码

## 范围
- 对象存储 client 创建与生命周期管理
- bucket、endpoint、region 等配置类型
- 上传、下载、删除、查询元数据、存在性检查
- 预签名上传 URL 与下载 URL
- 对象 metadata、content-type、cache-control 规范化 helper
- 大文件上传扩展点与流式读写接口
- 测试替身与最小断言工具

## 非目标
- 不承载文档解析、切片、索引、权限继承等业务逻辑
- 不维护对象与业务实体之间的领域绑定关系
- 不负责 CDN、生命周期规则、跨区域复制等运维配置
- 不在本阶段承诺覆盖所有云厂商特有高级能力

## 输入依据
- [docs/rules/architecture-boundaries.md](docs/rules/architecture-boundaries.md)
- [docs/rules/code-style.md](docs/rules/code-style.md)
- [docs/architecture/data-model.md](docs/architecture/data-model.md)
- [docs/architecture/overview.md](docs/architecture/overview.md)

## 设计原则
- 对象存储优先：共享的是对象操作能力，不是业务文档模型
- 接口稳定：对上暴露统一对象操作接口，对下允许适配不同对象存储实现
- 元数据规范：统一内容类型、对象标签、摘要字段与扩展 metadata 结构
- 流式优先：下载与上传应优先支持流式接口，避免大文件一次性读入内存
- 渐进兼容：包名为 `oss-kit`，实现上保留兼容 S3 类对象存储的适配空间

## 术语
- `object key`：对象在 bucket 中的完整路径键
- `metadata`：对象附加元数据
- `presigned url`：带时效签名的上传或下载 URL
- `multipart upload`：分片上传能力

## 设计约束
- 共享实现落在 `packages/oss-kit`
- 包内不得包含具体业务 bucket 路径规划与文档生命周期规则
- 业务侧必须在服务内部维护对象 key 命名与领域绑定关系
- 优先与对象存储通用语义对齐，不绑定单一厂商专有命名

## 推荐能力分层

### 1. `core` 层
- 定义配置类型、对象描述类型、metadata 类型与错误类型

### 2. `client` 层
- 负责对象存储 client 创建、关闭与健康检查

### 3. `runtime` 层
- 提供 `putObject`、`getObject`、`deleteObject`、`headObject`、`objectExists`
- 提供 `createPresignedUploadUrl`、`createPresignedDownloadUrl`
- 提供 metadata 归一化与流式读写 helper

### 4. `testing` 层
- 提供 fake object storage client 与断言 helper

## 包结构规划

```text
packages/oss-kit/
├─ src/
│  ├─ core/
│  │  ├─ types.ts
│  │  ├─ errors.ts
│  │  └─ metadata.ts
│  ├─ client/
│  │  ├─ oss.ts
│  │  └─ health.ts
│  ├─ runtime/
│  │  ├─ upload.ts
│  │  ├─ download.ts
│  │  ├─ object.ts
│  │  └─ presign.ts
│  ├─ testing/
│  │  └─ fake-oss.ts
│  └─ index.ts
└─ README.md
```

## API 边界建议
- `createObjectStorageClient(config)`：创建对象存储客户端
- `closeObjectStorageClient(client)`：关闭资源
- `checkObjectStorageHealth(client)`：健康检查
- `putObject(input)`：上传对象
- `getObject(input)`：下载对象或读取流
- `deleteObject(input)`：删除对象
- `headObject(input)` / `objectExists(input)`：查询元数据与存在性
- `createPresignedUploadUrl(input)` / `createPresignedDownloadUrl(input)`：生成签名 URL

## 与其他目录的职责分工
- `packages/oss-kit`：对象存储运行时基础设施 SDK
- `services/*/src/infrastructure`：对象 key 规划、业务元数据绑定、访问控制规则
- `database/`：对象元数据索引表与领域绑定所需的结构化存储

## 验收标准
- 能统一创建对象存储客户端并执行基础健康检查
- 能提供上传、下载、删除与元数据查询能力
- 能提供预签名上传和下载 URL
- 能提供 metadata 规范化 helper
- 能提供 fake client 用于单元测试

## 当前结论
- 对象存储适合抽为共享基础设施包
- 文档管理、审计归档、知识文件绑定等业务逻辑仍应保留在服务内部
