/**
 * deals.js — freebie/deals vertical (Stage 1b of proposal.md).
 *
 * Pipeline: Workers Cron → refreshEpicDeals() → D1 `deals` table →
 *           SSR pages (/deals, /deals/games) served worker-first.
 *
 * Data source: Epic Games Store public promotions API. Only 100%-discount
 * offers are kept. Rows upsert by stable id ('epic:<slug>'), so re-running
 * the fetch is always safe; offers ended > 7 days are purged so the section
 * never shows stale deals.
 */

const EPIC_API =
  'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ------------------------------- Cron job -------------------------------- */

export async function refreshEpicDeals(env) {
  const res = await fetch(EPIC_API, { headers: { 'user-agent': 'plobikit-bot/1.0' } });
  if (!res.ok) throw new Error(`epic api ${res.status}`);
  const data = await res.json();
  const elements = data?.data?.Catalog?.searchStore?.elements || [];
  const now = nowSec();

  const stmts = [];
  for (const el of elements) {
    const offers = [
      ...((el.promotions?.promotionalOffers || []).map((w) => w.promotionalOffers || []).flat()),
      ...((el.promotions?.upcomingPromotionalOffers || []).map((w) => w.promotionalOffers || []).flat()),
    ];
    const free = offers.find(
      (o) => o.discountSetting && (o.discountSetting.discountPercentage === 0 || o.discountSetting.discountType === 'FREE')
    );
    if (!free) continue;

    const slug =
      el.productSlug ||
      el.catalogNs?.mappings?.find((m) => m.pageType === 'SLUG')?.pageSlug ||
      String(el.urlSlug || el.id || '').trim();

    const img = (el.keyImages || []).find((k) => k.type === 'OfferImageWide')?.url || '';
    const fmtPrice =
      el.price?.totalPrice?.fmtPrice?.origPrice ||
      (typeof el.price?.totalPrice?.originalPrice === 'number' && el.price.totalPrice.originalPrice > 0
        ? '$' + (el.price.totalPrice.originalPrice / 100).toFixed(2)
        : '');

    stmts.push(
      env.DB.prepare(
        `INSERT INTO deals (id, source, category, title, description, url, image_url, original_price, starts_at, ends_at, updated_at)
         VALUES (?, 'epic', 'games', ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           description = excluded.description,
           url = excluded.url,
           image_url = excluded.image_url,
           original_price = excluded.original_price,
           starts_at = excluded.starts_at,
           ends_at = excluded.ends_at,
           updated_at = excluded.updated_at`
      ).bind(
        'epic:' + slug,
        String(el.title || 'Untitled').slice(0, 120),
        String(el.description || '').slice(0, 300),
        'https://store.epicgames.com/en-US/p/' + slug,
        img,
        fmtPrice,
        ts(free.startDate),
        ts(free.endDate),
        now
      )
    );
  }

  if (stmts.length) await env.DB.batch(stmts);

  // Purge offers that ended over a week ago — never show stale deals.
  await env.DB.prepare('DELETE FROM deals WHERE source = ? AND ends_at < ?').bind('epic', now - 7 * 86400).run();
  return stmts.length;
}

/* -------------------------------- JSON API ------------------------------- */

export async function apiDeals(env, request) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || 'games';
  if (!/^[a-z]{2,16}$/.test(category)) return json({ ok: false, error: 'bad_category' }, 400);
  const now = nowSec();
  const active = await env.DB.prepare(
    'SELECT * FROM deals WHERE category = ? AND starts_at <= ? AND ends_at > ? ORDER BY ends_at'
  )
    .bind(category, now, now)
    .all();
  const upcoming = await env.DB.prepare(
    'SELECT * FROM deals WHERE category = ? AND starts_at > ? ORDER BY starts_at LIMIT 12'
  )
    .bind(category, now)
    .all();
  return json({ ok: true, category, active: active.results || [], upcoming: upcoming.results || [] });
}

/* ------------------------------- SSR pages ------------------------------- */

