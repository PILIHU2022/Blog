#!/usr/bin/env bash
#
# Cloudflare Pages 构建脚本：固定 Hugo 版本后构建站点。
#
# 为什么要固定版本：
#   Cloudflare 构建镜像的 Hugo 默认版本可能偏旧（实测遇到过 0.147.7），
#   而 FixIt v1 要求 Hugo >= 0.166.0，且主题用到 hugo.Data
#   （该函数自 Hugo v0.156.0 才引入）。版本不足会在处理
#   themes/FixIt/content/_authors/_content.gotmpl 时报
#   "can't evaluate field Data"，错误信息难以直接定位到版本问题。
#   面板上的 HUGO_VERSION 环境变量若未生效，本脚本仍能保证正确版本。
#
# Dart Sass 由 package.json 的 postinstall 负责（下载并垫片到
# node_modules/.bin，Hugo 按 PATH 查找即可），本脚本不重复处理。
#
set -euo pipefail

HUGO_VERSION="${HUGO_VERSION:-0.167.0}"
HUGO_BIN_DIR="${HUGO_BIN_DIR:-${PWD}/.hugo-bin}"

# 已有满足要求的 hugo 就直接用（例如环境已通过 HUGO_VERSION 装好）
use_existing() {
  command -v hugo >/dev/null 2>&1 || return 1
  local v
  v="$(hugo version | sed -n 's/.*v\([0-9][0-9.]*\).*/\1/p' | head -1)"
  [ -n "$v" ] || return 1
  # 与要求的最低版本比较
  local IFS=. ; set -- $v ; local ma="$1" mi="$2"
  [ "$ma" -gt 0 ] || [ "$mi" -ge 166 ]
}

if use_existing; then
  echo "[build] 使用已有 hugo: $(hugo version)"
else
  case "$(uname -s)/$(uname -m)" in
    Linux/x86_64)   ASSET="hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz" ;;
    Linux/aarch64)  ASSET="hugo_extended_${HUGO_VERSION}_linux-arm64.tar.gz" ;;
    Darwin/x86_64)  ASSET="hugo_extended_${HUGO_VERSION}_darwin-universal.tar.gz" ;;
    Darwin/arm64)   ASSET="hugo_extended_${HUGO_VERSION}_darwin-universal.tar.gz" ;;
    *) echo "[build] 不支持的平台：$(uname -s)/$(uname -m)" >&2; exit 1 ;;
  esac

  URL="https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${ASSET}"
  echo "[build] 镜像内 hugo 版本不满足要求，下载 v${HUGO_VERSION}"
  echo "[build] ${URL}"

  mkdir -p "$HUGO_BIN_DIR"
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  curl -fsSL --retry 3 -o "${TMP}/hugo.tgz" "$URL"
  tar -xzf "${TMP}/hugo.tgz" -C "$HUGO_BIN_DIR" hugo
  chmod 755 "${HUGO_BIN_DIR}/hugo"

  PATH="${HUGO_BIN_DIR}:${PATH}"
  export PATH
  echo "[build] 已就绪: $("${HUGO_BIN_DIR}/hugo" version)"
fi

exec hugo "$@"
