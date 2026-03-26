# API 接口生成规范

## 命名规范
- 生成或封装接口方法统一使用 `fetch{Name}Api` 命名。
- 读取类接口使用 `fetch` 前缀，创建、更新、删除类接口可按团队约定使用 `create`、`update`、`delete`，但同一模块内必须一致。
- 查询参数类型命名为 `{Name}Params`，响应数据类型命名为 `{Name}Data`。

## 响应结构
- 通用响应统一使用 `UniversalResp<T>` 泛型包装。
- 不允许每个接口各自定义一套不兼容的顶层响应结构。

## 示例
```ts
type UniversalResp<T> = {
  code: string;
  message: string;
  data: T;
};

type FetchUserListParams = {
  keyword?: string;
};

type FetchUserListData = {
  items: Array<{ id: string; name: string }>;
};

export async function fetchUserListApi(
  params: FetchUserListParams,
): Promise<UniversalResp<FetchUserListData>> {
  // ...
}
```

## 约束
- 接口层只做请求封装、参数整理和响应映射，不写页面逻辑。
- 服务层必须对异常态和空数据做统一处理。
- 自动生成代码如需二次封装，应单独放在 wrapper 或 service 文件中，不直接改生成产物。
