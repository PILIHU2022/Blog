#!/usr/bin/env node
/**
 * 下载并安装 Dart Sass 的 standalone 二进制到 .sass/
 *
 * 为什么需要这个脚本：
 *   FixIt v1 要求 Dart Sass >= 1.99.0，但 Cloudflare Pages 构建镜像自带的
 *   Embedded Dart Sass 最高只有 1.62.1，直接用会构建失败。
 *   同时不能依赖 npm 上的 `sass` 包：那是 dart2js 生成的 JS 包装器，
 *   Hugo 以可执行文件方式调用它会报 "got unexpected EOF when executing sass"。
 *   因此这里下载官方 standalone 二进制（真正的可执行文件），
 *   并通过 node_modules/.bin 垫片让 Hugo 从 PATH 找到它。
 *
 * 用法：
 *   node scripts/install-dart-sass.mjs            # 安装到 .sass/
 *   node scripts/install-dart-sass.mjs --check    # 已具备有效 sass 则直接跳过
 *   DART_SASS_VERSION=1.105.1 node ...            # 指定版本
 *   DART_SASS_DIR=/some/path node ...             # 指定安装目录
 *
 * postinstall 使用 --check：本地已从系统包管理器装好 Dart Sass 时不会重复下载，
 * 而在 CI（没有系统 Dart Sass）上会正常下载并垫片到 node_modules/.bin。
 *
 * 仅使用 Node 内置模块，无第三方依赖。
 */
