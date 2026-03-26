---
此目录为AI Change Log主要记录AI 如何参与了这次变更，以及关键依据、假设、验证与风险。
记录“任务—改动—原因—验证—风险”这条主线
---
# 规范
## 命名规范
- CL-001.md
- CL-002.md
## 目录位置
docs/ai-change-log
# 模版
```markdown
# AI Change Log

> 记录 AI Coding / Spec Coding 中“有效变更摘要”，不记录完整推理过程。
> 目标：可复盘、可审查、可交接。

---

## [CL-001] 任务标题
- 日期：2026-03-13
- 任务编号：TASK-001
- Spec：docs/specs/001-xxx/spec.md
- 执行方式：Codex / Cursor / Claude Code / Agent
- 执行人：AI + Human
- 状态：Done / Partial / Blocked

### 1. 目标
一句话说明这次要完成什么。

### 2. 输入依据
- PRD / Spec：
- ADR / 设计文档：
- 相关 Issue / Ticket：
- 额外约束：

### 3. 本次改动
- 新增：
- 修改：
- 删除：

### 4. 涉及文件
- `path/to/file-a`
- `path/to/file-b`
- `path/to/file-c`

### 5. 关键决策
- 为什么这样实现
- 做了哪些取舍
- 哪些地方采用了保守方案

### 6. 验证情况
- [ ] lint
- [ ] typecheck
- [ ] unit test
- [ ] integration test
- [ ] manual check

补充说明：
- 

### 7. 风险与未完成项
- 当前已知风险
- 暂未处理的问题
- 后续建议

### 8. 人工介入记录
- 是否人工修改：是 / 否
- 人工确认点：
- 需要复审点：

### 9. 结果摘要
一句话总结这次交付结果。
```