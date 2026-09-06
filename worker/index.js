/**
 * Plobi-kit Worker — the dynamic layer behind the static toolkit.
 *
 * Handled here (anything else falls through to static assets, which are
 * served directly by the assets binding and never invoke this Worker):
 *
 *   POST /api/share        create a share link                     → D1
 *   GET  /api/share/:id    share payload as JSON (tool page restore) → D1
 *   GET  /s/:id            server-rendered share page (social-crawler friendly)
 *   POST /api/contact      contact form submission                  → D1
 *   GET  /api/deals        deals JSON feed (?category=games)        → D1
 *   GET  /api/deals/refresh  manual deals refresh (gated by DEBUG_KEY)
 *   GET  /deals            deals hub (SSR)                          → D1
 *   GET  /deals/games      Epic free games (SSR)                    → D1
 *   GET  /deals/:cat       servers | software | ai (SSR)            → D1
 *   GET  /api/health       liveness probe
 *
 * Design notes:
 *  - D1 (not KV) backs the shares: KV is eventually consistent, which would
 *    make a freshly created link 404 for its first readers. D1 is strongly
 *    consistent, so a share link works the moment it is returned.
 *  - Rate limiting: fixed 60-second windows counted in D1, keyed by
 *    bucket + client IP. Approximate by design (D1 has one writer), which
 *    is fine for abuse damping.
 *  - The share page only renders whitelisted, escaped text server-side.
 *    Tool state is never interpolated into HTML — the tool page fetches it
 *    as JSON and applies it locally, honoring the privacy-first contract.
 */

import { refreshAllDeals, apiDeals, dealsHubPage, dealsGamesPage, dealsCategoryPage } from './deals.js';

const SITE_URL = 'https://plobikit.com';
const SHARE_TTL_SECONDS = 30 * 24 * 60 * 60;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_STATE_BYTES = 12 * 1024;
const ID_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

const TOOLS = {
  base64: { en: 'Base64 Encoder / Decoder', cn: 'Base64 编解码器' },
  codeimage: { en: 'Code Screenshot Generator', cn: '代码截图生成器' },
  colorpalette: { en: 'Color Palette Generator', cn: '配色方案生成器' },
  cron: { en: 'Cron Expression Visualizer', cn: 'Cron 表达式可视化' },
  flexgrid: { en: 'Flexbox Grid Builder', cn: 'Flexbox 网格生成器' },
  git: { en: 'Git Command Builder', cn: 'Git 命令生成器' },
  glassmorphism: { en: 'Glassmorphism Generator', cn: '毛玻璃效果生成器' },
  image: { en: 'Image Compressor', cn: '图片压缩工具' },
  json: { en: 'JSON Formatter', cn: 'JSON 格式化工具' },
  jwt: { en: 'JWT Decoder', cn: 'JWT 解码器' },
  markdown: { en: 'Markdown Previewer', cn: 'Markdown 预览器' },
  metatags: { en: 'Meta Tag Generator', cn: 'Meta 标签生成器' },
  prompt: { en: 'Prompt Helper', cn: 'Prompt 助手' },
  qrcode: { en: 'QR Code Generator', cn: '二维码生成器' },
  regex: { en: 'Regex Tester', cn: '正则表达式测试器' },
  svg: { en: 'SVG Icon Library', cn: 'SVG 图标库' },
  url: { en: 'URL Encoder / Decoder', cn: 'URL 编解码器' },
};

export default {
  async fetch(request, env, ctx) {
    try {
      return await route(request, env, ctx);
    } catch (err) {
      console.error('worker error:', (err && err.message) || err);
      return json({ ok: false, error: 'internal_error' }, 500);
    }
  },

  // Daily housekeeping (see triggers.crons in wrangler.jsonc):
  // purge expired share links + stale rate-limit windows, then refresh
  // every deals source. A failed upstream fetch never blocks cleanup.
  async scheduled(_event, env, _ctx) {
    const now = nowSec();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM shares WHERE expires_at < ?').bind(now),
      env.DB.prepare('DELETE FROM rate_counters WHERE w < ?').bind(Math.floor(now / 60) - 10),
    ]);
    try {
      const out = await refreshAllDeals(env);
      console.log('deals refresh:', JSON.stringify(out));
    } catch (err) {
      console.error('deals refresh failed:', (err && err.message) || err);
    }
  },
};

