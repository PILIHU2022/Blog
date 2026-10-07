#!/usr/bin/env bash
#
# Vercel 构建脚本（基于 Hugo 官方 Host on Vercel 指南）
# https://gohugo.io/host-and-deploy/host-on-vercel/
#
# ---------------------------------------------------------------------------
# 为什么不能交给 Vercel 的 Hugo 框架预设
# ---------------------------------------------------------------------------
# Vercel 的 Hugo 预设默认安装的 Hugo 极旧（部署日志里是 0.58.2）。
# 而站点配置文件叫 `hugo.toml` —— 这个文件名是 Hugo 0.110 才支持的，
# 旧版只认 `config.toml`。于是整份站点配置（title / baseURL / theme /
# outputs）会被静默忽略：
#
#   * 没有 theme => "found no layout file for HTML"，没有任何 HTML 页面
#   * 只有 Hugo 内建的 RSS / sitemap 输出 => public/ 里只有 index.xml
#   * 构建"成功"（退出码 0），Vercel 照常发布 —— 访问首页就看到 RSS 的 XML
#
# 同一个仓库、同一份 hugo.toml，用旧的 0.58.2 与当前版本构建的对比：
#
#   $ hugo config | grep -E '^(title|baseurl|theme)'
#   # Hugo 0.58.2  -> 什么都没有（defaultcontentlanguage 回落到 "en"）
#   # Hugo 0.167.0 -> title = "Spark's Blog" / baseurl = 'https://blog.sparkzh.top/' / theme = ['FixIt']
#
# 因此本脚本把 Hugo 与 Dart Sass 的版本钉死在仓库里，Vercel 侧不需要
# 任何环境变量；构建末尾还会校验 HTML 是否真的产出，让这类事故不会再
# 以"构建成功但只有 XML"的形式溜过去。
# ---------------------------------------------------------------------------
set -euo pipefail

# ---------------------------------------------------------------------------
# 工具版本（升级时改这里，并同步 README 的版本表）
# ---------------------------------------------------------------------------
HUGO_VERSION=0.167.0        # FixIt v1 要求 >= 0.166.0，且必须是 extended
DART_SASS_VERSION=1.105.1   # FixIt v1 要求 >= 1.99.0
GO_VERSION=1.27.1           # 仅在存在 go.mod（Hugo Modules）时使用
NODE_VERSION=24.21.0        # 仅在存在 package-lock.json 时使用

# 构建时区：影响 .Date 的本地化显示与 RSS 时间
TZ=Asia/Shanghai

build_temp_dir=""

cleanup() {
  if [[ -n "${build_temp_dir}" && -d "${build_temp_dir}" ]]; then
    rm -rf "${build_temp_dir}"
  fi
}
trap cleanup EXIT INT TERM

# Vercel 构建环境里仓库属主可能与当前用户不一致，git 会抛
# "detected dubious ownership" 并让 submodule 初始化失败。
allow_dubious_ownership() {
  command -v git >/dev/null 2>&1 || return 0
  [[ -d .git ]] || return 0
  git config --global --add safe.directory "${PWD}" 2>/dev/null || true
  git config --global --add safe.directory "${PWD}/themes/FixIt" 2>/dev/null || true
}

# enableGitInfo = true 需要完整 Git 历史；Vercel 默认是浅克隆。
fetch_git_history() {
  if [[ ! -d .git ]]; then
    echo "WARN: 没有 .git 目录，跳过 Git 历史处理（lastmod 将回退为文件时间）"
    return 0
  fi
  git config --global core.quotepath false 2>/dev/null || true
  if [[ "$(git rev-parse --is-shallow-repository 2>/dev/null || echo true)" == "true" ]]; then
    echo "Fetching full Git history (enableGitInfo 需要)..."
    if ! git fetch --unshallow --quiet; then
      echo "WARN: git fetch --unshallow 失败，继续使用浅克隆历史（lastmod 会退化为文件时间）"
    fi
  fi
}

