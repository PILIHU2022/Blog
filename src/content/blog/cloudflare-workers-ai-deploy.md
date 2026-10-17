---
title: '让 AI 把博客部署到 Cloudflare Workers：完整命令记录'
publishDate: 2026-10-17T11:59:01+08:00
description: '从 Astro 静态站到 Cloudflare Workers：KV、Cron、Deploy Hook 与 GitHub 监控的实操记录，附全部关键命令。'
tags: ['Cloudflare', 'Astro', 'AI', 'Blog']
draft: false
---

> **🤖 本文由 DeepSeek V4.1 Flash 生成**
>
> 这是一次真实的部署操作记录：命令、报错和验证结果来自终端输出；账户 ID、KV ID、设备码和密钥已隐去或替换为占位符。

## 先说结果

这次的目标很具体：把 Astro 博客部署到 Cloudflare Workers，并让 Worker 每 5 分钟检查一次 GitHub 仓库；发现新提交就触发重新构建。

最终 Worker 跑在：

```text
https://blog-astro.spark-cn.workers.dev
```

`/api/health`、`/api/status`、旧链接 301、404 页面都已验证通过。`blog.sparkzh.top` 暂时仍由 Vercel 提供服务，Workers 先用 `workers.dev` 地址验收。

整个系统的分工如下：

| 角色       | 由谁承担                  | 做什么                                          |
| ---------- | ------------------------- | ----------------------------------------------- |
| 构建、发布 | Cloudflare Workers Builds | `npm run build:cf`，然后 `wrangler deploy`      |
| 站点与监控 | 同一个 Worker             | 提供 `dist/` 静态资源，提供 `/api/*` 接口       |
| 定时检查   | Cron Trigger              | 每 5 分钟对比 GitHub HEAD 与线上 `_deploy.json` |
| 触发构建   | Deploy Hook               | Worker 发现落后时，POST 一个 Hook URL           |
| 去重状态   | Workers KV                | 记录最近触发的 commit、时间和重试次数           |
| 即时触发   | GitHub Webhook（可选）    | push 后立刻通知 Worker                          |

## 为什么不在 Worker 里直接 `astro build`

Worker 运行在 V8 isolate 里，适合处理 HTTP 和定时任务，但它不是构建机。`astro build` 需要 npm 依赖树、Node 构建链，以及 `sharp`、`pagefind` 这类平台相关的原生二进制，还需要可写的文件系统和足够的 CPU / 内存。

所以“构建”交给 Cloudflare Workers Builds，“监控和触发”交给 Worker。这个边界划清之后，整件事就简单了。

## 准备

本地环境是 Node.js 22，仓库是 Astro 7 的静态站，产物在 `dist/`。先装部署工具：

```bash
npm install -D wrangler@4.151.1 @cloudflare/workers-types@5.20261016.1
```

新增的核心文件有这些：

```text
wrangler.jsonc
worker/index.ts
worker/tsconfig.json
scripts/write-build-info.mjs
public/_redirects
public/_headers
```

`wrangler.jsonc` 的关键部分：

```jsonc
{
  "name": "blog-astro",
  "main": "./worker/index.ts",
  "compatibility_date": "2026-10-17",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "404-page",
    "run_worker_first": ["/api/*"],
  },
  "triggers": {
    "crons": ["*/5 * * * *"],
  },
  "kv_namespaces": [
    {
      "binding": "DEPLOY_STATE",
      "id": "<KV_NAMESPACE_ID>",
    },
  ],
}
```

`package.json` 增加了三个脚本：

```json
{
  "scripts": {
    "build:cf": "npm run build && node scripts/write-build-info.mjs",
    "deploy": "wrangler deploy",
    "check:worker": "tsc -p worker/tsconfig.json"
  }
}
```

`build:cf` 会在 Astro 构建和 Pagefind 索引之后，把当前 commit 写进 `dist/_deploy.json`。Worker 在 cron 里读这个文件，才知道线上到底是哪个版本。

```json
{
  "sha": "d729cd85888d07b20edb16d686e7187163752bd4",
  "shortSha": "d729cd8",
  "branch": "main",
  "builtAt": "2026-10-17T04:21:23.872Z",
  "buildUuid": null,
  "source": "local"
}
```

## 第一次部署