async function route(request, env, ctx) {
  const url = new URL(request.url);
  let path = url.pathname;
  if (path.length > 1 && path.endsWith('/')) path = path.replace(/\/+$/, '') || '/';

  if (path === '/api/health') return json({ ok: true, ts: nowSec() });

  if (path === '/api/share') {
    if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
    return createShare(request, env, ctx);
  }

  if (path.startsWith('/api/share/')) {
    if (request.method !== 'GET') return json({ ok: false, error: 'method_not_allowed' }, 405);
    return getShareJson(path.slice('/api/share/'.length), env);
  }

  if (path.startsWith('/s/')) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return json({ ok: false, error: 'method_not_allowed' }, 405);
    }
    return getSharePage(path.slice(3), env);
  }

  if (path === '/api/contact') {
    if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
    return submitContact(request, env, ctx);
  }

  // Deals vertical (worker-first SSR — see run_worker_first in wrangler.jsonc)
  if (path === '/deals') return html(await dealsHubPage(request, env), 200);
  if (path === '/deals/games') return html(await dealsGamesPage(request, env), 200);
  const catMatch = path.match(/^\/deals\/(servers|software|ai)$/);
  if (catMatch) {
    const page = await dealsCategoryPage(request, env, catMatch[1]);
    if (page) return html(page, 200);
  }
  if (path === '/api/deals') return apiDeals(env, request);

  // Manual deals refresh for ops (gated by DEBUG_KEY secret; cron runs daily anyway).
  if (path === '/api/deals/refresh') {
    if (!env.DEBUG_KEY || url.searchParams.get('key') !== env.DEBUG_KEY) {
      return json({ ok: false, error: 'forbidden' }, 403);
    }
    const out = await refreshAllDeals(env);
    return json({ ok: true, out });
  }

  if (path.startsWith('/api/')) return json({ ok: false, error: 'not_found' }, 404);

  // Static assets are matched before this Worker runs; reaching this point
  // means no asset matched, so serve a branded 404 (unless the assets
  // binding itself resolves the request, e.g. via html_handling redirects).
  const asset = await env.ASSETS.fetch(request);
  if (asset.status !== 404) return asset;
  return html(notFoundHTML(), 404);
}

/* ---------------------------------- API ---------------------------------- */

async function createShare(request, env, ctx) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!(await checkRate(env, ctx, 'share', ip, 10))) {
    return json({ ok: false, error: 'rate_limited', retry_after: 60 }, 429, { 'Retry-After': '60' });
  }

  const body = await readJson(request);
  if (body === null) return json({ ok: false, error: 'invalid_json' }, 400);

  const tool = typeof body.tool === 'string' ? body.tool : '';
  if (!TOOLS[tool]) return json({ ok: false, error: 'unknown_tool' }, 400);

  const lang = body.lang === 'cn' ? 'cn' : 'en';

  const title = cleanText(body.title, 120);
  if (!title) return json({ ok: false, error: 'missing_title' }, 400);

  const description = cleanText(body.description, 300);

  if (body.state === null || typeof body.state !== 'object') {
    return json({ ok: false, error: 'invalid_state' }, 400);
  }
  let stateJson;
  try {
    stateJson = JSON.stringify(body.state);
  } catch {
    return json({ ok: false, error: 'invalid_state' }, 400);
  }
  if (stateJson.length > MAX_STATE_BYTES) {
    return json({ ok: false, error: 'state_too_large' }, 400);
  }

  const now = nowSec();
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = makeId(8);
    try {
      await env.DB.prepare(
        'INSERT INTO shares (id, tool, lang, title, description, state, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(id, tool, lang, title, description, stateJson, now, now + SHARE_TTL_SECONDS)
        .run();
      return json({ ok: true, id, url: `/s/${id}`, expires_in_days: 30 });
    } catch (err) {
      // Only a primary-key collision is retryable.
      if (!String(err).includes('UNIQUE')) throw err;
    }
  }
  throw new Error('share id collision');
}