# 主题以 git submodule 存放；Vercel 克隆时不会自动初始化。
init_submodules() {
  if [[ ! -f .gitmodules ]]; then
    return 0
  fi
  if [[ -d .git ]]; then
    echo "Initializing Git submodules..."
    git submodule update --init --recursive
  else
    echo "WARN: 缺少 .git，无法初始化 submodule，将直接使用 themes/FixIt 现有内容"
  fi

  # 关键校验：主题目录为空时 Hugo 只会产出 XML（历史事故），必须直接失败。
  if [[ ! -f themes/FixIt/theme.toml ]]; then
    echo "ERROR: 主题 themes/FixIt 未就绪（缺少 theme.toml）。" >&2
    echo "       主题缺失时 Hugo 只生成 RSS/sitemap，站点首页会返回 XML。" >&2
    exit 1
  fi
}

install_node_deps() {
  [[ -f package-lock.json ]] || return 0

  echo "Installing Node.js ${NODE_VERSION}..."
  curl -sfL --output-dir "${build_temp_dir}" -O \
    "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz"
  tar -C "${HOME}/.local" -xf "${build_temp_dir}/node-v${NODE_VERSION}-linux-x64.tar.gz"
  export PATH="${HOME}/.local/node-v${NODE_VERSION}-linux-x64/bin:${PATH}"

  echo "Installing Node.js dependencies..."
  npm ci
}

install_dart_sass() {
  echo "Installing Dart Sass ${DART_SASS_VERSION}..."
  curl -sfL --output-dir "${build_temp_dir}" -O \
    "https://github.com/sass/dart-sass/releases/download/${DART_SASS_VERSION}/dart-sass-${DART_SASS_VERSION}-linux-x64.tar.gz"
  tar -C "${HOME}/.local" -xf \
    "${build_temp_dir}/dart-sass-${DART_SASS_VERSION}-linux-x64.tar.gz"
  export PATH="${HOME}/.local/dart-sass:${PATH}"
}

install_go() {
  [[ -f go.mod ]] || return 0

  echo "Installing Go ${GO_VERSION}..."
  curl -sfL --output-dir "${build_temp_dir}" -O \
    "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz"
  tar -C "${HOME}/.local" -xf "${build_temp_dir}/go${GO_VERSION}.linux-amd64.tar.gz"
  export PATH="${HOME}/.local/go/bin:${PATH}"
}

install_hugo() {
  echo "Installing Hugo extended ${HUGO_VERSION}..."
  local archive="hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz"
  curl -sfL --output-dir "${build_temp_dir}" -O \
    "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${archive}"
  mkdir -p "${HOME}/.local/hugo"
  tar -C "${HOME}/.local/hugo" -xf "${build_temp_dir}/${archive}"
  export PATH="${HOME}/.local/hugo:${PATH}"
}

log_versions() {
  echo "Tool versions:"
  echo "  Dart Sass: $(sass --version 2>/dev/null || echo 'not installed')"
  echo "  Hugo:      $(hugo version 2>/dev/null || echo 'not installed')"
  command -v go >/dev/null 2>&1 && echo "  Go:        $(go version)"
  command -v node >/dev/null 2>&1 && echo "  Node.js:   $(node --version)"
  return 0
}

build_site() {
  echo "Building the project..."
  hugo build --gc --minify

  # 最后一道防线：没有 HTML 就是构建失败，绝不让"只有 XML"的产物上线。
  local html_count
  html_count=$(find public -type f -name '*.html' | wc -l | tr -d ' ')
  echo "Generated ${html_count} HTML file(s)."
  if [[ ! -f public/index.html || "${html_count}" -eq 0 ]]; then
    echo "ERROR: 没有生成 HTML 页面（public/index.html 缺失）。" >&2
    echo "       常见原因：Hugo 版本过旧导致 hugo.toml 未被读取，或主题缺失。" >&2
    exit 1
  fi
}

main() {
  cd "$(dirname "${BASH_SOURCE[0]}")"

  export TZ
  # Hugo 缓存放到工作区内，Vercel 会对 .vercel/cache 做构建缓存
  export HUGO_CACHEDIR="${PWD}/.vercel/cache/hugo"

  build_temp_dir=$(mktemp -d)
  mkdir -p "${HOME}/.local" "${HUGO_CACHEDIR}"

  allow_dubious_ownership
  fetch_git_history
  init_submodules
  install_node_deps
  install_dart_sass
  install_go
  install_hugo
  log_versions
  build_site
}

main "$@"
