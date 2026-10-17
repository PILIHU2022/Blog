# Spark's Blog

基于 **Astro 7** + **[Astro Keel](https://astro.build/themes/details/astro-keel/)** 主题的个人博客。
线上地址：<https://blog.sparkzh.top/>

站点已从 Hugo + FixIt 迁移到 Astro：文章仍是 Markdown，构建产物是纯静态的 `dist/`，
搜索、RSS、站点地图和每篇文章的 Open Graph 图片都在构建时生成。

## 技术栈

| 组件 | 说明 |
| --- | --- |
| [Astro 7](https://astro.build/) | 静态站点生成，Content Layer API + 类型化内容集合 |
| [Astro Keel](https://github.com/kpab/astro-keel) | 极简编辑风主题，浅色/深色模式、标签、RSS、分页 |
| [Pagefind](https://pagefind.app/) | 构建时生成的纯静态全文搜索，无后端 |
| Shiki | 代码高亮，浅色/深色双主题 |
| satori + sharp | 构建时为每篇文章生成 1200×630 的 OG 图片 |
| NeoXiHei Code | 全站唯一字体：LXGW Neo XiHei 的等宽版（合并 M+ 1M），自托管子集 |

## 环境要求

| 依赖 | 版本 |
| --- | --- |
| Node.js | `>= 22.12.0`（见 `.nvmrc` / `package.json` 的 `engines`） |
| npm | 任意较新版本 |

## 本地开发

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 生成 dist/，并运行 Pagefind 建立搜索索引
npm run preview    # 预览构建后的 dist/
npm run check      # Astro / TypeScript 检查
```

> **受限环境提示**：如果 `$HOME` 不可写，Astro 的遥测初始化会报
> `ENOENT: no such file or directory, mkdir '~/.config/astro'`。
> 构建前设置 `export ASTRO_TELEMETRY_DISABLED=1` 即可。
> 仓库里的 `.npmrc` 已经把 npm 缓存指向本地 `.npm-cache/`，因此 `~/.npm`
> 只读时也能正常执行 `npm install` / `npm ci`。

## 目录结构

```
.
├── astro.config.mjs          # site URL、MDX、sitemap、Shiki 配置
├── package.json              # 依赖与 build/dev/postbuild 脚本
├── vercel.json               # Vercel 构建配置 + 旧 URL 重定向
├── public/                   # 原样复制的静态资源（头像、favicon、robots.txt）
├── src/
│   ├── consts.ts             # 站点名称、描述、导航、社交链接、Giscus
│   ├── content.config.ts     # blog 集合的 Zod schema
│   ├── content/blog/         # 文章（Markdown）
│   ├── i18n/                 # 界面文案字典（en / ja / zh）
│   ├── layouts/BaseLayout.astro
│   ├── components/           # 分页、评论、社交图标、结构化数据
│   ├── lib/                  # withBase、标签 slug、OG 图片渲染
│   ├── pages/                # 路由：首页、/blog、标签页、/about、/search、RSS、OG
│   └── styles/global.css     # 设计变量、字体、明暗主题
└── dist/                     # 构建产物（已忽略）
```

## 写文章

在 `src/content/blog/` 下新建 `.md` 或 `.mdx` 文件，文件名就是 URL slug：

```yaml
---
title: 在 Arch Linux 上安装 AMD 显卡驱动
publishDate: 2024-01-27T20:45:01+08:00
description: 一句话摘要，会出现在列表、SEO 与 RSS 中。
tags: ["Arch Linux", "Guides"]
draft: false
---

正文从这里开始。标题从 `##` 开始，文章页会自动生成目录。
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题 |
| `publishDate` | 是 | ISO 日期，建议带 `+08:00` 时区 |
| `description` | 是 | 摘要，列表页、RSS、OG 图片都会用到 |
| `tags` | 否 | 字符串数组，会生成 `/blog/tags/<slug>/` 页面 |
| `draft` | 否 | `true` 时不会出现在构建产物中 |
| `heroImage` | 否 | 相对路径的封面图，交给 Astro 图片管线处理 |

标签显示名可以包含空格（如 `Arch Linux`），路由会自动转成 `arch-linux`。

## 从 Hugo 迁移的说明

- 文章从 `content/posts/` 移到 `src/content/blog/`，front matter 改为
  `title / publishDate / description / tags / draft`。
- 原 Hugo 的 **categories 已合并进 tags**，否则 Keel 没有地方展示分类。
- 正文里 Hugo 的 H1 已降为 H2，避免和文章页标题重复；代码块内的 `#` 注释未改动。
- 旧链接通过 `vercel.json` 重定向：
  `/posts/:slug` → `/blog/:slug`，`/tags/*` → `/blog/tags/*`，
  `/categories/guide` → `/blog/tags/guides`，`/index.xml` → `/rss.xml`。
- Hugo 的 `hugo.toml`、`build.sh`、`archetypes/` 和 `themes/FixIt` 子模块已移除；
  旧版本仍完整保留在 Git 历史里。
- 原来 `draft: true` 的文章继续保持草稿状态，不会部署。

## 站点配置

### 基本信息

`src/consts.ts` 是唯一的站点配置入口：

- `SITE.title` / `description` / `rssDescription` / `ogImage`
- `SOCIAL_LINKS`：GitHub、Email、RSS
- `NAV_ITEMS`：首页、文章、关于、搜索
- `GISCUS`：评论默认关闭；如需启用，按 <https://giscus.app> 填写 repo 与 ID

### 语言与文案

`SITE.locale = 'zh-CN'`，界面文案走 `src/i18n/zh-cn.ts`；
英文和日文字典仍保留，方便以后切换或参考。日期通过 `Intl.DateTimeFormat`
按 `zh-CN` 格式化。

### 配色与字体

- 主色只有一行：`src/styles/global.css` 里的 `--color-accent`。
- 全站统一使用 **NeoXiHei Code**（霞鹜新晰黑 Code）：
  LXGW Neo XiHei 的等宽版，合并 M+ 1M 用于编程显示，
  因此中文、英文、数字与代码都使用同一个字体。
  来源：<https://github.com/lxgw/NeoXiHei-Code>，版本 v1.305。
  字体文件在 `public/fonts/neoxihei-code-1.305.woff2`。
- 字体是 ASCII + Latin-1 + GB2312 一级字（3,755 个常用字）+ 当前站点用字 +
  常用标点的 WOFF2 子集，约 440 KiB。新增生僻字如果不在子集内，会回退到系统
  等宽字体；重新生成子集：

  ```bash
  python3 -m pip install fonttools brotli
  python3 scripts/subset-neoxihei-font.py
  ```

  脚本会把 v1.305 的完整 TTF 下载到 `.cache/`（已忽略），同时生成浏览器用的
  `public/fonts/neoxihei-code-1.305.woff2` 和 OG 图片用的
  `src/assets/fonts/neoxihei-code-og.woff`。
- OG 图片也使用同一个字体，不再依赖 `@fontsource`。

### 搜索

Pagefind 在 `npm run build` 的 `postbuild` 阶段扫描 `dist/`。
搜索页是 `/search/`，开发服务器（`npm run dev`）中没有索引，需先构建再
`npm run preview` 验证。

## 部署到 Vercel

Vercel 项目使用 **Astro** 框架预设即可，仓库里的 `vercel.json` 已显式写明：

```json
{
  "framework": "astro",
  "installCommand": "npm ci --include=dev",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

构建流程：

1. `npm ci --include=dev` 按 `package-lock.json` 安装依赖（构建期的 satori/sharp/pagefind 在 devDependencies 里）；
2. `npm run build` 运行 `astro build`；
3. `postbuild` 自动运行 `pagefind --site dist`；
4. Vercel 发布 `dist/`。

Node 版本由 `.nvmrc`（22）和 `package.json` 的 `engines` 约束。Vercel 控制台里
把 **Node.js Version** 设为 22.x 即可；不需要再安装 Hugo、Dart Sass 或初始化 submodule。

> **从旧项目升级时注意**：如果 Vercel 控制台的 **Build & Development Settings**
> 里还留着旧的 `chmod +x build.sh && ./build.sh` 或空的 Install Command，
> 面板上的覆盖会优先于 `vercel.json`。请把 Build Command、Output Directory
> 恢复为默认（或删掉覆盖），再重新部署。

### 旧链接重定向

`vercel.json` 的 `redirects` 处理了从 Hugo 带过来的旧地址，部署后旧书签和搜索引擎
收录不会 404。上线后建议用 `curl -I https://blog.sparkzh.top/posts/auto-login-arch/`
确认返回 308 并跳到 `/blog/auto-login-arch/`。

### 自定义域名

在 Vercel 项目的 **Settings → Domains** 添加 `blog.sparkzh.top` 并按提示配置 DNS。
`astro.config.mjs` 的 `site` 已是该域名，无需改动。

## 升级主题

Keel 是模板而不是 npm 依赖。升级方式是查看
[上游仓库](https://github.com/kpab/astro-keel) 的 `CHANGELOG.md`，
把需要的改动手动移植到 `src/`。本站对主题做过这些本地调整：

- 首页改为个人博客布局（头像 + 最新文章 + 关于区块），移除 Works 集合；
- 新增 `src/i18n/zh-cn.ts` 与中文排版参数；
- 标签路由使用 `src/lib/tags.ts` 生成 URL-safe slug；
- 文章页 TOC 只展示 2 级标题，并过滤过长标题；
- 页脚改为版权信息 + 文章/RSS/源码链接；
- OG 图片改为每篇文章 + 首页动态生成，并支持中文。

## 常用排错

**`ENOENT ... ~/.config/astro`**
设置 `ASTRO_TELEMETRY_DISABLED=1`。

**`npm` 报 `EROFS` / 缓存不可写**
仓库的 `.npmrc` 已将 `cache` 指向 `.npm-cache/`；若仍失败，确认当前目录可写，
或临时用 `npm install --cache /tmp/npm-cache`。

**搜索页没有结果**
Pagefind 索引只在 `npm run build` 之后存在，`npm run dev` 中不可用。
用 `npm run preview` 验证。

**OG 图片中文变成方框**
说明 `src/assets/fonts/neoxihei-code-og.woff` 缺失或损坏。运行
`python3 scripts/subset-neoxihei-font.py` 重新生成字体子集。

## 共享仓库的权限注意事项

`/home/Projects` 是多个用户共享的目录，权限模型是 `setgid` + 属组 + 默认 ACL：

- 新建文件请直接写入或用编辑器保存，避免「临时文件 + rename + chmod 0600」，
  否则其他用户可能读不到。
- 不要用错误属主创建 `dist/` 或 `node_modules/`；遇到 `permission denied` 时，
  让当前拥有该目录的用户执行构建，或先由同一用户清理再重试。

## 许可

- 站点文章：**CC BY-NC-SA 4.0**（除非文章内另有说明）。
- 主题与代码：**MIT**，见 [LICENSE](./LICENSE) 与
  [Astro Keel](https://github.com/kpab/astro-keel)。
- 字体 **NeoXiHei Code** 遵循 **IPA Font License 1.0**，
  见 [public/fonts/NeoXiHei-Code-License.txt](public/fonts/NeoXiHei-Code-License.txt)；
  子集化仅用于网页与 OG 图片字体分发。
