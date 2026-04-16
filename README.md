# KAS SaaS Next

课程协作平台，基于 `Next.js 16 + React 19 + Prisma + SQLite + Ant Design`。

## Local Setup

1. 安装依赖

```bash
npm install
```

2. 创建本地环境文件

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. 初始化本地数据库并写入演示数据

```bash
npm run db:setup
```

这会执行：

- `prisma migrate deploy`
- `node prisma/seed.mjs`

默认会创建/使用项目根目录下的 `dev.db`。

4. 启动开发服务器

```bash
npm run dev
```

5. 生产构建验证

```bash
npm run build
```

## Demo Accounts

运行 `npm run db:setup` 后可使用以下账号：

- `teacher01 / Passw0rd!`
- `leader01 / Passw0rd!`
- `member01 / Passw0rd!`

邀请码：

- `TEAM-DEMO001`

## Available Scripts

- `npm run dev`：启动开发环境
- `npm run build`：执行生产构建
- `npm run start`：启动生产服务
- `npm run lint`：运行 ESLint
- `npm run test`：运行 Vitest
- `npm run db:migrate`：执行 Prisma migrations
- `npm run db:seed`：写入本地演示数据
- `npm run db:setup`：初始化数据库并写入演示数据

## Notes

- `.env` 和 `dev.db` 都是本地运行资产，不会提交到仓库。
- 如果你在 `git worktree` 中工作，需要在对应 worktree 目录下单独准备 `.env` 和 `dev.db`。
