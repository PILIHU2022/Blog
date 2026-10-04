# Blog

基于 **Hugo** + **FixIt 主题（main 分支 / v1）** 的个人博客。

## 环境要求

| 依赖 | 版本要求 | 本机当前版本 |
| --- | --- | --- |
| Hugo | `>= 0.166.0` **extended** | 0.167.0 extended |
| Dart Sass | `>= 1.99.0` | 1.105.1 |
| Git | 任意较新版本 | 2.56.0 |
| Node.js | `>= 22`（仅部署到 Cloudflare 时需要） | 22.23.3 |

> **为什么需要 Dart Sass？**
> FixIt v1 的样式用现代 SCSS 编写，由 Hugo Pipes 调用外部 Dart Sass 编译。
> 未安装时构建会直接报错。本机安装方式（Arch Linux）：
> ```bash
> # 方式一：pacman
> sudo pacman -S dart-sass
> # 方式二：官方 standalone 二进制
> curl -sSL -o /tmp/sass.tgz https://github.com/sass/dart-sass/releases/download/1.105.1/dart-sass-1.105.1-linux-x64.tar.gz
> mkdir -p ~/.local/lib && tar -xzf /tmp/sass.tgz -C ~/.local/lib
> ln -sfn ~/.local/lib/dart-sass/sass ~/.local/bin/sass
> ```
> 或者直接运行 `npm install`（见下文「部署」一节），脚本会自动下载。

## 本地开发

```bash
# 首次克隆：务必带 --recurse-submodules 拉取主题
git clone --recurse-submodules <仓库地址> blog && cd blog

# 启动本地预览（推荐加 --disableFastRender，FixIt 依赖 .Store，实时预览更准）
hugo server -D --disableFastRender
# 打开 http://localhost:1313/
```

常用命令：

```bash
hugo                          # 构建到 public/
hugo server -D                # 本地预览，含草稿
hugo --gc --minify            # 生产构建（压缩 + 清理缓存）
hugo new content posts/文章名.md   # 新建文章（用 archetypes/posts.md 模板）
```

## 目录结构

```
.
├── hugo.toml               # 站点配置（精简版，其余继承主题默认值）
├── archetypes/             # 新建内容的模板
│   ├── default.md
│   └── posts.md
├── content/
│   └── posts/              # 文章目录
├── scripts/
│   └── install-dart-sass.mjs   # 为 CI 自动安装 Dart Sass
├── package.json            # 仅用于 CI 安装 Dart Sass
└── themes/
    └── FixIt/              # 主题（git submodule，跟踪 main 分支）
```

`public/`、`resources/`、`node_modules/`、`.hugo_build.lock` 均已忽略，不进入版本库。

## 配置说明

**本站点没有复制主题那份 2000+ 行的默认配置。** `hugo.toml` 只写必要项，其余通过下面三行从主题继承：

```toml
[markup]
_merge = "shallow"

[outputs]
_merge = "shallow"

[taxonomies]
_merge = "shallow"
```

> ⚠️ **v0.x 与 v1 配置不通用。** FixIt v1 把所有主题配置键从 camelCase 改成了
> snake_case，并移除了 `[params.page]`（已扁平化到 `[params]`）。
> 官网文档中仍有大量 v0.4.x 的旧写法，照抄会触发弃用警告或配置失效。
> 请以主题自带的 `themes/FixIt/hugo.toml` 和
> [v1 升级指南](https://fixit.lruihao.cn/zh-cn/guides/upgrade-to-v1/) 为准。

### 上线前必须替换的占位符

`hugo.toml` 中搜索 `TODO`：

- `title` —— 站点标题
- `baseURL` —— 正式域名（**带结尾斜杠**）。不改的话 RSS、sitemap、分享链接全错
- `[params].description` / `keywords`
- `[params.author]` 下的姓名、邮箱、主页、头像
- `[params.header.title].name`、`[params.header.subtitle].name`
- `[params.social]` 下按需填写社交账号

另外建议把站点图标放到 `static/`：`favicon.ico`、`favicon-16x16.png`、
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

## 部署：GitHub + Cloudflare Pages

### 一次性配置

在 Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** →
**Connect to Git**，选择本仓库，按下表填写：

| 配置项 | 值 |
| --- | --- |
| Production branch | `main` |
| Build command | `hugo --gc --minify` |
| Build output directory | `public` |
| 环境变量 `HUGO_VERSION` | `0.167.0` |
| 环境变量 `HUGO_SASS_BINARY` | `node_modules/.dart-sass/sass` |

### ⚠️ 为什么必须设置 `HUGO_SASS_BINARY`

这是本项目部署时**最容易踩的坑**：

Cloudflare Pages 构建镜像自带的是 **Embedded Dart Sass，最高只有 1.62.1**
（见 [Build image 文档](https://developers.cloudflare.com/pages/configuration/build-image/)），
而 FixIt v1 要求 **≥ 1.99.0**。直接用镜像自带的版本会构建失败。

同时**不能**用 npm 上的 `sass` 包来替代：那个包是 dart2js 生成的 JS 包装器，
Hugo 把它当可执行文件调用时会报：

```
TOCSS-DART: failed to transform "/scss/main.scss": got unexpected EOF when executing "sass".
```

因此本项目的做法是：

1. `package.json` 声明了 `postinstall` 脚本，Cloudflare 在构建前会自动执行 `npm install`；
2. `scripts/install-dart-sass.mjs` 下载官方 **standalone 二进制** 到
   `node_modules/.dart-sass/`（真正的可执行文件，非 JS 包装器，仅用 Node 内置模块）；
3. 通过环境变量 `HUGO_SASS_BINARY` 让 Hugo 使用它。

> 该路径是**相对路径**，Hugo 会相对项目根目录解析，因此仓库克隆到哪个
> 目录都能用。若首次构建报找不到 sass，可在构建日志中确认
> `[dart-sass] HUGO_SASS_BINARY=...` 一行，并检查环境变量是否已保存。

### 自定义域名

绑定域名后，**务必把 `hugo.toml` 里的 `baseURL` 改成该域名**（带结尾斜杠），
否则生成的绝对链接仍指向占位符域名。改完提交即可触发重新部署。

### 部署相关的免费额度（Free 计划）

- 每月 500 次构建，单次构建 20 分钟超时
- 站点最多 20,000 个文件，单文件最大 25 MiB
- 参考：[Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)

当前站点产物约 2.5 MB / 127 个文件，余量充足。

### 回滚

Cloudflare Pages 每次部署都是一个不可变版本，控制台可一键回滚到任意历史部署。
配合 Git 历史，形成双重回退保障。

## 常用排错

**`enableGitInfo` 与 Git 仓库所有权**
`hugo.toml` 开启了 `enableGitInfo = true`，用于生成 `lastmod`。
如果 Git 报 `detected dubious ownership`，执行：

```bash
git config --global --add safe.directory "$(pwd)"
```

若 CI 环境的 Git 历史不完整，Hugo 会回退到 `:fileModTime`，不影响构建。

**内容日期在未来导致页面不生成**
本项目已开启 `buildFuture = true`，可以按日期做定时发布。
若你把它关掉，注意 `date` 晚于当前时间的文章不会出现在 `public/` 中。