先登录 Cloudflare。因为环境里没有浏览器回调地址，用的是设备码登录：

```bash
npx wrangler login --device --browser=false
```

终端会提示打开 `https://dash.cloudflare.com/oauth2/device/verify`，输入一个 5 分钟内有效的一次性代码。授权完成后，本机就拿到了 Wrangler 的 OAuth 凭据。

创建 KV 命名空间：

```bash
npx wrangler kv namespace create DEPLOY_STATE
```

输出类似：

```text
🌀 Creating namespace with title "DEPLOY_STATE"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ "binding": "DEPLOY_STATE", "id": "<KV_NAMESPACE_ID>" }
```

把 `<KV_NAMESPACE_ID>` 填进 `wrangler.jsonc`，然后构建并部署：

```bash
npm run build:cf
npx wrangler deploy
```

部署输出：

```text
Uploaded blog-astro
Deployed blog-astro triggers
  https://blog-astro.spark-cn.workers.dev
  schedule: */5 * * * *
Current Version ID: 63007f46-3d0c-41a8-9717-55754742b6bc
```

## 监控逻辑

Worker 的 cron 每 5 分钟做一次对账：

1. 请求 GitHub `GET /repos/PILIHU2022/Blog/commits/main`；
2. 通过 `ASSETS.fetch('/_deploy.json')` 读取线上 SHA；
3. 两个 SHA 相同，直接返回 `up-to-date`；
4. 不同则检查 KV 中的 `deploy:last-trigger`：
   - 同一个目标 SHA 在 15 分钟冷却期内，跳过；
   - 同一个目标 SHA 已自动重试 6 次，停止，避免无限消耗构建额度；
5. 否则 POST Deploy Hook，并把 `targetSha`、`triggeredAt`、`attempts` 写回 KV。

核心代码很短：

```ts
const deployed = await readBuildInfo(env);
if (!force && deployed?.sha === head.sha) {
  return { status: 'up-to-date', headSha: head.sha, deployedSha: deployed.sha };
}

await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' });
```

Worker 还提供几个接口：

| 接口                       | 用途                                     |
| -------------------------- | ---------------------------------------- |
| `GET /api/health`          | 健康检查                                 |
| `GET /api/status`          | 当前线上 SHA、最近触发状态、配置是否齐全 |
| `POST /api/deploy`         | 手动触发；`?force=1` 跳过冷却            |
| `POST /api/github/webhook` | 可选的 GitHub push Webhook，带 HMAC 校验 |

## 验证

本地先用 `wrangler dev` 跑一遍完整路由：

```bash
npx wrangler dev --port 8787
```

另开终端测试：

```bash
curl -s http://127.0.0.1:8787/api/health
curl -s http://127.0.0.1:8787/api/status
curl -sI http://127.0.0.1:8787/posts/auto-login-arch/
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8787/definitely-missing/
curl "http://127.0.0.1:8787/cdn-cgi/local/scheduled?format=json"
```

本地结果：

```text
/api/health       200
/posts/...        301 → /blog/auto-login-arch/
/definitely-...   404
scheduled         {"outcome":"ok"}
```

cron 的日志是：

```json
{
  "event": "reconcile",
  "reason": "cron",
  "status": "up-to-date",
  "headSha": "...",
  "deployedSha": "..."
}
```

线上再验一次：

```bash
curl -s https://blog-astro.spark-cn.workers.dev/api/health
curl -s https://blog-astro.spark-cn.workers.dev/api/status
curl -sI https://blog-astro.spark-cn.workers.dev/posts/auto-login-arch/
```

`/api/status` 返回的线上 SHA 与 `git rev-parse HEAD` 一致，说明 `_deploy.json` 对账链路正常。

## 提交与推送

```bash
git add -A
git commit -m "feat: deploy blog on Cloudflare Workers"
git push origin main
```

这次推送遇到一个环境问题：

```text
Bad owner or permissions on /etc/ssh/ssh_config.d/20-systemd-ssh-proxy.conf
fatal: Could not read from remote repository.
```

不是 GitHub 权限问题，而是系统 SSH 配置文件的权限异常。临时绕过：

```bash
GIT_SSH_COMMAND='ssh -F /dev/null' git push origin main
```

推送成功后，重新构建并部署一次，让线上 `_deploy.json` 与新的 HEAD 对齐：

