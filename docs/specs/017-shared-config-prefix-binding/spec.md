# 017 Shared Config Prefix Binding

## 目标
为 `packages/shared-config` 增加类似 Spring Boot `@ConfigurationProperties(prefix = "...")` 的 prefix 绑定能力，让接入方可使用嵌套 YAML 与 camelCase 字段定义获取一组配置。

## 适用范围
- `services/*` 中需要按业务域分组配置的服务
- `integrations/*` 中需要按供应商或渠道分组配置的适配器
- `packages/shared-config` 自身的 schema/helper 能力增强

## 范围
- 支持在 schema 中定义 prefix 绑定 helper
- 支持将嵌套 YAML 路径拍平成属性路径参与匹配
- 支持同一字段同时从 `YAML path` 与 `ENV key` 读取
- 保持 `.env` / `process.env` 对 YAML 的覆盖能力
- 保持现有平面 schema 与加载方式兼容

## 非目标
- 不在本次实现树状 schema 输出
- 不在本次支持对象数组绑定与复杂对象 parser
- 不在本次引入远程配置中心或运行时热更新

## 输入依据
- [docs/specs/012-shared-config/spec.md](docs/specs/012-shared-config/spec.md)
- [docs/rules/architecture-boundaries.md](docs/rules/architecture-boundaries.md)
- [docs/rules/ts.md](docs/rules/ts.md)
- [docs/rules/testing-quality.md](docs/rules/testing-quality.md)

## 设计原则
- 渐进兼容：旧的平面 key schema 不需要改动
- 双通道绑定：同一字段既能从 `WECHAT_MCH_ID` 取值，也能从 `wechat.mch-id` 取值
- YAML 友好：配置文件作者优先写分组结构
- 运行时保守：仍然保留 fail-fast 校验与只读导出

## 设计约束
- 共享实现仍落在 `packages/shared-config`
- 不引入业务耦合或具体服务专属逻辑
- 环境变量优先级仍高于 YAML 文件
- 当前只支持嵌套对象和标量数组，不支持对象数组直接映射

## 建议 API
- `defineConfigProperties({ prefix, fields, envPrefix?, yamlPrefix? })`
- `defineField({ parser, scope, description, sourceKey?, yamlPath? })`

## 目标示例

```yaml
wechat:
  mch-id: wx-mch
  app-id: wx-app
  api-v3-key: ${WECHAT_API_V3_KEY}
```

```ts
const wechatSchema = defineConfigProperties({
  prefix: "wechat",
  fields: {
    mchId: defineField({ parser: stringParser(), scope: "server", description: "商户号" }),
    appId: defineField({ parser: stringParser(), scope: "server", description: "应用 ID" }),
    apiV3Key: defineField({ parser: stringParser(), scope: "server", description: "API v3 密钥" }),
  },
});
```

预期输出：

```ts
{
  mchId: "wx-mch",
  appId: "wx-app",
  apiV3Key: "secret"
}
```

## 验收标准
- 嵌套 YAML 可成功绑定到 prefix schema
- `process.env` 中对应环境变量可覆盖 YAML 值
- 现有 `modelGatewaySchema`、`adminConsoleSchema` 等平面 schema 行为不回退
- 新增单测覆盖 prefix 绑定与优先级行为
