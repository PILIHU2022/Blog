#!/usr/bin/env bash
#
# Vercel 构建脚本（基于 Hugo 官方 Host on Vercel 指南）
# https://gohugo.io/host-and-deploy/host-on-vercel/
#
# 为什么需要它：
#   Vercel 默认不提供 Dart Sass，且默认 Hugo 版本可能低于 FixIt v1
#   要求的 0.166.0。本脚本把 Hugo 与 Dart Sass 的版本钉死在仓库里，
#   因此 Vercel 侧不需要任何环境变量。
#
set -euo pipefail

# ---------------------------------------------------------------------------
# 工具版本
# ---------------------------------------------------------------------------
DART_SASS_VERSION=1.105.1
HUGO_VERSION=0.167.0          # FixIt v1 要求 >= 0.166.0
GO_VERSION=1.27.1             # 仅在存在 go.mod（Hugo Modules）时使用
NODE_VERSION=24.21.0          # 仅在存在 package-lock.json 时使用

TZ=Asia/Shanghai

# Hugo 缓存放到工作区内（Vercel 会对其做构建缓存）
HUGO_CACHEDIR="${PWD}/.vercel/cache/hugo"

cleanup() {
  if [[ -n "${build_temp_dir:-}" && -d "${build_temp_dir}" ]]; then
    rm -rf "${build_temp_dir}"
  fi
}
trap cleanup EXIT SIGINT SIGTERM

main() {
  export TZ
  export HUGO_CACHEDIR

  build_temp_dir=$(mktemp -d)
  mkdir -p "${HOME}/.local"

  # -------------------------------------------------------------------------
  # 初始化主题 submodule（必须在构建前完成）
  # -------------------------------------------------------------------------
  if [[ -f .gitmodules ]]; then
    echo "Initializing Git submodules..."
    git submodule update --init --recursive
  fi

  # -------------------------------------------------------------------------
  # Node 依赖（本项目当前不需要；保留以免将来新增前端工具链时遗漏）
  # -------------------------------------------------------------------------
  if [[ -f package-lock.json ]]; then
    echo "Installing Node.js ${NODE_VERSION}..."
    curl -sfL --output-dir "${build_temp_dir}" -O \
      "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz"
    tar -C "${HOME}/.local" -xf "${build_temp_dir}/node-v${NODE_VERSION}-linux-x64.tar.gz"
    export PATH="${HOME}/.local/node-v${NODE_VERSION}-linux-x64/bin:${PATH}"

    echo "Installing Node.js dependencies..."
    npm ci
  fi

  # -------------------------------------------------------------------------
  # Dart Sass（FixIt v1 必需，>= 1.99.0）
  # -------------------------------------------------------------------------
  echo "Installing Dart Sass ${DART_SASS_VERSION}..."
  curl -sfL --output-dir "${build_temp_dir}" -O \
    "https://github.com/sass/dart-sass/releases/download/${DART_SASS_VERSION}/dart-sass-${DART_SASS_VERSION}-linux-x64.tar.gz"
  tar -C "${HOME}/.local" -xf \
    "${build_temp_dir}/dart-sass-${DART_SASS_VERSION}-linux-x64.tar.gz"
  export PATH="${HOME}/.local/dart-sass:${PATH}"

  # -------------------------------------------------------------------------
  # Go（仅 Hugo Modules 需要；本项目用 Git submodule，跳过）
  # -------------------------------------------------------------------------
  if [[ -f go.mod ]]; then
    echo "Installing Go ${GO_VERSION}..."
    curl -sfL --output-dir "${build_temp_dir}" -O \
      "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz"
    tar -C "${HOME}/.local" -xf "${build_temp_dir}/go${GO_VERSION}.linux-amd64.tar.gz"
    export PATH="${HOME}/.local/go/bin:${PATH}"
  fi

  # -------------------------------------------------------------------------
  # Hugo extended（FixIt 需要 extended 版以处理 SCSS 资源管道）
  # -------------------------------------------------------------------------
  echo "Installing Hugo extended ${HUGO_VERSION}..."
  curl -sfL --output-dir "${build_temp_dir}" -O \
    "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz"
  mkdir -p "${HOME}/.local/hugo"
  tar -C "${HOME}/.local/hugo" -xf \
    "${build_temp_dir}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz"
  export PATH="${HOME}/.local/hugo:${PATH}"

  # -------------------------------------------------------------------------
  # 打印版本，便于在 Vercel 日志中核对
  # -------------------------------------------------------------------------
  echo "Logging tool versions..."
  echo "Dart Sass: $(sass --version)"
  echo "Hugo: $(hugo version)"
  command -v go >/dev/null 2>&1 && echo "Go: $(go version)" || true
  command -v node >/dev/null 2>&1 && echo "Node.js: $(node --version)" || true

  # -------------------------------------------------------------------------
  # 构建
  # -------------------------------------------------------------------------
  echo "Building the project..."
  hugo --gc --minify
}

main "$@"