```bash
npm run build:cf
npx wrangler deploy
```

## 还差最后一步：Deploy Hook

Worker、KV、Cron 都已经上线，但“发现新提交 → 自动重新构建”还缺一个 Deploy Hook。

这一步必须在 Cloudflare Dashboard 完成，因为 Cloudflare 的 GitHub App 授权是浏览器流程，CLI 的 OAuth 权限也不包含 Workers CI。直接调用 Builds API 时返回的是：

```json
{
  "success": false,
  "errors": [{ "code": 10000, "message": "Authentication error" }]
}
```

Dashboard 操作路径：

1. **Workers & Pages → blog-astro → Settings → Builds → 连接 GitHub**；
2. 仓库选 `PILIHU2022/Blog`，分支 `main`；
3. Build command 填 `npm run build:cf`；
4. Deploy command 填 `npx wrangler deploy`；
5. 在 **Deploy Hooks** 创建一个 `main` 分支的 Hook，复制 URL；
6. 把它写成 Worker secret：

```bash
npx wrangler secret put DEPLOY_HOOK_URL
```

另外两个运行时 secret 已经提前设置好：

```bash
npx wrangler secret put MANUAL_DEPLOY_TOKEN
npx wrangler secret put WEBHOOK_SECRET
```

设置完后访问：

```bash
curl -s https://blog-astro.spark-cn.workers.dev/api/status
```

确认 `"deployHookConfigured": true`，自动部署闭环就完成了。

## 踩坑记录

**1. `_deploy.json` 部署后短暂 404**

第一次重新部署后，`/_deploy.json` 返回了 404 页面，但 `dist/_deploy.json` 明明存在。重新执行一次 `wrangler deploy` 后恢复正常。静态资源部署有短暂的传播窗口，遇到这种情况先不要改代码，等一下或重新部署一次再判断。

**2. 匿名 GitHub API 有限额**

GitHub 匿名 API 是每 IP 每小时 60 次；认证后是每小时 5,000 次。每 5 分钟一次 cron 只有 12 次/小时，个人博客够用，但 Cloudflare 出口 IP 是共享的，建议给 Worker 配一个只读 `GITHUB_TOKEN`。

**3. 回滚会被 cron 再推回去**

如果通过 Cloudflare Deployments 回滚到旧版本，`_deploy.json` 的 SHA 也会变旧，cron 会认为“落后于 GitHub”，在冷却期后重新部署 HEAD。需要长期停留在旧版本时，先在 Dashboard 暂停 Cron Trigger。

**4. 域名还没切**

`blog.sparkzh.top` 目前仍指向 Vercel。Workers 先用 `workers.dev` 验收；切域名时要在 Worker 里添加 Custom domain，并处理 Vercel 留下的 A/CNAME 记录。

## 成本

个人博客的消耗很低：

| 项目           | 免费额度                   | 本方案消耗                            |
| -------------- | -------------------------- | ------------------------------------- |
| Workers 请求   | 100,000/天                 | 静态资源不计 Worker 调用；cron 288/天 |
| Workers Builds | 3,000 分钟/月              | 每次 push 一次 + 少量重试             |
| KV             | 100,000 读/天、1,000 写/天 | 约 288 读/天，仅触发时写              |
| GitHub API     | 5,000/小时（认证）         | 12/小时                               |

真正需要控制的是“构建持续失败”的情况。本文用 15 分钟冷却和 6 次重试上限，避免无限消耗构建分钟。

## 结语

这次部署最重要的不是“把静态文件传上去”，而是把职责拆清楚：

- Worker 负责运行时和监控；
- Workers Builds 负责构建；
- Deploy Hook 负责把两者接起来；
- KV 负责去重和冷却；
- GitHub 仍然是唯一的事实来源。

完整的配置、Worker 源码、重定向规则和排错手册在仓库里：

- [部署手册](https://github.com/PILIHU2022/Blog/blob/main/docs/cloudflare-workers-auto-deploy.md)
- [Worker 源码](https://github.com/PILIHU2022/Blog/blob/main/worker/index.ts)
- [wrangler 配置](https://github.com/PILIHU2022/Blog/blob/main/wrangler.jsonc)

---

> **🤖 本文由 DeepSeek V4.1 Flash 生成**，记录于 2026-10-17 11:59（Asia/Shanghai）。
