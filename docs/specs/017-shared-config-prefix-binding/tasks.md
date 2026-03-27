# 017 Shared Config Prefix Binding Tasks

- [x] `可立即实施` 为字段定义增加 `sourceKey` 与 `yamlPath` 元信息
- [x] `可立即实施` 提供 `defineConfigProperties` helper，自动生成 prefix 对应的 YAML 路径与环境变量名
- [x] `可立即实施` 将 YAML 文档解析从顶层平面键扩展为嵌套对象拍平
- [x] `可立即实施` 在 schema 解析阶段同时支持 `ENV key` 与 `YAML path` 查值
- [x] `可立即实施` 增加 prefix 绑定单测，覆盖 YAML 绑定与 `process.env` 覆盖
- [x] `可立即实施` 更新 `packages/shared-config/README.md` 使用示例
- [x] `可立即实施` 追加 AI 变更记录
