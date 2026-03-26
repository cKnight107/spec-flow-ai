# 仓库协作约定

## 核心原则
- 默认使用中文沟通与提交说明。
- 以 `docs/` 为事实来源，优先阅读 `docs/product`、`docs/architecture`、`docs/adr`、`docs/specs`、`docs/rules`。
- 优先做增量式变更，避免跨边界耦合。

## 目录边界
- `apps/` 只放用户入口与控制台。
- `services/` 只放平台能力服务。
- `packages/` 放跨应用共享协议、工具与 SDK。
- `integrations/` 放外部系统、模型、渠道适配器。
- `configs/` 放可版本化配置，不在业务代码中硬编码策略。

## 开发要求
- 新需求先补 `docs/specs/<id>-<name>/spec.md` 与 `tasks.md`。
- 关键架构决策先补 ADR，再改实现。
- 涉及 AI 辅助改动时，在 `docs/ai-change-log/` 追加变更记录。

## 项目地图

```text
docs/
├─ product/          存放产品需求、范围、路线图与典型用户场景
├─ architecture/     存放技术路线、系统设计、部署、安全与观测文档
├─ rules/            存放编码规范、架构边界与测试质量约束
├─ adr/              存放关键架构决策记录
├─ specs/            存放按模块编号的正式规格与任务拆解
├─ runbooks/         存放开发、发布、故障处理、数据回补手册
└─ ai-change-log/    存放 AI 参与变更的摘要记录

apps/                存放门户、管理台、开放接口等用户入口
services/            存放模型、知识、工具、工作流、治理等核心服务
packages/            存放共享类型、SDK、Schema 与测试工具
integrations/        存放模型厂商、知识源、工具、渠道适配器
configs/             存放模型、Prompt、路由、策略等可版本化配置
database/            存放迁移、种子、Schema 与初始化脚本
infra/               存放部署、基础设施与监控相关资产
examples/            存放示例应用与演示工程
tests/               存放契约、集成、端到端、性能测试
```
## 规则
> 开发需要遵循以下目录文件
- docs/architecture：技术架构
- docs/rules：开发规范
- packages：若使用工具或组件优先在此文件夹下寻找进行复用。