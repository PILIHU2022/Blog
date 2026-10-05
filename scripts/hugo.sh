#!/usr/bin/env bash
#
# Hugo 包装脚本：自动定位（必要时安装）Dart Sass，然后调用 hugo。
#
# 目的：FixIt v1 必须有 Dart Sass 才能编译 SCSS。直接运行 hugo 时
#       Hugo 只会在 PATH 里找 sass，找不到就报
#       "You need to install Dart Sass"，非常难定位。
#       本脚本负责把 HUGO_SASS_BINARY 指向仓库内的 .sass/sass。
#
# 用法：
#   bash scripts/hugo.sh server -D --disableFastRender   # 本地预览
#   bash scripts/hugo.sh --gc --minify                   # 生产构建
#
# 也可在 shell rc 里 `export PATH="$PWD/scripts:$PATH"` 后直接：
#   hugo.sh server -D
#
set -euo pipefail

# 按脚本自身位置推导仓库根目录（兼容通过软链调用）
SOURCE="${BASH_SOURCE[0]}"
while [ -L "$SOURCE" ]; do
  DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  case "$SOURCE" in /*) ;; *) SOURCE="${DIR}/${SOURCE}" ;; esac
done
REPO_ROOT="$(cd -P "$(dirname "$SOURCE")/.." && pwd)"
cd "$REPO_ROOT"

# 先看文件在不在（避免每次都重新下载），再在下面统一校验可执行性
if [ ! -f ".sass/sass" ]; then
  echo "[hugo] 未找到 Dart Sass，正在安装到 .sass/ ..." >&2
  if command -v node >/dev/null 2>&1; then
    DART_SASS_DIR=.sass node scripts/install-dart-sass.mjs >&2
  else
    bash scripts/setup-dart-sass.sh >&2
  fi
fi
SASS=".sass/sass"

# 兜底：某些共享/ACL 环境会把 sass 启动脚本的权限压成 660，
# 但真正的二进制 src/dart 仍可执行。此时直接调用 Dart 二进制，
# 避免因一个权限位而无法构建。
SASS_BIN="$SASS"
if [ ! -x "$SASS" ]; then
  if [ -x ".sass/src/dart" ] && [ -f ".sass/src/dart.js" ]; then
    SASS_BIN=".sass/src/dart"
    echo "[hugo] 提示：.sass/sass 缺少可执行位，改用 .sass/src/dart" >&2
  else
    echo "[hugo] 错误：Dart Sass 不可执行：${SASS}" >&2
    echo "[hugo] 请执行：chmod 755 .sass/sass .sass/src/dart" >&2
    exit 1
  fi
fi

command -v hugo >/dev/null 2>&1 || {
  echo "[hugo] 错误：未找到 hugo，请先安装 Hugo extended (>= 0.166.0)" >&2
  exit 1
}

# 相对路径由 Hugo 按项目根目录解析
export HUGO_SASS_BINARY="$SASS_BIN"
exec hugo "$@"
