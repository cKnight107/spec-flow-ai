# 页面目录结构规范

## 推荐分层
```text
pages-or-module/
├─ constants/     # 页面常量、枚举、静态配置
├─ services/      # 页面专属接口封装
├─ hooks/         # 页面专属 hooks
├─ components/    # 页面内部组件
├─ utils/         # 页面内部工具函数
├─ types/         # 页面内部类型
└─ index.tsx      # 页面入口
```

## 约束
- 页面级状态、请求、视图组件不要全部堆在 `index.tsx`。
- `components/` 只放表现和交互组件，不直接发起跨域业务请求。
- `services/` 只处理接口调用与数据转换，不夹杂页面渲染逻辑。
- `hooks/` 负责组合页面状态、事件与副作用。
- 可复用能力优先上移到 `packages/`，不要在页面目录重复造轮子。