import { createWriteStream } from 'node:fs';
import { mkdir, rm, chmod, cp, readdir, symlink, lstat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import os from 'node:os';

const execFileAsync = promisify(execFile);

const VERSION = process.env.DART_SASS_VERSION || '1.105.1';
const INSTALL_DIR = path.resolve(process.env.DART_SASS_DIR || '.sass');
const TMP_DIR = path.join(os.tmpdir(), `dart-sass-${VERSION}-${process.pid}`);

/**
 * FixIt v1 要求的最低 Dart Sass 版本。
 * 必须硬校验：若安装失败而静默回退到 Cloudflare 镜像自带的 1.62.1，
 * 错误会在最后编译 SCSS 时才暴露，且信息难以定位。
 */
const MIN_VERSION = [1, 99, 0];

/** 解析形如 "1.105.1 compiled with dart2js 3.13.5" 的版本号。 */
function parseVersion(output) {
  const m = output.match(/(\d+)\.(\d+)\.(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function assertMinVersion(actual, output) {
  if (!actual) {
    throw new Error(`无法解析 Dart Sass 版本号：${JSON.stringify(output)}`);
  }
  for (let i = 0; i < MIN_VERSION.length; i++) {
    if (actual[i] > MIN_VERSION[i]) return;
    if (actual[i] < MIN_VERSION[i]) {
      throw new Error(
        `Dart Sass ${actual.join('.')} 低于 FixIt v1 要求的 ` +
          `${MIN_VERSION.join('.')}，构建会失败。`,
      );
    }
  }
}

/** 依据当前平台推断官方 release 的资源名。 */
function resolveAsset() {
  const { platform, arch } = process;
  const archMap = { x64: 'x64', arm64: 'arm64', arm: 'arm' };

  if (!archMap[arch]) {
    throw new Error(`不支持的 CPU 架构：${arch}`);
  }

  const platformMap = {
    linux: `linux-${archMap[arch]}`,
    darwin: `macos-${archMap[arch]}`,
    // Windows 为 .zip，且结构不同，这里不自动处理
  };

  if (!platformMap[platform]) {
    throw new Error(
      `不支持的平台：${platform}。请手动安装 Dart Sass >= 1.99.0 并确保它在 PATH 中。`,
    );
  }

  const name = `dart-sass-${VERSION}-${platformMap[platform]}.tar.gz`;
  return {
    name,
    url: `https://github.com/sass/dart-sass/releases/download/${VERSION}/${name}`,
    binary: 'sass',
  };
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`下载失败 ${res.status} ${res.statusText}：${url}`);
  }
  await pipeline(res.body, createWriteStream(dest));
}

/**
 * 把 sass 可执行文件垫片到 node_modules/.bin/sass。
 *
 * 为什么需要：
 *   Cloudflare Pages 执行用户构建命令时，环境来自 npm（npm clean-install），
 *   而 npm 会把 node_modules/.bin 加入子进程的 PATH。
 *   有了这个垫片，裸 `hugo` 也能在 PATH 里找到正确的 Dart Sass，
 *   不必再单独设置任何环境变量。
 *
 * 若 node_modules/.bin/sass 已存在且不是我们的链接（例如装了 npm 的 sass 包，
 * 那是 dart2js 的 JS 包装器，Hugo 调用会报 EOF），则保留原样并给出提示。
 */
async function linkIntoNodeBin(bin) {
  const binDir = path.resolve('node_modules', '.bin');
  const linkPath = path.join(binDir, 'sass');

  try {
    await mkdir(binDir, { recursive: true });
  } catch {
    return null;
  }

  try {
    const st = await lstat(linkPath);
    if (st.isSymbolicLink()) {
      await rm(linkPath, { force: true });
    } else {
      console.log(
        `[dart-sass] 提示：${linkPath} 已存在且不是符号链接，保留不动；` +
          `裸 hugo 请改用 PATH 方式（把 sass 所在目录加入 PATH）`,
      );
      return null;
    }
  } catch {
    // 不存在，正常情况
  }

  try {
    await symlink(path.resolve(bin), linkPath);
    return linkPath;
  } catch (err) {
    console.log(`[dart-sass] 提示：创建 PATH 垫片失败（${err.message}）`);
    return null;
  }
}

/**
 * 检查系统 PATH 中是否已有满足最低版本要求的 Dart Sass。
 * 有则说明本机已用系统包管理器装好（如 pacman -S dart-sass），无需再下载。
 */
async function hasUsableSystemSass() {
  for (const name of ['sass', 'dart-sass']) {
    try {
      const { stdout } = await execFileAsync(name, ['--version']);
      const v = parseVersion(stdout);
      if (v && !isBelowMin(v)) {
        console.log(`[dart-sass] 系统 PATH 已有 Dart Sass ${v.join('.')}（${name}），跳过安装`);
        return true;
      }
    } catch {
      // 不在 PATH 或不可执行，继续尝试下一个
    }
  }
  return false;
}

/** 版本是否低于最低要求。 */
function isBelowMin(actual) {
  for (let i = 0; i < MIN_VERSION.length; i++) {
    if (actual[i] > MIN_VERSION[i]) return false;
    if (actual[i] < MIN_VERSION[i]) return true;
  }
  return false;
}

async function main() {
  const checkOnly = process.argv.includes('--check');
  if (checkOnly && (await hasUsableSystemSass())) {
    return;
  }

  const { name, url, binary } = resolveAsset();
  console.log(`[dart-sass] 版本 ${VERSION} -> ${INSTALL_DIR}`);

  await rm(TMP_DIR, { recursive: true, force: true });
  await mkdir(TMP_DIR, { recursive: true });

  const archive = path.join(TMP_DIR, name);
  console.log(`[dart-sass] 下载 ${url}`);
  await download(url, archive);

  console.log('[dart-sass] 解压');
  await execFileAsync('tar', ['-xzf', archive, '-C', TMP_DIR]);

  // 官方压缩包解压后是 dart-sass/ 目录，其中 sass 是启动脚本，
  // src/dart 才是真正的二进制，必须整体保留。
  // 用 cp 而非 rename：临时目录与安装目录可能不在同一文件系统（EXDEV）。
  const extracted = path.join(TMP_DIR, 'dart-sass');
  await rm(INSTALL_DIR, { recursive: true, force: true });
  await mkdir(path.dirname(INSTALL_DIR), { recursive: true });
  await cp(extracted, INSTALL_DIR, { recursive: true });

  const bin = path.join(INSTALL_DIR, binary);
  await chmod(bin, 0o755);

  // 校验可用性与最低版本要求
  const { stdout } = await execFileAsync(bin, ['--version']);
  const installed = stdout.trim();
  assertMinVersion(parseVersion(installed), installed);
  console.log(`[dart-sass] 安装完成：${installed}`);
  console.log(`[dart-sass] sass 路径=${bin}`);

  const shim = await linkIntoNodeBin(bin);
  if (shim) {
    console.log(`[dart-sass] 已垫片到 PATH：${shim}`);
  }

  await rm(TMP_DIR, { recursive: true, force: true });

  // 列出目录，便于在 CI 日志中确认结构
  const entries = await readdir(INSTALL_DIR);
  console.log(`[dart-sass] 目录内容：${entries.join(', ')}`);
}

main().catch((err) => {
  console.error(`[dart-sass] 安装失败：${err.message}`);
  process.exit(1);
});
