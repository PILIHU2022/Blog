/**
 * Spark's Blog —— Cloudflare Worker
 *
 * 职责：
 *   1. 把 Astro 构建出的 dist/ 作为静态资源提供（ASSETS 绑定）；
 *   2. 每 5 分钟对比 GitHub 分支 HEAD 与当前线上构建的 commit SHA；
 *   3. 发现新提交时调用 Workers Builds 的 Deploy Hook，触发重新构建与部署；
 *   4. 提供可选的 GitHub Webhook（即时触发）与手动触发接口。
 *
 * 说明：Worker 运行时无法执行 `astro build`（需要 npm、Node 构建链、
 * sharp/pagefind 等本地二进制），所以“构建”交给 Cloudflare Workers Builds，
 * 本 Worker 只负责监控和触发。
 */

interface Env {
  /** 静态资源绑定：wrangler.jsonc 中的 assets.binding */
  ASSETS: Fetcher;
  /** 记录上一次触发状态，避免构建期间重复触发 */
  DEPLOY_STATE: KVNamespace;

  /** GitHub 仓库，格式 owner/repo */
  GITHUB_REPO: string;
  /** 要监控的分支 */
  GITHUB_BRANCH: string;
  /** Workers Builds Deploy Hook 的完整 URL（secret） */
  DEPLOY_HOOK_URL: string;
  /** GitHub PAT，公开仓库可省略（secret） */
  GITHUB_TOKEN?: string;
  /** GitHub Webhook secret，配置 Webhook 时必填（secret） */
  WEBHOOK_SECRET?: string;
  /** 手动触发接口的 Bearer Token（secret） */
  MANUAL_DEPLOY_TOKEN?: string;
  /** 触发冷却时间（秒），默认 900 */
  DEPLOY_COOLDOWN_SECONDS?: string;
}

interface BuildInfo {
  sha: string;
  shortSha?: string;
  branch?: string;
  builtAt?: string;
  buildUuid?: string | null;
  source?: string;
}

interface HeadCommit {
  sha: string;
  message: string;
  date: string | null;
  url: string;
}

interface DeployState {
  targetSha: string;
  triggeredAt: number;
  attempts: number;
  buildUuid?: string | null;
  reason: string;
}

interface PushPayload {
  ref?: string;
  after?: string;
  deleted?: boolean;
}

type ReconcileResult =
  | { status: 'up-to-date'; headSha: string; deployedSha: string }
  | { status: 'triggered'; headSha: string; buildUuid: string | null; reason: string }
  | { status: 'skipped'; headSha: string; reason: 'cooldown'; retryAfterSeconds: number }
  | { status: 'skipped'; headSha: string; reason: 'max-attempts'; attempts: number }
  | { status: 'error'; message: string };

const STATE_KEY = 'deploy:last-trigger';
const DEFAULT_COOLDOWN_SECONDS = 900;
// 同一个 commit 最多自动重试 6 次（约 1.5 小时）后停止，避免构建持续失败时
// 无限消耗 Workers Builds 的构建额度。新提交或手动 force 会重新计数。
const MAX_DEPLOY_ATTEMPTS = 6;
const STATE_TTL_SECONDS = 7 * 24 * 60 * 60;
const GITHUB_API_VERSION = '2022-11-28';
const USER_AGENT = 'blog-astro-deploy-worker';

/* -------------------------------------------------------------------------- */
/* 通用工具                                                                    */
/* -------------------------------------------------------------------------- */

function json(data: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  const headers = new Headers(extraHeaders);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new Response(`${JSON.stringify(data, null, 2)}\n`, { status, headers });
}

