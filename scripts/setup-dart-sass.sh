#!/usr/bin/env bash
#
# 把 Dart Sass standalone 二进制安装到项目的 .sass/ 目录。
#
# 为什么需要它：
#   FixIt v1 要求 Dart Sass >= 1.99.0，但 Cloudflare Pages 构建镜像自带的
#   Embedded Dart Sass 最高只有 1.62.1；另外本仓库由两个系统用户共享，
#   各自装在 $HOME 时对方读不到（家目录通常 700）。
#   因此统一装到仓库内的 .sass/，两个用户与 CI 都从同一处读取。
#
# 用法：
#   bash scripts/setup-dart-sass.sh              # 安装
#   DART_SASS_VERSION=1.105.1 bash scripts/...   # 指定版本
#
# 注意：脚本按自身所在位置推导仓库根目录，因此必须在仓库内调用。
#
set -euo pipefail

VERSION="${DART_SASS_VERSION:-1.105.1}"
# 相对仓库根目录的安装位置
DEST_REL="${DART_SASS_DIR:-.sass}"
MIN="1.99.0"

# 无论从哪个目录调用，都切到仓库根目录
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
DEST="$DEST_REL"

case "$(uname -s)/$(uname -m)" in
  Linux/x86_64)   PLATFORM="linux-x64" ;;
  Linux/aarch64)  PLATFORM="linux-arm64" ;;
  Darwin/x86_64)  PLATFORM="macos-x64" ;;
  Darwin/arm64)   PLATFORM="macos-arm64" ;;
  *)
    echo "不支持的平台：$(uname -s)/$(uname -m)" >&2
    echo "请手动安装 Dart Sass >= ${MIN}，并确保 sass 在 PATH 中。" >&2
    exit 1
    ;;
esac

NAME="dart-sass-${VERSION}-${PLATFORM}.tar.gz"
URL="https://github.com/sass/dart-sass/releases/download/${VERSION}/${NAME}"

echo "[dart-sass] 版本 ${VERSION} (${PLATFORM}) -> ${DEST}/"

command -v curl >/dev/null 2>&1 || { echo "缺少 curl" >&2; exit 1; }
command -v tar  >/dev/null 2>&1 || { echo "缺少 tar"  >&2; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "[dart-sass] 下载 ${URL}"
curl -fsSL --retry 3 -o "${TMP}/${NAME}" "$URL"

# 直接解压到目标目录，不使用 cp -R。
# 原因：本仓库目录带默认 ACL，cp 出来的文件权限会被 ACL mask 削成 660，
# 导致同组的另一个用户没有可执行位、无法运行 sass。
# tar 直接落地能让随后的 chmod 稳定生效。
echo "[dart-sass] 解压到 ${DEST}/"
rm -rf "$DEST"
mkdir -p "$DEST"
tar -xzf "${TMP}/${NAME}" --strip-components=1 -C "$DEST"

# 显式给 sass 启动脚本与真正的 dart 二进制设置可执行位。
# 必须对所有用户可执行：协作者通过共享组（agent）身份运行。
# 这里用 install 而非 chmod：本仓库目录带 ACL，chmod 对脚本文件可能被
# ACL 语义吞掉（返回 0 但权限不变）；install 是原子地新建文件，稳定生效。
# 注意：install 直接覆盖目标，不要经过临时文件再 mv —— mv 会换 inode，
# 把 install 设好的权限丢掉。
install -m 755 "${DEST}/sass"     "${DEST}/sass"
install -m 755 "${DEST}/src/dart" "${DEST}/src/dart"

# 实际执行一次，确认真的可用（而不是只检查文件存在）
ACTUAL="$("${DEST}/sass" --version 2>&1 | head -1)" || {
  echo "[dart-sass] 错误：安装后无法执行 ${DEST}/sass" >&2
  echo "          请检查 ${DEST}/src/dart 的可执行位。" >&2
  exit 1
}
echo "[dart-sass] 已安装：${ACTUAL}"

# 硬校验最低版本：版本不足时若静默回退到镜像自带的 1.62.1，
# 错误要到编译 SCSS 阶段才暴露，且信息难以定位。
V="${ACTUAL%% *}"
IFS=. read -r MA MI _ <<<"$V"
MIN_MA="${MIN%%.*}"
MIN_MI="${MIN#*.}"; MIN_MI="${MIN_MI%%.*}"
if [ "$MA" -lt "$MIN_MA" ] || { [ "$MA" -eq "$MIN_MA" ] && [ "$MI" -lt "$MIN_MI" ]; }; then
  echo "[dart-sass] 错误：${V} 低于 FixIt v1 要求的 ${MIN}" >&2
  exit 1
fi

echo "[dart-sass] 完成。构建本机预览："
echo "  PATH=\"$PWD/${DEST}:$PATH\" hugo server -D --disableFastRender"
