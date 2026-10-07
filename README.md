# Spark's Blog

基于 **Hugo** + **FixIt 主题（main 分支 / v1）** 的个人博客。
线上地址：<https://blog.sparkzh.top/>

## 环境要求

| 依赖 | 版本要求 | 当前版本 |
| --- | --- | --- |
| Hugo | `>= 0.166.0` **extended** | 0.167.0 extended |
| Dart Sass | `>= 1.99.0` | 1.105.1 |
| Git | 任意较新版本 | 2.56.0 |

> **为什么必须要 Dart Sass？**
> FixIt 的样式（`assets/scss/`）用现代 SCSS 编写，必须由 Dart Sass 编译成 CSS。
> 没有它构建会直接报错：`You need to install Dart Sass`。
> Hugo 内嵌的 libsass 已弃用、编不了 FixIt v1 的语法，所以**无法绕过**。

## 首次配置（每个协作者只需一次）

```bash
git clone --recurse-submodules <仓库地址> blog && cd blog
hugo server -D --disableFastRender
```

本机需要已安装 **Dart Sass >= 1.99.0**（FixIt v1 必需）。Arch Linux：

```bash
sudo pacman -S dart-sass
sass --version        # 应 >= 1.99.0
```

> 装到系统路径后两个协作者都能用，且裸跑 `hugo` 即可。
> 不用系统包管理器时，也可下载官方 standalone 二进制放到 `PATH` 中的任意位置。

## 本地开发

```bash
# 启动预览（FixIt 依赖 .Store，加 --disableFastRender 预览更准）
hugo server -D --disableFastRender
# 打开 http://localhost:1313/
```

常用命令：

```bash
hugo server -D --disableFastRender   # 本地预览（含草稿）
hugo --gc --minify                   # 生产构建
hugo new content posts/文章名.md      # 新建文章
```

## 目录结构

```
.
├── hugo.toml                    # 站点配置（精简版，其余继承主题默认值）
├── archetypes/                  # 新建内容的模板
│   ├── default.md
│   └── posts.md
├── content/
│   └── posts/                   # 文章目录
├── static/
│   └── images/avatar.webp       # 头像（对外路径 /images/avatar.webp）
├── vercel.json                  # Vercel 项目配置（输出目录 + 调用 build.sh）
├── build.sh                     # Vercel 构建脚本（钉死 Hugo / Dart Sass 版本）
└── themes/
    └── FixIt/                   # 主题（git submodule，跟踪 main 分支）
```

以下均已忽略，不进入版本库：
`public/`、`resources/`、`node_modules/`、`.sass/`、`.hugo_build.lock`、`.vercel/`。

## 当前站点配置

| 配置项 | 值 |
| --- | --- |
| `title` | `Spark's Blog` |
| `baseURL` | `https://blog.sparkzh.top/` |
| 作者 | Spark |
| 邮箱 | Spark-CN@outlook.com |
| 头像 | `/images/avatar.webp` |
| 首页 profile | 已启用（头像、名字、社交链接） |
| 搜索 | 内置 Fuse.js |
| 页脚起始年份 | 2022 |

站点配置刻意**没有复制**主题那份 2000+ 行的默认配置，只写必要项，其余通过这三行继承：

```toml
[markup]
_merge = "shallow"

[outputs]
_merge = "shallow"

[taxonomies]
_merge = "shallow"
```

> ⚠️ **v0.x 与 v1 配置不通用。** FixIt v1 把所有主题配置键从 camelCase 改成
> snake_case，并移除了 `[params.page]`（已扁平化到 `[params]`）。
> 官网文档中仍有大量 v0.4.x 的旧写法，照抄会触发弃用警告或配置失效。
> 请以主题自带的 `themes/FixIt/hugo.toml` 和
> [v1 升级指南](https://fixit.lruihao.cn/zh-cn/guides/upgrade-to-v1/) 为准。

站点图标建议放到 `static/`：`favicon.ico`、`favicon-16x16.png`、
`favicon-32x32.png`、`apple-touch-icon.png`、`android-chrome-192x192.png`、
`android-chrome-512x512.png`。可用 <https://realfavicongenerator.net/> 生成。

## 主题升级

主题以 submodule 方式跟踪 `main` 分支：

```bash
git submodule update --remote --merge themes/FixIt
git add themes/FixIt && git commit -m "chore(theme): bump FixIt to latest main"
```

当前锁定：`1a7129e`（`v1.0.0-alpha.3` 之后 17 个提交）。

> **注意**：FixIt `main` 是 **v1 开发分支**，官方明确说明不保证稳定、含破坏性变更，
> v1.0.0 计划 2027 上半年发布。升级后请务必本地构建验证再推送。
> 如果希望更保守，可改用 `git -C themes/FixIt checkout v1.0.0-alpha.3` 之类的 tag。

## 部署：GitHub + Vercel

### 一次性配置

1. Vercel 控制台 → **Add New** → **Project** → 选择 `PILIHU2022/Blog`
2. Framework Preset 选 **Hugo**（本站不使用预设的构建流程，原因见下）
3. 直接 **Deploy**

`vercel.json` 把安装与构建都交给仓库里的 `build.sh`：

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "",
  "buildCommand": "chmod a+x build.sh && ./build.sh",
  "outputDirectory": "public"
}
```

### ⚠️ 为什么必须用 `build.sh`，而不是 Vercel 的 Hugo 预设

Vercel 的 Hugo 预设默认装的 Hugo 极旧（部署日志里是 **0.58.2**）。而本站的配置
文件叫 `hugo.toml`，这个**文件名是 Hugo 0.110 才支持的**，更早的版本只认
`config.toml`。于是旧 Hugo 会把整份站点配置静默忽略：

- `title` / `baseURL` / `theme` / `outputs` 全部丢失，语言回落到 `en`
- 没有主题 → 构建日志出现 `found no layout file for "HTML"`，**没有任何 HTML 页面**
- 只剩 Hugo 内建的 RSS / sitemap 输出，`public/` 里只有 `index.xml`
- 构建退出码是 0，Vercel 照常发布 → **访问首页返回的是 RSS 的 XML**

用旧版 Hugo 跑同一份仓库可以直接看到这个现象：

```bash
$ hugo config | grep -E '^(title|baseurl|theme)'   # Hugo 0.58.2：什么都没有
$ ls public                                        # 只有 XML，没有 index.html
index.xml  sitemap.xml  categories/  posts/  tags/