export async function dealsHubPage(request, env) {
  const now = nowSec();
  const games = await env.DB.prepare('SELECT COUNT(*) AS n FROM deals WHERE category = ? AND ends_at > ?')
    .bind('games', now)
    .first('n');

  const cats = [
    { slug: 'games', name: 'Free Games', live: true, desc: 'Giveaways you can claim and keep forever — Epic Games Store free promotions, refreshed daily from the official store API.' },
    { slug: 'ai', name: 'AI Software Deals', live: false, desc: 'Free tiers, credits, and discounts on AI tools and model APIs.' },
    { slug: 'servers', name: 'Server & VPS Deals', live: false, desc: 'Cloud credits and cheap-VPS promotions for homelabbers and developers.' },
    { slug: 'software', name: 'Software Giveaways', live: false, desc: 'Time-limited free licenses for productivity apps.' },
  ];

  // Honor the visitor's stored language preference (set via the static
  // site). Falls back to Accept-Language, then default English.
  const lang = await resolveLang(request, env);

  const cards = cats
    .map((c) => {
      const badge = c.live
        ? `<span class="badge live">${c.slug === 'games' ? `${games} live` : 'live'}</span>`
        : '<span class="badge soon">coming soon</span>';
      return `
        <div class="cat-card">
          <div class="cat-head"><h2>${c.name}</h2>${badge}</div>
          <p>${c.desc}</p>
          ${c.live ? `<a class="cta" href="/deals/${c.slug}">Browse free games &rarr;</a>` : ''}
        </div>`;
    })
    .join('\n');

  return shell({
    title: 'Free Deals & Giveaways | Plobi-kit',
    description: 'Curated freebies with zero junk: free game giveaways, AI software deals, and server promotions — refreshed automatically, expired offers removed.',
    canonical: 'https://plobikit.com/deals',
    active: 'deals',
    lang,
    content: `
      <h1>Free Deals &amp; Giveaways</h1>
      <p class="intro">
        Hand-checked freebies, aggregated automatically. We pull directly from official
        store APIs on a daily schedule, list only 100%-off offers, and remove anything
        expired — no dead links, no fake discounts, no affiliate padding.
      </p>
      ${cards}`,
  });
}

export async function dealsGamesPage(request, env) {
  const lang = await resolveLang(request, env);
  const now = nowSec();
  const active = await env.DB.prepare(
    'SELECT * FROM deals WHERE category = ? AND starts_at <= ? AND ends_at > ? ORDER BY ends_at'
  )
    .bind('games', now, now)
    .all();
  const upcoming = await env.DB.prepare(
    'SELECT * FROM deals WHERE category = ? AND starts_at > ? ORDER BY starts_at LIMIT 12'
  )
    .bind('games', now)
    .all();

  const card = (d, state) => {
    const when =
      state === 'live'
        ? `Free until ${fmtDate(d.ends_at)} · ${daysLeft(d.ends_at)} left`
        : `Free from ${fmtDate(d.starts_at)}`;
    const price = d.original_price ? `<span class="price">${escapeHtml(d.original_price)}</span> ` : '';
    const badge =
      state === 'live' ? '<span class="badge live">FREE NOW</span>' : '<span class="badge soon">UPCOMING</span>';
    const img = d.image_url
      ? `<img src="${escapeHtml(d.image_url)}" alt="${escapeHtml(d.title)} cover art" loading="lazy">`
      : '';
    return `
      <article class="deal-card">
        ${img}
        <div class="deal-body">
          <div class="deal-head"><h2>${escapeHtml(d.title)}</h2>${badge}</div>
          <p class="deal-when">${price}${escapeHtml(when)}</p>
          <p class="deal-desc">${escapeHtml(d.description)}</p>
          <a class="cta" href="${escapeHtml(d.url)}" target="_blank" rel="noopener nofollow">${
            state === 'live' ? 'Claim on Epic Games' : 'View on Epic Games'
          } &rarr;</a>
        </div>
      </article>`;
  };

  const activeHtml = (active.results || []).map((d) => card(d, 'live')).join('\n');
  const upcomingHtml = (upcoming.results || []).map((d) => card(d, 'upcoming')).join('\n');

  return shell({
    title: 'Free Games Giveaway — Claim & Keep | Plobi-kit',
    description: 'Epic Games Store games currently free to claim and keep forever, plus upcoming giveaways. Refreshed daily from the official API; expired offers are removed automatically.',
    canonical: 'https://plobikit.com/deals/games',
    active: 'deals',
    lang,
    content: `
      <h1>Free Games Giveaway</h1>
      <p class="intro">
        Every game below is 100% off on the Epic Games Store right now or soon — claim it
        during the window and it stays in your library forever. This page refreshes
        automatically every day from Epic's official store API.
      </p>
      <h2 class="section-title">Free right now</h2>
      ${activeHtml || '<p class="empty">No giveaways are live at this exact moment — new ones usually land every Thursday. Check the upcoming list below.</p>'}
      ${upcomingHtml ? '<h2 class="section-title">Upcoming</h2>' + upcomingHtml : ''}
      <div class="note">
        <p><strong>How this works:</strong> we query Epic's public store API on a daily schedule,
        keep only 100%-discount offers, and delete listings a week after they end. Claim windows
        are shown in UTC — double-check the store page before the deadline.</p>
      </div>`,
  });
}

