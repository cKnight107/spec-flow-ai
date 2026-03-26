# 本地开发 Runbook

## 目标
快速启动 monorepo 开发环境并验证基础依赖。

## 最小步骤
1. 安装 Node.js 20+ 与 pnpm。
2. 复制 `.env.example` 为 `.env`。
3. 启动 PostgreSQL、Redis、Object Storage、OpenSearch。
4. 执行 `pnpm install`。
5. 执行 `pnpm dev`。