$ hugo config | grep -E '^(title|baseurl|theme)'   # Hugo 0.167.0：正常
title = "Spark's Blog"
baseurl = 'https://blog.sparkzh.top/'
theme = ['FixIt']
```

`build.sh`（按 [Hugo 官方 Host on Vercel 指南](https://gohugo.io/host-and-deploy/host-on-vercel/)
编写）把工具版本钉死在仓库里，Vercel 侧不需要任何环境变量：

| 工具 | 版本 | 原因 |
| --- | --- | --- |
| Hugo extended | `0.167.0` | FixIt v1 要求 `>= 0.166.0`，且必须是 extended |
| Dart Sass | `1.105.1` | FixIt v1 要求 `>= 1.99.0` |

除了装工具，脚本还负责几件必须的事：初始化 submodule、`git fetch --unshallow`
（`enableGitInfo = true` 需要完整历史）、打印实际使用的工具版本，并在构建后
**校验 `public/index.html` 是否真的生成**。最后这条很关键：主题缺失或 Hugo
版本过旧时构建会直接失败，而不是以"只有 XML"的产物静默上线。

### ⚠️ 为什么必须拉取 submodule

主题以 **git submodule** 形式存放在 `themes/FixIt`。**Vercel 克隆仓库时不会自动
初始化 submodule**，主题目录会是空的，症状与上面完全一样（只有 RSS/sitemap，
首页返回 XML）。`build.sh` 里已包含 `git submodule update --init --recursive`，
并且在主题缺失（没有 `themes/FixIt/theme.toml`）时直接报错退出。

### 部署后如何确认修好了

Vercel 构建日志里应当出现：

```
Tool versions:
  Dart Sass: 1.105.1
  Hugo:      hugo v0.167.0+extended ...
Generated 123 HTML file(s).
```

如果 `Hugo:` 一行不是 0.167.0，或者末尾没有 `Generated ... HTML file(s)`，
说明构建没有走到 `build.sh` —— 多半是 Vercel 项目里的
**Build & Development Settings** 被手动覆盖过（面板上的覆盖优先于 `vercel.json`），
清掉覆盖再重新部署即可。

访问 `/` 应返回网页；RSS 在 `/index.xml`，站点地图在 `/sitemap.xml`。

### 自定义域名

在 Vercel 项目的 **Settings → Domains** 添加 `blog.sparkzh.top` 并按其提示
配置 DNS。`hugo.toml` 里的 `baseURL` 已是该域名，无需改动。

## 共享仓库的权限注意事项

`/home/Projects` 是 `Spark` 与 `dsh` 两个用户共享的目录，权限模型是
`setgid` + 属组 `agent` + 默认 ACL。因此：

- **新建文件请用 shell（如 `tee`/`printf`）或编辑器直接写**，
  不要用会「临时文件 + rename + chmod 0600」的写入方式，否则属组会退回私有组，
  另一个用户就读不到了。
- **不要用 `nobody`/`agent` 之外的属主创建 `public/`**。
  实测中 `public/` 被一个用户构建后，另一个用户可能**无法写入或删除**，
  导致构建失败（`permission denied`）。
  遇到这种情况直接让**当前拥有该目录的用户**执行构建，
  或先用 `rm -rf public` 由同一用户清理。
- 本机预览可以用 `hugo --destination <自己的临时目录>` 绕开 `public/` 的归属问题。

## 常用排错

**`detected dubious ownership`**
`hugo.toml` 开启了 `enableGitInfo = true`。若报此错，执行：

```bash
git config --global --add safe.directory "$(pwd)"
# submodule 也要单独放行
git config --global --add safe.directory "$(pwd)/themes/FixIt"
```

若 CI 环境的 Git 历史不完整，Hugo 会回退到 `:fileModTime`，不影响构建。

**`You need to install Dart Sass`**
说明 Hugo 在 `PATH` 里找不到 `sass`。

先确认系统 sass 是否可用：

```bash
command -v sass && sass --version      # 期望 /usr/bin/sass 且 >= 1.99.0
```

- 若找不到：`sudo pacman -S dart-sass`（Arch），或从
  [dart-sass releases](https://github.com/sass/dart-sass/releases) 下载 standalone
  二进制并放到 `PATH` 中的任意目录
- 若找到但版本过低：同上，换用 >= 1.99.0 的版本
- 注意 `~/.local/bin/sass` 之类会遮蔽系统版本，`command -v sass` 显示的实际路径才算数

> 以上只是本地开发时的排错。Vercel 构建环境自带 Dart Sass，无需处理这些。

**内容日期在未来导致页面不生成**
本项目已开启 `buildFuture = true`，可以按日期做定时发布。
若关掉它，注意 `date` 晚于当前时间的文章不会出现在 `public/` 中。