/* ------------------------------ Page shell ------------------------------- */

/**
 * Reuses the site's real stylesheet (/styles.css) and the exact .app-header /
 * .app-footer markup used by every static page, so navigating between static
 * pages and these SSR pages never changes the chrome. Only the deal-specific
 * component styles are local. The language toggle is intentionally absent
 * until these pages get i18n (a CN button would 404).
 */
function shell({ title, description, canonical, active, content, lang = 'en' }) {
  // Localised nav labels. EN-only hub is fine — the *next* click in CN
  // lands on /cn/?lang=cn (handled by client-side language switch).
  const L = lang === 'cn'
    ? { home: '工具首页', cheatsheets: '速查表', guides: '技术教程', deals: '优惠活动', collection: '精选合集', about: '关于我们' }
    : { home: 'Home', cheatsheets: 'Cheat Sheets', guides: 'Guides', deals: 'Deals', collection: 'Collection', about: 'About' };

  const nav = [
    ['/tools/', L.home, 'home'],
    ['/cheatsheets/', L.cheatsheets, 'cheatsheets'],
    ['/guides/', L.guides, 'guides'],
    ['/deals', L.deals, 'deals'],
    ['/collection/', L.collection, 'collection'],
    ['/about', L.about, 'about'],
  ]
    .map(
      ([href, label, key]) =>
        `<a href="${href}" id="nav-${key}"${key === active ? ' class="active"' : ''}>${label}</a>`
    )
    .join('\n        ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/styles.css">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#fafafa">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  main.deals-main { max-width: 860px; margin: 0 auto; padding: 12px 20px 64px; }
  .intro { color: var(--text-muted); font-size: 15px; margin-bottom: 32px; max-width: 640px; line-height: 1.8; }
  .section-title { margin-top: 36px; }
  .cat-card, .deal-card {
    background: var(--bg-card); border: 1px solid var(--border-color);
    border-radius: var(--radius-md); padding: 24px; margin-bottom: 16px;
  }
  .deal-card { display: flex; gap: 20px; padding: 20px; }
  .deal-card img { width: 200px; height: 94px; object-fit: cover; border-radius: var(--radius-sm); flex-shrink: 0; background: var(--accent-light); }
  .deal-body { flex: 1; }
  .deal-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .deal-head h2 { font-size: 17px; margin: 0; }
  .deal-when { font-size: 13px; color: var(--text-main); font-weight: 600; margin: 6px 0; }
  .price { color: var(--text-muted); text-decoration: line-through; font-weight: 400; margin-right: 6px; }
  .deal-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
  .cat-head { display: flex; align-items: center; gap: 10px; }
  .cat-head h2 { margin: 0; font-size: 20px; }
  .cat-card p { font-size: 14px; color: var(--text-muted); margin: 8px 0 16px; }
  .badge { font-size: 11px; font-weight: 700; letter-spacing: 0.4px; padding: 3px 9px; border-radius: 999px; }
  .badge.live { color: #0a7d33; background: rgba(16, 163, 74, 0.12); }
  .badge.soon { color: #b45309; background: rgba(217, 119, 6, 0.12); }
  .cta {
    display: inline-block; background: var(--success-color); color: #fff; font-weight: 600; font-size: 14px;
    padding: 9px 18px; border-radius: var(--radius-sm); text-decoration: none;
  }
  .cta:hover { background: #0059c0; }
  .empty { color: var(--text-muted); font-size: 15px; padding: 16px 0; }
  .note { margin-top: 36px; font-size: 13px; color: var(--text-muted); background: var(--accent-light); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px 20px; }
  @media (max-width: 560px) { .deal-card { flex-direction: column; } .deal-card img { width: 100%; height: auto; aspect-ratio: 2/1; } }
</style>
</head>
<body>

  <div class="app-container">
    <!-- Header (identical structure to static pages) -->
    <header class="app-header">
      <div class="logo">
        <a href="/" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">
          <span class="logo-icon" style="background:var(--success-color);">P</span>
          <span id="txt-logo-name">Plobi-kit</span>
        </a>
      </div>
      <nav class="nav-links">
        ${nav}
      </nav>
      <div class="controls">
        <button class="lang-btn" id="lang-btn" onclick="location.href='/${lang === 'cn' ? '' : 'cn/'}'">${lang === 'cn' ? 'EN' : 'CN'}</button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="deals-main">
      ${content}
    </main>

    <!-- Footer (slim: legal + meta, per site nav spec) -->
    <footer class="app-footer">
      <div class="footer-nav">
        <a href="/privacy" id="nav-footer-privacy" data-i18n="nav-footer.privacy">${lang === 'cn' ? '隐私政策' : 'Privacy Policy'}</a>
        <a href="/terms" id="nav-footer-terms" data-i18n="nav-footer.terms">${lang === 'cn' ? '服务条款' : 'Terms'}</a>
        <a href="/about" id="nav-footer-about" data-i18n="nav-footer.about">${lang === 'cn' ? '关于我们' : 'About'}</a>
        <a href="/contact" id="nav-footer-contact" data-i18n="nav-footer.contact">${lang === 'cn' ? '联系我们' : 'Contact'}</a>
      </div>
      <div class="copyright" id="nav-footer-copy">
        &copy; 2026 Plobi. ${lang === 'cn' ? '保留所有权利。' : 'All rights reserved.'}
      </div>
    </footer>
  </div>

</body>
</html>`;
}

/* -------------------------------- Helpers -------------------------------- */

function fmtDate(unixSec) {
  if (!unixSec) return 'unknown date';
  const d = new Date(unixSec * 1000);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function daysLeft(unixSec) {
  const days = Math.max(0, Math.ceil((unixSec - nowSec()) / 86400));
  return days === 1 ? '1 day' : `${days} days`;
}

function ts(iso) {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : Math.floor(t / 1000);
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Resolve the visitor's preferred language. Order:
 *   1. cookie 'plobi-lang' (set by the static site when the user clicks the toggle)
 *   2. Accept-Language header (first match: en or zh)
 *   3. 'en' fallback
 */
async function resolveLang(request, env) {
  const cookieHeader = request.headers.get('cookie') || '';
  const m = cookieHeader.match(/(?:^|;\s*)plobi-lang=([^;]+)/);
  if (m && (m[1] === 'en' || m[1] === 'cn')) return m[1];
  const accept = request.headers.get('accept-language') || '';
  const first = accept.toLowerCase().split(',')[0] || '';
  if (first.startsWith('zh')) return 'cn';
  return 'en';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}
