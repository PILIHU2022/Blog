# Spark's Blog

基于 **Hugo** + **FixIt 主题（main 分支 / v1）** 的个人博客。
线上地址：<https://blog.sparkzh.top/>

## 环境要求

| 依赖 | 版本要求 | 当前版本 |
| --- | --- | --- |
| Hugo | `>= 0.166.0` **extended** | 0.167.0 extended |
| Dart Sass | `>= 1.99.0` | 1.105.1 |
| Git | 任意较新版本 | 2.56.0 |
| Node.js | `>= 22`（仅 CI 需要） | 22.23.3 |

> **为什么必须要 Dart Sass？**
> FixIt 的样式（`assets/scss/`）用现代 SCSS 编写，必须由 Dart Sass 编译成 CSS。
> 没有它构建会直接报错：`You need to install Dart Sass`。
> Hugo 内嵌的 libsass 已弃用、编不了 FixIt v1 的语法，所以**无法绕过**。

## 首次配置（每个协作者只需一次）

本仓库由两个系统用户共同维护（`Spark` 与 `dsh`），各自的家目录都是 `700`，
**互相读不到对方装在 `$HOME` 里的工具**。因此 Dart Sass 统一装在**仓库内**的
`.sass/`，两个用户和 CI 都从同一处读取：

```bash
git clone --recurse-submodules <仓库地址> blog && cd blog
bash scripts/setup-dart-sass.sh        # 下载 Dart Sass 到 .sass/
```

该脚本会校验版本不低于 1.99.0，版本不足立即报错（避免静默回退到旧版本、
等到编译 SCSS 时才出一个难懂的错）。

## 本地开发

```bash
# 启动预览（指定仓库内的 sass；FixIt 依赖 .Store，加 --disableFastRender 更准）
HUGO_SASS_BINARY=.sass/sass hugo server -D --disableFastRender
# 打开 http://localhost:1313/
```

常用命令：

```bash
hugo new content posts/文章名.md                      # 新建文章
HUGO_SASS_BINARY=.sass/sass hugo --gc --minify        # 生产构建
HUGO_SASS_BINARY=.sass/sass hugo server -D            # 本地预览（含草稿）
```

> 若嫌每次带环境变量麻烦，可写进自己 shell 的 rc 文件：
> `export HUGO_SASS_BINARY="$PWD/.sass/sass"`（注意用绝对路径）。

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
│   └── images/avatar.png        # 头像（对外路径 /images/avatar.png）
├── scripts/
│   ├── setup-dart-sass.sh       # 本地/共享：安装 Dart Sass 到 .sass/
│   └── install-dart-sass.mjs    # CI：npm postinstall 自动调用
├── package.json                 # CI 安装 Dart Sass
└── themes/
    └── FixIt/                   # 主题（git submodule，跟踪 main 分支）
```

以下均已忽略，不进入版本库：
`public/`、`resources/`、`node_modules/`、`.sass/`、`.hugo_build.lock`。

## 当前站点配置

| 配置项 | 值 |
| --- | --- |
| `title` | `Spark's Blog` |
| `baseURL` | `https://blog.sparkzh.top/` |
| 作者 | Spark |
| 邮箱 | Spark-CN@outlook.com |
| 头像 | `/images/avatar.png` |
| 首页 profile | 已启用（头像、名字、社交链接） |
| 搜索 | 内置 Fuse.js |
| 页脚起始年份 | 2026 |

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

因此 CI 的做法是：

1. `package.json` 声明了 `postinstall` 脚本，Cloudflare 在构建前会自动执行 `npm install`；
2. `scripts/install-dart-sass.mjs` 下载官方 **standalone 二进制** 到
   `node_modules/.dart-sass/`（真正的可执行文件，非 JS 包装器，仅用 Node 内置模块）；
3. 通过环境变量 `HUGO_SASS_BINARY` 让 Hugo 使用它。

> 该路径是**相对路径**，Hugo 会相对项目根目录解析，因此仓库克隆到哪个
> 目录都能用。若首次构建报找不到 sass，可在构建日志中确认
> `[dart-sass] HUGO_SASS_BINARY=...` 一行，并检查环境变量是否已保存。

> 本地的 `scripts/setup-dart-sass.sh` 与 CI 的 `.mjs` 装的是同一个版本，
> 只是目标目录不同（`.sass/` 供人用，`node_modules/.dart-sass/` 供 CI 用），
> 两者互不影响。

### 部署相关的免费额度（Free 计划）

- 每月 500 次构建，单次构建 20 分钟超时
- 站点最多 20,000 个文件，单文件最大 25 MiB
- 参考：[Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)

当前站点产物约 2.5 MB，余量充足。

### 回滚

Cloudflare Pages 每次部署都是一个不可变版本，控制台可一键回滚到任意历史部署。
配合 Git 历史，形成双重回退保障。

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
说明 Hugo 的 `PATH` 里找不到 sass，且未设置 `HUGO_SASS_BINARY`。
先执行 `bash scripts/setup-dart-sass.sh`，再带上环境变量构建：

```bash
bash scripts/setup-dart-sass.sh
HUGO_SASS_BINARY=.sass/sass hugo server -D --disableFastRender
```

**`.sass/sass: Permission denied`**
安装产物丢了可执行位（共享目录的默认 ACL 可能把权限压成 `660`）。
确认后补上即可：

```bash
ls -l .sass/sass .sass/src/dart        # 应为 755
chmod 755 .sass/sass .sass/src/dart    # 若不足则补
```

**内容日期在未来导致页面不生成**
本项目已开启 `buildFuture = true`，可以按日期做定时发布。
若关掉它，注意 `date` 晚于当前时间的文章不会出现在 `public/` 中。