async function getShareJson(id, env) {
  const share = await fetchShare(id, env);
  if (!share) return json({ ok: false, error: 'not_found' }, 404);
  return json({
    ok: true,
    share: {
      tool: share.tool,
      lang: share.lang,
      title: share.title,
      description: share.description,
      state: JSON.parse(share.state),
      created_at: share.created_at,
      expires_at: share.expires_at,
    },
  });
}

async function submitContact(request, env, ctx) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!(await checkRate(env, ctx, 'contact', ip, 3))) {
    return json({ ok: false, error: 'rate_limited', retry_after: 60 }, 429, { 'Retry-After': '60' });
  }

  const body = await readJson(request);
  if (body === null) return json({ ok: false, error: 'invalid_json' }, 400);

  // Honeypot: real users never see the "company" field. Bots that fill it
  // get a fake success and are dropped silently.
  if (typeof body.company === 'string' && body.company.trim() !== '') return json({ ok: true });

  const name = cleanText(body.name, 100);
  const email = cleanText(body.email, 254);
  const message = cleanText(body.message, 5000);
  if (!name || !message) return json({ ok: false, error: 'missing_fields' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ ok: false, error: 'invalid_email' }, 400);
  }

  await env.DB.prepare(
    'INSERT INTO contact_messages (name, email, message, ip, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(name, email, message, ip, nowSec())
    .run();

  return json({ ok: true });
}

/* -------------------------------- Storage -------------------------------- */

async function fetchShare(id, env) {
  if (!/^[A-Za-z0-9]{4,16}$/.test(id)) return null;
  const row = await env.DB.prepare(
    'SELECT id, tool, lang, title, description, state, created_at, expires_at FROM shares WHERE id = ? AND expires_at > ?'
  )
    .bind(id, nowSec())
    .first();
  return row || null;
}

async function checkRate(env, ctx, bucket, ip, limit) {
  const window = Math.floor(Date.now() / 60000);
  const key = `${bucket}:${ip || 'unknown'}`;
  const count = await env.DB.prepare(
    "INSERT INTO rate_counters (k, w, n) VALUES (?, ?, 1) ON CONFLICT(k, w) DO UPDATE SET n = n + 1 RETURNING n"
  )
    .bind(key, window)
    .first('n');
  if (Math.random() < 0.02) {
    // Opportunistic housekeeping so the counters table stays small even
    // before the daily cron ever runs.
    ctx.waitUntil(
      env.DB.batch([
        env.DB.prepare('DELETE FROM rate_counters WHERE w < ?').bind(window - 10),
        env.DB.prepare('DELETE FROM shares WHERE expires_at < ?').bind(nowSec()),
      ])
    );
  }
  return count <= limit;
}

/* -------------------------------- Pages ---------------------------------- */

async function getSharePage(id, env) {
  const share = await fetchShare(id, env);
  if (!share) return html(expiredHTML(), 404);
  return html(sharePageHTML(share), 200, { 'cache-control': 'public, max-age=300' });
}