function methodNotAllowed(allow: string): Response {
  return json({ error: 'method_not_allowed' }, 405, { allow });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function cooldownMs(env: Env): number {
  const seconds = Number(env.DEPLOY_COOLDOWN_SECONDS);
  if (!Number.isFinite(seconds) || seconds <= 0) return DEFAULT_COOLDOWN_SECONDS * 1000;
  return Math.min(Math.max(seconds, 60), 86_400) * 1000;
}

function timingSafeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

function isAuthorized(request: Request, expected: string): boolean {
  const header = request.headers.get('authorization') ?? '';
  const prefix = 'Bearer ';
  return header.startsWith(prefix) && timingSafeEqual(header.slice(prefix.length), expected);
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/* -------------------------------------------------------------------------- */
/* GitHub                                                                      */
/* -------------------------------------------------------------------------- */

async function fetchHead(env: Env): Promise<HeadCommit> {
  const [owner, repo, ...rest] = env.GITHUB_REPO.split('/');
  if (!owner || !repo || rest.length > 0) {
    throw new Error(`GITHUB_REPO 格式应为 owner/repo，当前为 "${env.GITHUB_REPO}"`);
  }

  const endpoint = `https://api.github.com/repos/${owner}/${repo}/commits/${encodeURIComponent(env.GITHUB_BRANCH)}`;
  const headers = new Headers({
    accept: 'application/vnd.github+json',
    'x-github-api-version': GITHUB_API_VERSION,
    'user-agent': USER_AGENT,
  });
  if (env.GITHUB_TOKEN) headers.set('authorization', `Bearer ${env.GITHUB_TOKEN}`);

  const response = await fetch(endpoint, { headers });
  if (!response.ok) {
    const body = (await response.text()).slice(0, 300);
    throw new Error(`GitHub API ${response.status} ${response.statusText}: ${body}`);
  }

  const data = (await response.json()) as {
    sha: string;
    html_url: string;
    commit: {
      message: string;
      author?: { date?: string };
      committer?: { date?: string };
    };
  };

  return {
    sha: data.sha,
    message: data.commit.message.split('\n')[0] ?? '',
    date: data.commit.committer?.date ?? data.commit.author?.date ?? null,
    url: data.html_url,
  };
}

async function verifyGitHubSignature(
  secret: string,
  body: string,
  signature: string,
): Promise<boolean> {
  if (!signature.startsWith('sha256=')) return false;
  const signatureBytes = hexToBytes(signature.slice('sha256='.length));
  if (!signatureBytes) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const signatureBuffer = signatureBytes.buffer.slice(
    signatureBytes.byteOffset,
    signatureBytes.byteOffset + signatureBytes.byteLength,
  ) as ArrayBuffer;

  return crypto.subtle.verify('HMAC', key, signatureBuffer, new TextEncoder().encode(body));
}

/* -------------------------------------------------------------------------- */
/* 部署状态                                                                    */
/* -------------------------------------------------------------------------- */

async function readBuildInfo(env: Env): Promise<BuildInfo | null> {
  try {
    // ASSETS.fetch 只使用 URL 的 pathname，hostname 可以任意填写。
    const response = await env.ASSETS.fetch(new URL('/_deploy.json', 'https://assets.local'));
    if (!response.ok) return null;
    const data = (await response.json()) as BuildInfo;
    return typeof data?.sha === 'string' ? data : null;
  } catch (error) {
    console.warn(JSON.stringify({ event: 'build-info.read.error', message: errorMessage(error) }));
    return null;
  }
}

async function readState(env: Env): Promise<DeployState | null> {
  try {
    return await env.DEPLOY_STATE.get<DeployState>(STATE_KEY, 'json');
  } catch (error) {
    console.warn(JSON.stringify({ event: 'state.read.error', message: errorMessage(error) }));
    return null;
  }
}

async function writeState(env: Env, state: DeployState): Promise<void> {
  try {
    await env.DEPLOY_STATE.put(STATE_KEY, JSON.stringify(state), {
      expirationTtl: STATE_TTL_SECONDS,
    });
  } catch (error) {
    // 状态写失败不应影响已经发出的部署请求；下次 cron 可能重复触发一次。
    console.warn(JSON.stringify({ event: 'state.write.error', message: errorMessage(error) }));
  }
}

/* -------------------------------------------------------------------------- */
/* 触发部署                                                                    */
/* -------------------------------------------------------------------------- */

async function triggerDeploy(
  env: Env,
  reason: string,
  head: HeadCommit,
  attempts: number,
): Promise<string | null> {
  if (!env.DEPLOY_HOOK_URL) throw new Error('缺少 DEPLOY_HOOK_URL secret');

  const response = await fetch(env.DEPLOY_HOOK_URL, {
    method: 'POST',
    headers: { 'user-agent': USER_AGENT },
  });

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = JSON.parse(text);
  } catch {
    // 下面统一按失败处理：Deploy Hook 正常会返回 JSON。
  }

  const failed =
    !response.ok ||
    payload === null ||
    typeof payload !== 'object' ||
    ('success' in payload && payload.success === false);

  if (failed) {
    throw new Error(`Deploy Hook 调用失败（HTTP ${response.status}）：${text.slice(0, 300)}`);
  }

  const buildUuid =
    payload && typeof payload === 'object' && 'result' in payload
      ? ((payload.result as { build_uuid?: string } | null)?.build_uuid ?? null)
      : null;

  await writeState(env, {
    targetSha: head.sha,
    triggeredAt: Date.now(),
    attempts,
    buildUuid,
    reason,
  });

  return buildUuid;
}

async function reconcile(
  env: Env,
  options: { reason: string; force?: boolean },
): Promise<ReconcileResult> {
  let head: HeadCommit;
  try {
    head = await fetchHead(env);
  } catch (error) {
    return { status: 'error', message: errorMessage(error) };
  }

  const deployed = await readBuildInfo(env);
  if (!options.force && deployed?.sha === head.sha) {
    return { status: 'up-to-date', headSha: head.sha, deployedSha: deployed.sha };
  }

  let attempts = 0;
  if (!options.force) {
    const state = await readState(env);
    if (state && state.targetSha === head.sha) {
      attempts = Math.max(state.attempts ?? 1, 1);
      if (attempts >= MAX_DEPLOY_ATTEMPTS) {
        return { status: 'skipped', headSha: head.sha, reason: 'max-attempts', attempts };
      }
      const wait = cooldownMs(env);
      const elapsed = Date.now() - state.triggeredAt;
      if (elapsed >= 0 && elapsed < wait) {
        return {
          status: 'skipped',
          headSha: head.sha,
          reason: 'cooldown',
          retryAfterSeconds: Math.ceil((wait - elapsed) / 1000),
        };
      }
    }
  }

  try {
    const buildUuid = await triggerDeploy(
      env,
      options.reason,
      head,
      options.force ? 1 : attempts + 1,
    );
    return { status: 'triggered', headSha: head.sha, buildUuid, reason: options.reason };
  } catch (error) {
    return { status: 'error', message: errorMessage(error) };
  }
}

async function runReconcile(env: Env, reason: string, force = false): Promise<ReconcileResult> {
  const result = await reconcile(env, { reason, force });
  const log = { event: 'reconcile', reason, ...result };
  if (result.status === 'error') console.error(JSON.stringify(log));
  else console.log(JSON.stringify(log));
  return result;
}

/* -------------------------------------------------------------------------- */
/* 路由                                                                        */
/* -------------------------------------------------------------------------- */

async function handleStatus(env: Env): Promise<Response> {
  const [deployed, state] = await Promise.all([readBuildInfo(env), readState(env)]);
  return json({
    ok: true,
    deployed,
    lastTrigger: state,
    config: {
      repo: env.GITHUB_REPO,
      branch: env.GITHUB_BRANCH,
      cooldownSeconds: Math.round(cooldownMs(env) / 1000),
      githubTokenConfigured: Boolean(env.GITHUB_TOKEN),
      deployHookConfigured: Boolean(env.DEPLOY_HOOK_URL),
      webhookConfigured: Boolean(env.WEBHOOK_SECRET),
      manualDeployConfigured: Boolean(env.MANUAL_DEPLOY_TOKEN),
    },
  });
}

async function handleManualDeploy(request: Request, env: Env, url: URL): Promise<Response> {
  if (!env.MANUAL_DEPLOY_TOKEN) {
    return json({ error: 'manual_deploy_disabled' }, 503);
  }
  if (!isAuthorized(request, env.MANUAL_DEPLOY_TOKEN)) {
    return json({ error: 'unauthorized' }, 401);
  }

  const force = url.searchParams.get('force') === '1';
  const result = await runReconcile(env, force ? 'manual-force' : 'manual', force);
  if (result.status === 'error') return json(result, 502);
  return json(result, result.status === 'triggered' ? 202 : 200);
}

async function handleWebhook(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (!env.WEBHOOK_SECRET) {
    return json({ error: 'webhook_disabled' }, 503);
  }

  const body = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  if (!signature || !(await verifyGitHubSignature(env.WEBHOOK_SECRET, body, signature))) {
    return json({ error: 'invalid_signature' }, 401);
  }

  const event = request.headers.get('x-github-event') ?? '';
  if (event === 'ping') return json({ ok: true, pong: true });
  if (event !== 'push') return json({ ok: true, ignored: `event:${event}` }, 202);

  let payload: PushPayload;
  try {
    payload = JSON.parse(body) as PushPayload;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  if (payload.deleted || payload.ref !== `refs/heads/${env.GITHUB_BRANCH}`) {
    return json({ ok: true, ignored: `ref:${payload.ref ?? 'unknown'}` }, 202);
  }
  if (!payload.after || /^0+$/.test(payload.after)) {
    return json({ ok: true, ignored: 'zero_sha' }, 202);
  }

  // 先返回 2xx，避免 GitHub 因超时重投；实际触发在后台完成。
  ctx.waitUntil(runReconcile(env, 'webhook'));
  return json({ ok: true, queued: true, push: payload.after }, 202);
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (url.pathname === '/api/health') {
        if (request.method !== 'GET' && request.method !== 'HEAD')
          return methodNotAllowed('GET, HEAD');
        return json({ ok: true, now: new Date().toISOString() });
      }

      if (url.pathname === '/api/status') {
        if (request.method !== 'GET') return methodNotAllowed('GET');
        return await handleStatus(env);
      }

      if (url.pathname === '/api/deploy') {
        if (request.method !== 'POST') return methodNotAllowed('POST');
        return await handleManualDeploy(request, env, url);
      }

      if (url.pathname === '/api/github/webhook') {
        if (request.method !== 'POST') return methodNotAllowed('POST');
        return await handleWebhook(request, env, ctx);
      }

      if (url.pathname.startsWith('/api/')) {
        return json({ error: 'not_found' }, 404);
      }

      // 其余请求交给静态资源层（含 not_found_handling: 404-page）。
      return await env.ASSETS.fetch(request);
    } catch (error) {
      console.error(
        JSON.stringify({
          event: 'request.error',
          path: url.pathname,
          message: errorMessage(error),
        }),
      );
      return json({ error: 'internal_error' }, 500);
    }
  },

  async scheduled(_controller, env, ctx): Promise<void> {
    ctx.waitUntil(runReconcile(env, 'cron'));
  },
} satisfies ExportedHandler<Env>;
