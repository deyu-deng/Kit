/**
 * AI free-tier leaderboard (proposal.md stage 2d).
 *
 * Source: OpenRouter's public /api/v1/models catalogue, no API key required.
 * Only rows whose prompt price is exactly 0 are kept. A daily snapshot upserts
 * them and prunes anything that did not appear, so a model that stops being
 * free disappears on its own — the "time-sensitive data must self-expire" rule.
 *
 * No sponsored placements and no hand-picked ranking: ordering is by context
 * window, then id. Deal titles and prices stay in the source's own form.
 */
import { shell, UI, resolveLang } from './deals.js';

const OPENROUTER_API = 'https://openrouter.ai/api/v1/models';
const FRESH_WINDOW_SECONDS = 3600;

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isFree(model) {
  const price = Number(model?.pricing?.prompt);
  return Number.isFinite(price) && price === 0;
}

export async function refreshFreeModels(env) {
  const res = await fetch(OPENROUTER_API, {
    headers: { 'user-agent': 'plobikit-bot/1.0' },
  });
  if (!res.ok) throw new Error(`openrouter api ${res.status}`);
  const data = await res.json();
  const now = Math.floor(Date.now() / 1000);
  const free = (data?.data || []).filter(isFree);

  const stmts = free.map((m) => env.DB.prepare(`
    INSERT INTO ai_models (id, name, context_length, prompt_price, completion_price, url, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      context_length = excluded.context_length,
      prompt_price = excluded.prompt_price,
      completion_price = excluded.completion_price,
      url = excluded.url,
      updated_at = excluded.updated_at
  `).bind(
    String(m.id),
    String(m.name || m.id).slice(0, 120),
    Number(m.context_length) || 0,
    String(m.pricing?.prompt ?? '0'),
    String(m.pricing?.completion ?? ''),
    `https://openrouter.ai/${encodeURI(String(m.id))}`,
    now
  ));
  if (stmts.length) await env.DB.batch(stmts);

  // Anything not seen in this run (or priced again) leaves the leaderboard.
  await env.DB.prepare('DELETE FROM ai_models WHERE updated_at < ?')
    .bind(now - FRESH_WINDOW_SECONDS).run();
  return free.length;
}

export async function apiFreeModels(env) {
  const rows = await env.DB.prepare(
    'SELECT * FROM ai_models ORDER BY context_length DESC, id'
  ).all();
  const models = rows.results || [];
  return new Response(JSON.stringify({ ok: true, count: models.length, models }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function freeModelsPage(request, env) {
  const lang = await resolveLang(request, env);
  const t = UI[lang] || UI.en;
  const rows = await env.DB.prepare(
    'SELECT * FROM ai_models ORDER BY context_length DESC, id'
  ).all();
  const models = rows.results || [];
  const newest = models.reduce((n, m) => Math.max(n, Number(m.updated_at) || 0), 0);
  const stamp = newest
    ? new Date(newest * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
    : '—';

  const table = models.length
    ? `<table class="model-table">
        <thead><tr>
          <th>${t.colModel}</th><th>${t.colContext}</th><th>${t.colPrompt}</th>
          <th>${t.colCompletion}</th><th>${t.colLink}</th>
        </tr></thead>
        <tbody>${models.map((m) => `<tr>
          <td><strong>${esc(m.name)}</strong><br><small>${esc(m.id)}</small></td>
          <td>${Number(m.context_length || 0).toLocaleString('en-US')} ${t.tokens}</td>
          <td>${t.free}</td>
          <td>${esc(m.completion_price || '—')}</td>
          <td><a href="${esc(m.url)}" target="_blank" rel="noopener nofollow">${t.colLink} &rarr;</a></td>
        </tr>`).join('\n')}</tbody>
      </table>`
    : `<p class="empty">${t.modelsEmpty}</p>`;

  return shell({
    title: t.modelsTitle,
    description: t.modelsDesc,
    path: '/ai/free-models',
    active: 'deals',
    lang,
    content: `
      <h1>${t.modelsH1}</h1>
      <p class="intro">${t.modelsIntro}</p>
      ${table}
      <div class="note">
        <p>${t.modelsNote}</p>
        <p>Source: <a href="https://openrouter.ai/models?max_price=0" target="_blank" rel="noopener nofollow">OpenRouter public model catalogue</a> · snapshot: ${stamp} · ${models.length} models.</p>
      </div>`,
  });
}