function sharePageHTML(share) {
  const lang = share.lang === 'cn' ? 'cn' : 'en';
  const isCN = lang === 'cn';
  const toolName = (TOOLS[share.tool] && TOOLS[share.tool][lang]) || share.tool;
  const title = escapeHtml(share.title);
  const description = escapeHtml(share.description) ||
    (isCN ? '一个通过 Plobi-kit 分享的配置。' : 'A setup shared via Plobi-kit.');
  const toolUrl = `${isCN ? '/cn' : ''}/tools/${share.tool}.html?share=${encodeURIComponent(share.id)}`;
  const openLabel = isCN ? `在${toolName}中打开` : `Open in ${toolName}`;
  const note = isCN
    ? '此分享链接将在 30 天后过期。打开工具时，配置仅在你的浏览器中本地恢复。'
    : 'This share link expires in 30 days. When you open the tool, the setup is restored locally in your browser.';
  const home = isCN ? '/cn/' : '/';
  const tagline = isCN ? '隐私优先、全部在浏览器中运行的开发者工具箱。' : 'Privacy-first tools that run in your browser.';

  return `<!DOCTYPE html>
<html lang="${isCN ? 'zh' : 'en'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | Plobi-kit</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${SITE_URL}/s/${share.id}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Plobi-kit">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${SITE_URL}/s/${share.id}">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background: #fafafa; color: #111; min-height: 100vh;
    display: flex; flex-direction: column; align-items: center;
    padding: 48px 20px; line-height: 1.6;
  }
  .brand { font-weight: 700; font-size: 15px; letter-spacing: -0.2px; margin-bottom: 36px; }
  .brand a { color: #111; text-decoration: none; }
  .brand span { color: #0070f3; }
  main { width: 100%; max-width: 560px; background: #fff; border: 1px solid #e5e5e5;
    border-radius: 12px; padding: 40px; }
  .badge { display: inline-block; font-size: 12px; font-weight: 600; color: #0070f3;
    background: rgba(0, 112, 243, 0.08); padding: 4px 10px; border-radius: 999px; margin-bottom: 16px; }
  h1 { font-size: 26px; letter-spacing: -0.5px; margin-bottom: 12px; word-break: break-word; }
  .desc { font-size: 15px; color: #666; margin-bottom: 28px; word-break: break-word; }
  .cta { display: inline-block; background: #0070f3; color: #fff; font-weight: 600;
    font-size: 15px; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
  .cta:hover { background: #0059c0; }
  .note { font-size: 13px; color: #999; margin-top: 28px; }
  footer { margin-top: 40px; font-size: 13px; color: #999; text-align: center; }
  footer a { color: #0070f3; text-decoration: none; }
  @media (max-width: 480px) { main { padding: 28px 20px; } }
</style>
</head>
<body>
  <div class="brand"><a href="${home}">Plobi<span>-kit</span></a></div>
  <main>
    <div class="badge">${toolName}</div>
    <h1>${title}</h1>
    <p class="desc">${description}</p>
    <a class="cta" href="${toolUrl}">${openLabel} &rarr;</a>
    <p class="note">${note}</p>
  </main>
  <footer>Powered by <a href="${home}">Plobi-kit</a> — ${tagline}</footer>
</body>
</html>`;
}

function expiredHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Link expired | Plobi-kit</title>
<meta name="robots" content="noindex">
<style>
  body { font-family: 'Inter', -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background: #fafafa; color: #111; min-height: 60vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center; padding: 40px 20px; line-height: 1.7; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  p { color: #666; margin-bottom: 24px; }
  a { background: #0070f3; color: #fff; font-weight: 600; padding: 12px 24px;
    border-radius: 8px; text-decoration: none; }
</style>
</head>
<body>
  <h1>Link expired · 链接已过期</h1>
  <p>This share link has expired or does not exist.<br>该分享链接已过期或不存在。</p>
  <a href="/">Go to Plobi-kit · 返回首页</a>
</body>
</html>`;
}

function notFoundHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>404 | Plobi-kit</title>
<meta name="robots" content="noindex">
<style>
  body { font-family: 'Inter', -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background: #fafafa; color: #111; min-height: 60vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center; padding: 40px 20px; line-height: 1.7; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  p { color: #666; margin-bottom: 24px; }
  a { background: #0070f3; color: #fff; font-weight: 600; padding: 12px 24px;
    border-radius: 8px; text-decoration: none; }
</style>
</head>
<body>
  <h1>404 · Page not found</h1>
  <p>The page you are looking for does not exist.<br>页面不存在。</p>
  <a href="/">Go to Plobi-kit · 返回首页</a>
</body>
</html>`;
}

/* -------------------------------- Helpers -------------------------------- */

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      ...extraHeaders,
    },
  });
}

function html(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      ...extraHeaders,
    },
  });
}

async function readJson(request) {
  const len = parseInt(request.headers.get('content-length') || '0', 10);
  if (len > MAX_BODY_BYTES) return null;
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength);
}

function makeId(length) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = '';
  for (const b of bytes) out += ID_ALPHABET[b % ID_ALPHABET.length];
  return out;
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
