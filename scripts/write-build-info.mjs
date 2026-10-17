#!/usr/bin/env node
/**
 * 生成 dist/_deploy.json，记录本次构建对应的 commit。
 *
 * Workers Builds 会在构建阶段注入 WORKERS_CI_COMMIT_SHA / WORKERS_CI_BRANCH /
 * WORKERS_CI_BUILD_UUID；本地构建则回退到 git 命令。Worker 在 cron 中读取这个
 * 文件，与 GitHub 分支 HEAD 对比，从而判断线上是否落后。
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const sha =
  process.env.WORKERS_CI_COMMIT_SHA || process.env.GITHUB_SHA || git(['rev-parse', 'HEAD']);
const branch =
  process.env.WORKERS_CI_BRANCH ||
  process.env.GITHUB_REF_NAME ||
  git(['rev-parse', '--abbrev-ref', 'HEAD']) ||
  'unknown';

if (!/^[0-9a-f]{7,64}$/i.test(sha)) {
  console.error(
    `[build-info] 无法确定有效的 commit SHA（得到 "${sha}"）：请设置 WORKERS_CI_COMMIT_SHA 或在 git 仓库中构建。`,
  );
  process.exit(1);
}

const info = {
  sha,
  shortSha: sha.slice(0, 7),
  branch,
  builtAt: new Date().toISOString(),
  buildUuid: process.env.WORKERS_CI_BUILD_UUID ?? null,
  source: process.env.WORKERS_CI
    ? 'workers-builds'
    : process.env.GITHUB_ACTIONS
      ? 'github-actions'
      : 'local',
};

const outputDir = resolve(process.cwd(), 'dist');
mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, '_deploy.json'), `${JSON.stringify(info, null, 2)}\n`, 'utf8');

console.log(`[build-info] ${info.branch}@${info.shortSha} (${info.source}) -> dist/_deploy.json`);
