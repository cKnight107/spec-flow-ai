# 011 Admin Console 第二阶段原型

## 目录说明
- `index.html`：静态高保真后台原型入口
- `styles.css`：视觉样式、布局、状态与组件皮肤
- `app.js`：静态页面路由、数据、组件拼装和交互逻辑

## 使用方式
1. 直接在浏览器打开 `index.html`
2. 或在当前目录启动静态服务后访问页面

## 原型范围
- 覆盖仪表盘、应用中心、应用详情、模型中心、知识中心、工具中心、工作流、PromptOps、审计与审批、观测与成本、权限治理
- 包含 `PageHeader`、`SearchFilterBar`、`DataTable`、`StatusBadge`、`JsonViewer`、`ApprovalBanner`、`ToolExecutionTimeline`
- 提供 `正常态 / 加载中 / 空态 / 异常态 / 无权限 / 审批中` 视图切换

## 约束
- 全部使用静态 HTML / CSS / JavaScript
- 不接入后端、鉴权中心、审批流引擎或真实链路数据
