/**
 * deals.js — freebie/deals vertical.
 *
 * Pipeline: Workers Cron → refreshAllDeals() → D1 `deals` table →
 *           SSR pages (/deals, /deals/games, /deals/:cat) served worker-first.
 *
 * Sources: first-party store APIs (Epic, Steam), two giveaway trackers
 * (freetokeep.gg, GamerPower — see SOURCE_INFO for the attribution link each
 * one requires), and RSS feeds for servers/software. Each refresher is
 * independent, upserts by a stable id, and purges its own expired rows, so a
 * dead upstream can never take the whole section down. See DEPLOY.md for the
 * full source table, dedupe rule and snapshot-vs-incremental semantics.
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
      -- category is included so a re-classified item (e.g. an AI news story
      -- that no longer qualifies as a giveaway) moves back to its real feed
      -- on the next cron run instead of staying stuck in the wrong vertical.
      category = excluded.category,
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

/* ---------------------------- RSS feed sources ---------------------------- */

const SOURCES = {
  leb: { feed: 'https://lowendbox.com/feed/', category: 'servers', windowDays: 30 },
  // GiveawayOfTheDay's Feedburner feed is gone (502 since 2026-11). This is a
  // live daily software-giveaway feed; titleMatch keeps the coupon posts out.
  tick: { feed: 'https://giveaway.tickcoupon.com/feed/', category: 'software', windowDays: 7, titleMatch: /giveaway/i },
  sos: { feed: 'https://www.sharewareonsale.com/feed', category: 'software', windowDays: 7 },
};

/**
 * How each source is credited on the page. `credit` sources require a visible
 * attribution with an active link under their API terms — GamerPower's free
 * API is commercial-use OK on exactly that condition.
 */
export const SOURCE_INFO = {
  epic:      { label: 'Epic Games Store', home: 'https://store.epicgames.com/' },
  steam:     { label: 'Steam', home: 'https://store.steampowered.com/' },
  ftk:       { label: 'freetokeep.gg', home: 'https://freetokeep.gg/', credit: true },
  ftkfw:     { label: 'freetokeep.gg · Steam', home: 'https://freetokeep.gg/free-weekends', credit: true },
  gp:        { label: 'GamerPower', home: 'https://www.gamerpower.com/', credit: true },
  fgf:       { label: 'r/FreeGameFindings', home: 'https://www.reddit.com/r/FreeGameFindings/' },
  leb:       { label: 'LowEndBox', home: 'https://lowendbox.com/' },
  tick:      { label: 'Software Giveaway', home: 'https://giveaway.tickcoupon.com/' },
  sos:       { label: 'SharewareOnSale', home: 'https://www.sharewareonsale.com/' },
  'ai-curate': { label: 'Plobi-kit', home: 'https://plobikit.com/' },
};

const HEADERS = { 'user-agent': 'plobikit-deals/1.0 (+https://plobikit.com/deals)' };
// When several trackers report the same giveaway, keep the first-party store
// row and drop the aggregator copies. Used by the read path, not the writers.
const SOURCE_RANK = `CASE source
      WHEN 'epic' THEN 0 WHEN 'steam' THEN 1 WHEN 'ftk' THEN 2 WHEN 'ftkfw' THEN 3
      WHEN 'gp' THEN 4 WHEN 'fgf' THEN 5 ELSE 9 END`;
// Editorial ordering: an in-game coupon code should never sit above a full
// game just because it expires sooner. Ranked after the dedupe priority.
const ITEM_RANK = `CASE WHEN source = 'gp' AND (description LIKE '[DLC]%'
      OR description LIKE '[Other]%') THEN 1 ELSE 0 END`;

const AI_KEYWORDS = /\b(ai|a\.i\.|gpt|llm|chatgpt|copilot|claude|gemini|machine learning|neural)\b/i;
const GIVEAWAY_WORDS = /\b(free|giveaway|deal|discount|coupon|lifetime|% off|gratis|no cost)\b/i;

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Minimal RSS 2.0 parser — enough for the WordPress feeds we consume.
 *  Uses regex LITERALS only: template-built `new RegExp` with escaped
 *  classes (\s\S) loses its backslashes in the worker build pipeline. */
function parseRSS(xml) {
  const items = [];
  const blocks = String(xml || '').match(/<item[\s\S]*?<\/item>/g) || [];
  for (const block of blocks) {
    const field = (re) => {
      const m = block.match(re);
      if (!m) return '';
      return m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    };
    items.push({
      title: stripHtml(field(/<title[^>]*>([\s\S]*?)<\/title>/i)),
      link: stripHtml(field(/<link[^>]*>([\s\S]*?)<\/link>/i)),
      description: stripHtml(field(/<description[^>]*>([\s\S]*?)<\/description>/i)),
      pubDate: field(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i),
    });
  }
  return items;
}

function upsertDealStmt(env, d) {
  return env.DB.prepare(
    `INSERT INTO deals (id, source, category, title, description, url, image_url, original_price, starts_at, ends_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       category = excluded.category,
       title = excluded.title,
       description = excluded.description,
       url = excluded.url,
       image_url = excluded.image_url,
       original_price = excluded.original_price,
       starts_at = excluded.starts_at,
       ends_at = excluded.ends_at,
       updated_at = excluded.updated_at`
  ).bind(d.id, d.source, d.category, d.title, d.description, d.url, d.image_url || '', d.original_price || '', d.starts_at, d.ends_at, d.updated_at);
}

/** Drop a source's stale rows. Every refresher calls this after a successful run. */
async function purgeSource(env, source, now = nowSec()) {
  await env.DB.prepare('DELETE FROM deals WHERE source = ? AND ends_at < ?')
    .bind(source, now - 7 * 86400).run();
}

/** Write a batch and purge the source in one place. */
async function commitSource(env, source, rows, now, snapshot = false) {
  if (rows.length) await env.DB.batch(rows);
  await purgeSource(env, source, now);
  if (snapshot) {
    // JSON APIs are full snapshots: if a giveaway disappears from the feed it
    // was withdrawn, so drop it now instead of leaving it until ends_at.
    // RSS sources are incremental and keep their publication-window rule.
    await env.DB.prepare('DELETE FROM deals WHERE source = ? AND updated_at < ?')
      .bind(source, now - 3600).run();
  }
  return rows.length;
}

/** Normalize whitespace in third-party prose before it lands in an HTML page. */
function clean(s) {
  return stripHtml(String(s || '')).replace(/\s+/g, ' ').trim();
}

function slugFromUrl(url) {
  try {
    const p = new URL(url).pathname.replace(/\/+$/, '');
    return (p.split('/').pop() || p).slice(0, 80) || 'item';
  } catch {
    return 'item';
  }
}

/**
 * Fetch an RSS deals feed, normalize rows into the deals table.
 * Items whose title matches AI_KEYWORDS are routed to the 'ai' category
 * instead of the feed's default — cheap but effective triage.
 */
export async function refreshFeedDeals(env, sourceKey) {
  const src = SOURCES[sourceKey];
  if (!src) throw new Error(`unknown source ${sourceKey}`);
  const res = await fetch(src.feed, { headers: { 'user-agent': 'plobikit-bot/1.0' } });
  if (!res.ok) throw new Error(`${sourceKey} feed ${res.status}`);
  const xml = await res.text();
  const items = parseRSS(xml);
  const now = nowSec();

  const stmts = [];
  for (const it of items.slice(0, 15)) {
    if (!it.title || !it.link) continue;
    if (src.titleMatch && !src.titleMatch.test(it.title)) continue;
    const pub = ts(it.pubDate) || now;
    // Only a genuine AI giveaway belongs on /deals/ai. LowEndBox is a news
    // feed: "AI GPU thefts are surging" is not a deal and must stay in servers.
    const isAiGiveaway = sourceKey !== 'leb'
      && AI_KEYWORDS.test(it.title)
      && GIVEAWAY_WORDS.test(it.title);
    const category = isAiGiveaway ? 'ai' : src.category;
    stmts.push(
      upsertDealStmt(env, {
        id: `${sourceKey}:${slugFromUrl(it.link)}`,
        source: sourceKey,
        category,
        title: it.title.slice(0, 120),
        description: it.description.slice(0, 300),
        url: it.link,
        starts_at: pub,
        ends_at: pub + src.windowDays * 86400,
        updated_at: now,
      })
    );
  }
  return commitSource(env, sourceKey, stmts, now);
}

/* ------------------------- Steam store (first party) ---------------------- */

const STEAM_SEARCH =
  'https://store.steampowered.com/search/results/?query&start=0&count=50&dynamic_data=&sort_by=_ASC&maxprice=free&specials=1&infinite=1&cc=us&l=english';
const STEAM_FEATURED = 'https://store.steampowered.com/api/featuredcategories/?cc=us&l=en';

/**
 * Steam has no "free games" endpoint. The store search filtered to
 * `maxprice=free&specials=1` is the canonical way to find limited-time 100%
 * discounts; the row markup carries the appid, title, original price and a
 * `data-discount="100"` flag, so no appdetails round-trip is needed (that
 * endpoint is much more aggressively rate-limited).
 *
 * The featured-categories carousel is a second, smaller signal and is the only
 * one that carries an exact expiry timestamp. Both feed one map keyed by appid,
 * so a game found twice is written once.
 */
export async function refreshSteamDeals(env) {
  const now = nowSec();
  const found = new Map();

  try {
    const res = await fetch(STEAM_FEATURED, { headers: HEADERS });
    if (!res.ok) throw new Error(`steam featured ${res.status}`);
    const data = await res.json();
    for (const it of data?.specials?.items || []) {
      if (!it.id || Number(it.discount_percent) !== 100) continue;
      const cents = Number(it.original_price || 0);
      found.set(String(it.id), {
        id: `steam:${it.id}`,
        source: 'steam',
        category: 'games',
        title: clean(it.name).slice(0, 120),
        description: '100% off on Steam for a limited window. Claim the free licence before the promotion ends and it stays in your library.',
        url: `https://store.steampowered.com/app/${it.id}/`,
        image_url: it.header_image || '',
        original_price: cents ? `${(cents / 100).toFixed(2)} ${it.currency || 'USD'}` : '',
        starts_at: now - 86400,
        ends_at: Number(it.discount_expiration) || now + 7 * 86400,
        updated_at: now,
      });
    }
  } catch (err) {
    // The carousel is a bonus signal. Losing it must not lose the source.
    console.warn('steam featured unavailable:', err.message);
  }

  // Two independent signals. If only one endpoint is reachable, still publish
  // what it returned; only fail the source when both are down. A failed run
  // leaves the previous rows untouched (no commit, no snapshot cleanup).
  let searchError = null;
  try {
    const res = await fetch(STEAM_SEARCH, { headers: HEADERS });
    if (!res.ok) throw new Error(`steam search ${res.status}`);
    const data = await res.json();
    for (const block of String(data?.results_html || '').split(/(?=<a\s)/)) {
      const m = block.match(/data-ds-appid="(\d+)"/);
      if (!m || !/data-discount="100"/.test(block)) continue;
      const appid = m[1];
      const title = clean((block.match(/<span class="title">([\s\S]*?)<\/span>/) || [])[1]);
      if (!title) continue;
      const original = clean((block.match(/discount_original_price">([\s\S]*?)<\/div>/) || [])[1]);
      const image = (block.match(/<div class="search_capsule"><img src="([^"]+)"/) || [])[1] || '';
      const prev = found.get(appid) || {};
      found.set(appid, {
        ...prev,
        id: `steam:${appid}`,
        source: 'steam',
        category: 'games',
        title: title.slice(0, 120),
        description: prev.description || '100% off on Steam for a limited window. Claim the free licence before the promotion ends and it stays in your library.',
        url: `https://store.steampowered.com/app/${appid}/`,
        image_url: image || prev.image_url || '',
        original_price: original || prev.original_price || '',
        starts_at: now - 86400,
        ends_at: prev.ends_at || now + 7 * 86400,
        updated_at: now,
      });
    }
  } catch (err) {
    searchError = err;
    console.warn('steam search unavailable:', err.message);
  }
  if (!found.size && searchError) throw searchError;

  return commitSource(env, 'steam', [...found.values()].map((d) => upsertDealStmt(env, d)), now, true);
}

/* --------------------- freetokeep.gg (multi-store) ------------------------ */

const FTK_OFFERS = 'https://freetokeep.gg/api/v1/offers?limit=100';
const FTK_WEEKENDS = 'https://freetokeep.gg/api/v1/free-weekends?status=current&limit=50';

/** Free-to-keep giveaways across Prime Gaming, Epic, GOG, Ubisoft, itch.io, STOVE … */
export async function refreshFreeToKeep(env) {
  const now = nowSec();
  const res = await fetch(FTK_OFFERS, { headers: HEADERS });
  if (!res.ok) throw new Error(`freetokeep offers ${res.status}`);
  const data = await res.json();
  const rows = [];
  for (const it of data?.items || []) {
    if (!it?.title || !it?.url) continue;
    const start = ts(it.startsAt) ?? ts(it.publishedAt) ?? now - 86400;
    const end = ts(it.endsAt) ?? start + 30 * 86400;
    if (end <= now) continue;
    const tags = Array.isArray(it.tags) ? clean(it.tags.slice(0, 5).join(' · ')) : '';
    rows.push(upsertDealStmt(env, {
      id: 'ftk:' + it.id,
      source: 'ftk',
      category: 'games',
      title: clean(it.title).slice(0, 120),
      description: `${clean(it.storeLabel || it.store)} free-to-keep giveaway — claim during the window and keep it.${tags ? ' Tags: ' + tags : ''}`.slice(0, 300),
      url: it.url,
      image_url: it.imageUrl || '',
      original_price: it.originalPrice || '',
      starts_at: start,
      ends_at: end,
      updated_at: now,
    }));
  }
  return commitSource(env, 'ftk', rows, now, true);
}

/**
 * Steam Free Weekends are free-to-*play*, not free-to-keep. They get their own
 * source so the card copy can say so plainly and nobody claims a permanent
 * licence by mistake. The link goes straight to the Steam store page.
 */
export async function refreshSteamFreeWeekends(env) {
  const now = nowSec();
  const res = await fetch(FTK_WEEKENDS, { headers: HEADERS });
  if (!res.ok) throw new Error(`freetokeep free-weekends ${res.status}`);
  const data = await res.json();
  const rows = [];
  for (const it of data?.items || []) {
    const end = ts(it.endsAt);
    if (!it?.title || !end || end <= now) continue;
    rows.push(upsertDealStmt(env, {
      id: 'ftkfw:' + (it.appId || it.id),
      source: 'ftkfw',
      category: 'games',
      title: `${clean(it.title)} — Free Weekend`.slice(0, 120),
      description: 'Play the full game free on Steam for a limited window. Access ends when the weekend closes — this is a trial, not a permanent copy.',
      url: it.appId ? `https://store.steampowered.com/app/${it.appId}/` : it.url,
      image_url: it.imageUrl || '',
      starts_at: ts(it.startsAt) || now - 86400,
      ends_at: end,
      updated_at: now,
    }));
  }
  return commitSource(env, 'ftkfw', rows, now, true);
}

/* --------------------- GamerPower (cross-platform) ----------------------- */

const GP_API = 'https://www.gamerpower.com/api/giveaways?sort-by=date';
const GP_TYPES = new Set(['Game', 'Early Access', 'DLC', 'Beta', 'Other']);

/**
 * GamerPower's public API is free for commercial use with one condition:
 * visible attribution and an active link back to gamerpower.com. SOURCE_INFO
 * renders that link on every card, and the page note repeats it explicitly.
 */
export async function refreshGamerPower(env) {
  const now = nowSec();
  const res = await fetch(GP_API, { headers: HEADERS });
  if (!res.ok) throw new Error(`gamerpower ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('gamerpower: unexpected payload');
  const rows = [];
  let extras = 0;
  for (const it of data) {
    if (!it || it.status !== 'Active' || !it.title) continue;
    const type = String(it.type || 'Other');
    if (!GP_TYPES.has(type)) continue;
    // DLC / in-game-item giveaways outnumber real games ~4:1. Cap them so the
    // games page stays about games while still surfacing the "various info".
    if (type !== 'Game' && type !== 'Early Access' && ++extras > 10) continue;
    const asUtc = (v) => ts(String(v || '').replace(' ', 'T') + (v ? 'Z' : ''));
    const end = it.end_date && it.end_date !== 'N/A' ? asUtc(it.end_date) : null;
    if (end && end <= now) continue;
    const url = it.open_giveaway_url || it.open_giveaway || it.gamerpower_url;
    if (!url) continue;
    rows.push(upsertDealStmt(env, {
      id: 'gp:' + it.id,
      source: 'gp',
      category: 'games',
      title: clean(it.title).slice(0, 120),
      description: `[${type}] ${clean(it.platforms)}. ${clean(it.description)}`.slice(0, 300),
      url,
      image_url: it.image || '',
      original_price: it.worth && it.worth !== 'N/A' ? it.worth : '',
      starts_at: asUtc(it.published_date) || now - 86400,
      ends_at: end || now + 30 * 86400,
      updated_at: now,
    }));
  }
  return commitSource(env, 'gp', rows, now, true);
}

/* ---------------------- Reddit FGF (community) --------------------------- */

/**
 * r/FreeGameFindings — the fastest community tracker for Steam/GOG/itch
 * free-to-keep promos. Reddit often 403s datacenter IPs, so this source is
 * best-effort: any failure is caught upstream and logged, never fatal.
 */
export async function refreshRedditFGF(env) {
  const res = await fetch('https://www.reddit.com/r/FreeGameFindings/new.json?limit=25', {
    headers: { 'user-agent': 'plobikit-deals/1.0 (website aggregator; contact via plobikit.com)' },
  });
  if (!res.ok) throw new Error(`fgf ${res.status}`);
  const data = await res.json();
  const posts = data?.data?.children || [];
  const now = nowSec();

  const SKIP_FLAIRS = /ended|expired|discussion|request|mega ?thread|question/i;
  const stmts = [];
  for (const child of posts) {
    const p = child.data || {};
    const flair = String(p.link_flair_text || '');
    if (SKIP_FLAIRS.test(flair)) continue;
    const title = String(p.title || '').replace(/^.*?\]\s*/, '').slice(0, 120) || 'Free game';
    const store = (p.title.match(/^\s*\[([^\]]+)\]/) || [])[1] || 'Reddit FGF';
    const url = p.url_overridden_by_dest && /^https?:\/\//.test(p.url_overridden_by_dest)
      ? p.url_overridden_by_dest
      : 'https://www.reddit.com' + String(p.permalink || '');
    const created = Math.floor(p.created_utc || now);
    stmts.push(
      upsertDealStmt(env, {
        id: 'fgf:' + p.id,
        source: 'fgf',
        category: 'games',
        title,
        description: `${store} free-to-keep promotion, tracked by r/FreeGameFindings. Verify the claim window on the store page — community-reported windows can be short.`,
        url,
        starts_at: created,
        ends_at: created + 7 * 86400,
        updated_at: now,
      })
    );
  }
  return commitSource(env, 'fgf', stmts, now);
}

/* ------------------------- Evergreen AI free tiers ------------------------ */

/**
 * AI "deals" are mostly evergreen free tiers rather than timed promotions,
 * so there is no API to poll. These are hand-curated seeds, refreshed daily:
 * each run bumps ends_at, so a seed removed from this list quietly expires.
 */
const AI_SEEDS = [
  { slug: 'google-ai-studio', title: 'Google AI Studio — free Gemini API tier', description: 'Free access to Gemini models with generous rate limits via AI Studio; pay only if you scale past the free quota.', url: 'https://aistudio.google.com/', price: '$0 / free tier' },
  { slug: 'openrouter-free-models', title: 'OpenRouter — free-tier LLM models', description: 'Route to dozens of models with several available at $0 (rate-limited). One API key, pay-as-you-go beyond free.', url: 'https://openrouter.ai/models?max_price=0', price: '$0 / free tier' },
  { slug: 'groq-free', title: 'Groq — free API tier for open models', description: 'Blazing-fast inference for Llama and Mixtral family models with a free developer tier.', url: 'https://console.groq.com/', price: '$0 / free tier' },
  { slug: 'cloudflare-workers-ai', title: 'Cloudflare Workers AI — free daily neurons', description: 'Run LLMs, image and speech models at the edge. Free allocation of neurons every day.', url: 'https://developers.cloudflare.com/workers-ai/', price: '$0 / free tier' },
  { slug: 'github-copilot-free', title: 'GitHub Copilot — free tier', description: 'Free monthly completions and chat for individual developers, no subscription required.', url: 'https://github.com/features/copilot', price: '$0 / free tier' },
  { slug: 'huggingface-free', title: 'Hugging Face — free hosting & inference', description: 'Free model hosting, Spaces demos, and limited serverless inference on open models.', url: 'https://huggingface.co/', price: '$0 / free tier' },
];

export async function refreshAiSeeds(env) {
  const now = nowSec();
  const stmts = AI_SEEDS.map((s) =>
    upsertDealStmt(env, {
      id: 'ai-curate:' + s.slug,
      source: 'ai-curate',
      category: 'ai',
      title: s.title,
      description: s.description,
      url: s.url,
      starts_at: now - 86400,
      ends_at: now + 365 * 86400,
      updated_at: now,
      original_price: s.price,
    })
  );
  await env.DB.batch(stmts);
  return stmts.length;
}

/** Refresh every source; one failure never blocks the others. */
export async function refreshAllDeals(env) {
  const jobs = {
    epic: () => refreshEpicDeals(env),
    steam: () => refreshSteamDeals(env),
    ftk: () => refreshFreeToKeep(env),
    ftkfw: () => refreshSteamFreeWeekends(env),
    gp: () => refreshGamerPower(env),
    fgf: () => refreshRedditFGF(env),
    leb: () => refreshFeedDeals(env, 'leb'),
    tick: () => refreshFeedDeals(env, 'tick'),
    sos: () => refreshFeedDeals(env, 'sos'),
    aiSeeds: () => refreshAiSeeds(env),
  };
  const out = {};
  for (const [key, job] of Object.entries(jobs)) {
    out[key] = await job().then((n) => `${n} upserted`).catch((e) => `failed: ${e.message}`);
  }
  // GiveawayOfTheDay's feed died; remove whatever its last successful run left.
  try {
    await env.DB.prepare("DELETE FROM deals WHERE source = 'gotd'").run();
  } catch (e) {
    out.gotdCleanup = `failed: ${e.message}`;
  }
  return out;
}

/* -------------------------------- JSON API ------------------------------- */

/**
 * Every tracker reports the same big giveaway. Rather than deleting rows (a
 * source's next run would just put them back), collapse duplicates at read
 * time and keep the highest-ranked source's version of the offer.
 */
async function visibleDeals(env, category, now, { upcoming = false, limit = 0 } = {}) {
  const cond = upcoming ? 'starts_at > ?' : 'starts_at <= ? AND ends_at > ?';
  const binds = upcoming ? [category, now] : [category, now, now];
  const order = upcoming ? 'starts_at' : 'ends_at';
  const sql = `SELECT * FROM (
    SELECT d.*, ROW_NUMBER() OVER (
      PARTITION BY lower(trim(d.title))
      ORDER BY ${SOURCE_RANK}, d.ends_at
    ) AS _rn
    FROM deals d WHERE d.category = ? AND ${cond}
  ) WHERE _rn = 1 ORDER BY ${ITEM_RANK}, ${order}${limit ? ` LIMIT ${limit}` : ''}`;
  const res = await env.DB.prepare(sql).bind(...binds).all();
  return (res.results || []).map(({ _rn, ...d }) => d);
}

/** Visible attribution — GamerPower's free API requires an active link back. */
function sourceTag(d, t) {
  const info = SOURCE_INFO[d.source] || { label: d.source, home: '' };
  const label = escapeHtml(info.label);
  const link = info.home
    ? `<a href="${escapeHtml(info.home)}" target="_blank" rel="noopener">${label}</a>`
    : label;
  return `<span class="deal-source">${escapeHtml(t.source)}: ${link}</span>`;
}

export async function apiDeals(env, request) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || 'games';
  if (!/^[a-z]{2,16}$/.test(category)) return json({ ok: false, error: 'bad_category' }, 400);
  const now = nowSec();
  const active = await visibleDeals(env, category, now);
  const upcoming = await visibleDeals(env, category, now, { upcoming: true, limit: 12 });
  return json({ ok: true, category, active, upcoming, sources: SOURCE_INFO });
}

/* --------------------------- SSR copy (en/cn/es) -------------------------- */
/** Server-rendered pages share one dictionary with the static site's language
 *  trees. Deal titles/descriptions stay in the source's original language —
 *  they are third-party data, not editorial copy, and the source is shown. */

export const UI = {
  en: {
    navHome: 'Home', navCheatsheets: 'Cheat Sheets', navGuides: 'Guides', navDeals: 'Deals',
    navCollection: 'Collection', navAbout: 'About',
    footerPrivacy: 'Privacy Policy', footerTerms: 'Terms', footerAbout: 'About',
    footerContact: 'Contact', rights: 'All rights reserved.',
    hubTitle: 'Free Deals & Giveaways | Plobi-kit',
    hubDesc: 'Curated freebies with zero junk: free game giveaways, Steam free weekends, AI software deals, server and software promotions — refreshed daily, expired offers removed.',
    hubH1: 'Free Deals & Giveaways',
    hubIntro: 'Hand-checked freebies, aggregated automatically. We poll the store APIs and two giveaway trackers every day, list only genuinely free offers, and remove anything expired — no dead links, no fake discounts, no affiliate padding.',
    browse: 'Browse', liveSuffix: 'live',
    catGames: 'Free Games', catGamesDesc: 'Free-to-keep giveaways and Steam free weekends from Epic, Steam, GOG, Prime Gaming and more — refreshed daily.',
    catAi: 'AI Software Deals', catAiDesc: 'Evergreen free tiers and credits on AI tools and model APIs, hand-checked.',
    catServers: 'Server & VPS Deals', catServersDesc: 'Cheap-VPS and hosting promotions from LowEndBox, refreshed daily.',
    catSoftware: 'Software Giveaways', catSoftwareDesc: 'Time-limited free licenses, refreshed daily.',
    gamesTitle: 'Free Games & Steam Free Weekends | Plobi-kit',
    gamesH1: 'Free Games & Free Weekends',
    gamesIntro: "Free game giveaways across Epic, Steam, GOG, Prime Gaming, itch.io and more. Most are 100%-off offers you claim once and keep forever; Steam Free Weekend entries are temporary access and are labelled as such. Every card names its source.",
    liveHeading: 'Free right now', upcomingHeading: 'Upcoming',
    emptyGames: 'No giveaways are live at this exact moment — the trackers refresh daily and Epic usually lands new ones every Thursday.',
    emptyCategory: 'Nothing live right now — check back tomorrow, the feeds refresh daily.',
    freeNow: 'FREE NOW', upcoming: 'UPCOMING', liveBadge: 'LIVE',
    claim: 'Claim the giveaway', view: 'View the giveaway', playFree: 'Play free this weekend', openOffer: 'Open offer',
    freeUntil: 'Free until', freeFrom: 'Free from', dayLeft: '1 day left', daysLeft: 'days left',
    listed: 'listed', source: 'source',
    noteGames: "<strong>How this works:</strong> we poll the public store APIs of Epic and Steam, freetokeep.gg and GamerPower every day, keep free-to-keep offers and clearly labelled free weekends, and drop anything expired. Duplicate reports of the same giveaway collapse into one card. Windows are shown in UTC and come from third parties — confirm on the store page before the deadline.",
    noteServers: '<strong>How this works:</strong> we parse the LowEndBox RSS feed daily and keep listings for 30 days from publication. Windows are estimated from the publication date; always confirm on the provider page.',
    noteSoftware: '<strong>How this works:</strong> we parse the SharewareOnSale and Software Giveaway feeds daily. Windows are estimated from publication date; confirm the licence terms on the source page.',
    credits: '<p><strong>Sources &amp; credits:</strong> giveaway data from <a href="https://www.gamerpower.com/" rel="noopener">GamerPower</a> (used under their free API terms, with attribution) and <a href="https://freetokeep.gg/feeds" rel="noopener">freetokeep.gg</a>, alongside each store\'s own public API or RSS. Titles and descriptions stay in the source language.</p>',
    noteAi: '<strong>How this works:</strong> the free-tier list is maintained by hand (it changes rarely). AI-related <em>giveaways</em> from our software feeds are routed here; general AI news is not.',
    serversH1: 'VPS & Server Deals', serversIntro: 'Hosting promotions from LowEndBox — the longest-running deals feed in the low-end server scene — refreshed daily.',
    softwareH1: 'Software Giveaways', softwareIntro: 'Daily software giveaways — full licences, free to activate within the window. These expire fast (usually 24–48 hours), so grab them the day they appear.',
    aiH1: 'AI Software Deals', aiIntro: 'Most AI "deals" are evergreen free tiers rather than timed promotions, so this page is hand-curated and refreshed daily.',
    modelsTitle: 'Free AI Models — Daily Snapshot | Plobi-kit',
    modelsDesc: 'Language models with a $0 prompt price on OpenRouter, refreshed daily and removed automatically when they stop being free.',
    modelsH1: 'Free AI models',
    modelsIntro: 'A daily snapshot of models whose prompt price is exactly $0 on OpenRouter. No sponsored placements, no hand-picked ranking — the moment a model stops being free it disappears from this list.',
    modelsNote: '<strong>How this works:</strong> we read OpenRouter’s public model catalogue every day, keep only rows with a zero prompt price, and delete anything that no longer qualifies. Always confirm current pricing on the model page before building on it.',
    modelsEmpty: 'The daily snapshot has not run yet, or no model currently has a free tier. Check back after the next refresh.',
    colModel: 'Model', colContext: 'Context', colPrompt: 'Prompt', colCompletion: 'Completion', colLink: 'Open',
    tokens: 'tokens', free: '$0',
  },
  cn: {
    navHome: '工具首页', navCheatsheets: '速查表', navGuides: '技术教程', navDeals: '优惠活动',
    navCollection: '精选合集', navAbout: '关于我们',
    footerPrivacy: '隐私政策', footerTerms: '服务条款', footerAbout: '关于我们',
    footerContact: '联系我们', rights: '保留所有权利。',
    hubTitle: '免费优惠与限时赠送 | Plobi-kit',
    hubDesc: '精心整理的免费资源：游戏赠送、Steam 免费周末、AI 免费档、服务器与软件促销，每日自动更新，过期自动下架。',
    hubH1: '免费优惠与限时赠送',
    hubIntro: '人工核查、自动聚合的免费资源。每天轮询各商店公开 API 与两个赠送追踪源，只保留真正免费的项目，过期即下架——没有失效链接、没有虚假折扣、没有推广填充。',
    browse: '查看', liveSuffix: '条在架',
    catGames: '免费游戏', catGamesDesc: 'Epic、Steam、GOG、Prime Gaming 等平台的「领取后永久保留」赠送与 Steam 免费周末，每日更新。',
    catAi: 'AI 软件优惠', catAiDesc: '人工核查的 AI 工具与模型 API 免费档。',
    catServers: '服务器与 VPS 优惠', catServersDesc: '来自 LowEndBox 的低价 VPS 与主机促销，每日更新。',
    catSoftware: '软件限时赠送', catSoftwareDesc: '限时免费的正版软件授权，每日更新。',
    gamesTitle: '免费游戏与 Steam 免费周末 | Plobi-kit',
    gamesH1: '免费游戏与免费周末',
    gamesIntro: '汇总 Epic、Steam、GOG、Prime Gaming、itch.io 等平台的免费游戏。多数是 100% 折扣、领取后永久留在游戏库；标注「Free Weekend」的条目只是限时试玩，活动结束即失效。每张卡片都标明来源。',
    liveHeading: '现在可领', upcomingHeading: '即将开始',
    emptyGames: '当前没有正在进行的赠送——数据源每天刷新，Epic 通常每周四上新。',
    emptyCategory: '当前没有在架条目——数据源每天刷新，明天再来看看。',
    freeNow: '现在免费', upcoming: '即将开始', liveBadge: '在架',
    claim: '前往领取', view: '查看详情', playFree: '本周末免费玩', openOffer: '打开优惠',
    freeUntil: '免费至', freeFrom: '自', dayLeft: '剩余 1 天', daysLeft: '天',
    listed: '发布于', source: '来源',
    noteGames: '<strong>数据说明：</strong>每天轮询 Epic 与 Steam 的公开商店 API、freetokeep.gg 和 GamerPower，保留「永久保留」赠送与明确标注的免费周末，过期即删除；多个来源重复上报的同一活动只显示一张卡片。窗口时间以 UTC 显示且来自第三方，截止前请在商店页面再次确认。',
    noteServers: '<strong>数据说明：</strong>每天解析 LowEndBox 的 RSS，按发布时间保留 30 天。有效期由发布时间推算，下单前请在服务商页面确认。',
    noteSoftware: '<strong>数据说明：</strong>每天解析 SharewareOnSale 与 Software Giveaway 的 feed，有效期由发布时间推算，授权条款请以来源页面为准。',
    credits: '<p><strong>数据来源与署名：</strong>赠送信息来自 <a href="https://www.gamerpower.com/" rel="noopener">GamerPower</a>（依其免费 API 条款使用并署名）与 <a href="https://freetokeep.gg/feeds" rel="noopener">freetokeep.gg</a>，以及各商店自有的公开 API / RSS。标题与描述保留来源原文，不做机翻。</p>',
    noteAi: '<strong>数据说明：</strong>免费档清单由人工维护（变动不频繁）。软件源中的 AI <em>赠送活动</em>会汇总到这里，普通 AI 资讯不会混入。',
    serversH1: 'VPS 与服务器优惠', serversIntro: '来自 LowEndBox 的主机促销——低端服务器圈历史最久的优惠源——每日刷新。',
    softwareH1: '软件限时赠送', softwareIntro: '每日软件赠送，窗口期内可免费激活完整授权。过期很快（通常 24–48 小时），看到当天就领。',
    aiH1: 'AI 软件优惠', aiIntro: '多数 AI「优惠」其实是长期免费档而非限时促销，因此本页由人工策展并每日刷新。',
    modelsTitle: '免费 AI 模型 — 每日快照 | Plobi-kit',
    modelsDesc: 'OpenRouter 上 prompt 单价为 $0 的语言模型，每日刷新，停止免费即自动移除。',
    modelsH1: '免费 AI 模型',
    modelsIntro: '每天快照一次 OpenRouter 上 prompt 单价恰好为 $0 的模型。没有赞助位、没有人工排名——模型一旦不再免费，就会从清单中消失。',
    modelsNote: '<strong>数据说明：</strong>每天读取 OpenRouter 公开模型目录，只保留 prompt 价格为 0 的条目，不再符合条件的自动删除。用于生产前请在模型页确认当前价格。',
    modelsEmpty: '每日快照尚未运行，或当前没有免费档模型，请等下一次刷新后再来看。',
    colModel: '模型', colContext: '上下文', colPrompt: '输入单价', colCompletion: '输出单价', colLink: '打开',
    tokens: 'tokens', free: '$0',
  },
  es: {
    navHome: 'Inicio', navCheatsheets: 'Guías rápidas', navGuides: 'Guías', navDeals: 'Ofertas',
    navCollection: 'Colección', navAbout: 'Acerca de',
    footerPrivacy: 'Privacidad', footerTerms: 'Términos', footerAbout: 'Acerca de',
    footerContact: 'Contacto', rights: 'Todos los derechos reservados.',
    hubTitle: 'Ofertas y regalos gratis | Plobi-kit',
    hubDesc: 'Regalos gratis, fines de semana gratis de Steam, niveles gratuitos de IA y promociones de servidores y software: actualización diaria y baja automática al caducar.',
    hubH1: 'Ofertas y regalos gratis',
    hubIntro: 'Promociones verificadas y recopiladas automáticamente. Consultamos cada día las APIs públicas de las tiendas y dos rastreadores de regalos; solo mostramos ofertas realmente gratuitas y retiramos lo caducado: sin enlaces muertos, sin descuentos falsos y sin relleno de afiliados.',
    browse: 'Ver', liveSuffix: 'activos',
    catGames: 'Juegos gratis', catGamesDesc: 'Regalos para conservar y fines de semana gratis de Epic, Steam, GOG, Prime Gaming y más, actualizados a diario.',
    catAi: 'Ofertas de IA', catAiDesc: 'Niveles gratuitos de herramientas y APIs de modelos, revisados a mano.',
    catServers: 'Servidores y VPS', catServersDesc: 'Promociones de VPS y alojamiento de LowEndBox, actualizadas a diario.',
    catSoftware: 'Software gratis', catSoftwareDesc: 'Licencias gratuitas por tiempo limitado, actualizadas a diario.',
    gamesTitle: 'Juegos gratis y fines de semana de Steam | Plobi-kit',
    gamesH1: 'Juegos y fines de semana gratis',
    gamesIntro: 'Regalos de juegos de Epic, Steam, GOG, Prime Gaming, itch.io y más. La mayoría son ofertas al 100 % que se conservan para siempre; las entradas «Free Weekend» son acceso temporal y van etiquetadas. Cada tarjeta indica su fuente.',
    liveHeading: 'Disponibles ahora', upcomingHeading: 'Próximamente',
    emptyGames: 'Ahora mismo no hay regalos activos. Las fuentes se actualizan a diario y Epic suele estrenar los suyos los jueves.',
    emptyCategory: 'No hay nada activo ahora mismo; las fuentes se actualizan cada día.',
    freeNow: 'GRATIS AHORA', upcoming: 'PRONTO', liveBadge: 'ACTIVO',
    claim: 'Reclamar el regalo', view: 'Ver la oferta', playFree: 'Jugar gratis este fin de semana', openOffer: 'Abrir oferta',
    freeUntil: 'Gratis hasta', freeFrom: 'Gratis desde', dayLeft: 'queda 1 día', daysLeft: 'días restantes',
    listed: 'publicado', source: 'fuente',
    noteGames: '<strong>Cómo funciona:</strong> consultamos a diario las APIs públicas de Epic y Steam, freetokeep.gg y GamerPower; conservamos los regalos para siempre y los fines de semana gratis etiquetados, y eliminamos lo caducado. Los informes duplicados se agrupan en una sola tarjeta. Los plazos se muestran en UTC y proceden de terceros: confírmalos en la tienda.',
    noteServers: '<strong>Cómo funciona:</strong> leemos el RSS de LowEndBox cada día y conservamos los artículos 30 días desde su publicación. Las fechas son estimadas; confirma en la página del proveedor.',
    noteSoftware: '<strong>Cómo funciona:</strong> leemos a diario los feeds de SharewareOnSale y Software Giveaway. Las fechas son estimadas; consulta los términos de la licencia en la fuente.',
    credits: '<p><strong>Fuentes y créditos:</strong> datos de regalos de <a href="https://www.gamerpower.com/" rel="noopener">GamerPower</a> (usados según sus condiciones de API gratuita, con atribución) y <a href="https://freetokeep.gg/feeds" rel="noopener">freetokeep.gg</a>, junto con las APIs o RSS públicos de cada tienda. Los títulos y descripciones se mantienen en su idioma original.</p>',
    noteAi: '<strong>Cómo funciona:</strong> la lista de niveles gratuitos se mantiene a mano (cambia poco). Aquí se recogen los <em>regalos</em> de IA de nuestros feeds, no noticias generales.',
    serversH1: 'Ofertas de VPS y servidores', serversIntro: 'Promociones de LowEndBox, la fuente más antigua del sector de servidores económicos, actualizadas a diario.',
    softwareH1: 'Software gratis por tiempo limitado', softwareIntro: 'Licencias completas gratis dentro del plazo. Caducan rápido (24–48 h), así que aprovéchalas el mismo día.',
    aiH1: 'Ofertas de IA', aiIntro: 'La mayoría de las «ofertas» de IA son niveles gratuitos permanentes, no promociones limitadas: esta página se revisa a mano cada día.',
    modelsTitle: 'Modelos de IA gratis — instantánea diaria | Plobi-kit',
    modelsDesc: 'Modelos con precio de prompt de $0 en OpenRouter, actualizados a diario y retirados cuando dejan de ser gratis.',
    modelsH1: 'Modelos de IA gratis',
    modelsIntro: 'Instantánea diaria de los modelos cuyo precio de prompt es exactamente $0 en OpenRouter. Sin patrocinios ni ranking manual: en cuanto un modelo deja de ser gratuito, desaparece de la lista.',
    modelsNote: '<strong>Cómo funciona:</strong> leemos cada día el catálogo público de OpenRouter, conservamos solo las filas con precio de prompt cero y eliminamos las que ya no cumplen. Confirma el precio actual en la página del modelo antes de usarlo en producción.',
    modelsEmpty: 'La instantánea diaria aún no se ha ejecutado o ningún modelo tiene nivel gratuito. Vuelve tras la próxima actualización.',
    colModel: 'Modelo', colContext: 'Contexto', colPrompt: 'Prompt', colCompletion: 'Salida', colLink: 'Abrir',
    tokens: 'tokens', free: '$0',
  },
};

/* ------------------------------- SSR pages ------------------------------- */

export async function dealsHubPage(request, env) {
  const lang = await resolveLang(request, env);
  const t = UI[lang] || UI.en;
  const cats = [
    { slug: 'games', name: t.catGames, desc: t.catGamesDesc },
    { slug: 'ai', name: t.catAi, desc: t.catAiDesc },
    { slug: 'servers', name: t.catServers, desc: t.catServersDesc },
    { slug: 'software', name: t.catSoftware, desc: t.catSoftwareDesc },
  ];

  const rows = [];
  let index = 0;
  for (const c of cats) {
    index += 1;
    const now = nowSec();
    // Count what the visitor will actually see after cross-source dedupe.
    const n = await env.DB.prepare(
      'SELECT COUNT(DISTINCT lower(trim(title))) AS n FROM deals WHERE category = ? AND starts_at <= ? AND ends_at > ?'
    )
      .bind(c.slug, now, now)
      .first('n');
    rows.push(`
        <a class="deal-row" href="${pageUrl(lang, `/deals/${c.slug}`)}">
          <span class="deal-no">${String(index).padStart(2, '0')}</span>
          <span class="deal-main">
            <span class="deal-name">${c.name}</span>
            <span class="deal-desc">${c.desc}</span>
          </span>
          <span class="deal-count">${n} ${t.liveSuffix}</span>
          <span class="deal-arrow" aria-hidden="true">&rarr;</span>
        </a>`);
  }

  return shell({
    title: t.hubTitle,
    description: t.hubDesc,
    path: '/deals',
    active: 'deals',
    lang,
    content: `
      <h1>${t.hubH1}</h1>
      <p class="intro">${t.hubIntro}</p>
      <div class="deal-index">${rows.join('')}</div>
      <div class="note"><p>${t.noteGames}</p>${t.credits}</div>`,
  });
}

export async function dealsGamesPage(request, env) {
  const lang = await resolveLang(request, env);
  const t = UI[lang] || UI.en;
  const now = nowSec();
  const active = await visibleDeals(env, 'games', now);
  const upcoming = await visibleDeals(env, 'games', now, { upcoming: true, limit: 12 });

  const card = (d, state) => {
    const when = state === 'live'
      ? `${t.freeUntil} ${fmtDate(d.ends_at)} · ${daysLeft(d.ends_at, lang)}`
      : `${t.freeFrom} ${fmtDate(d.starts_at)}`;
    const price = d.original_price ? `<span class="price">${escapeHtml(d.original_price)}</span> ` : '';
    const badge = state === 'live'
      ? `<span class="badge live">${t.freeNow}</span>`
      : `<span class="badge soon">${t.upcoming}</span>`;
    const img = d.image_url
      ? `<img src="${escapeHtml(d.image_url)}" alt="${escapeHtml(d.title)} cover art" loading="lazy">`
      : '';
    return `
      <article class="deal-card">
        ${img}
        <div class="deal-body">
          <div class="deal-head"><h2>${escapeHtml(d.title)}</h2>${badge}</div>
          <p class="deal-when">${price}${escapeHtml(when)}</p>
          ${sourceTag(d, t)}
          <p class="deal-desc">${escapeHtml(d.description)}</p>
          <a class="cta" href="${escapeHtml(d.url)}" target="_blank" rel="noopener nofollow">${
            state !== 'live' ? t.view : d.source === 'ftkfw' ? t.playFree : t.claim
          } &rarr;</a>
        </div>
      </article>`;
  };

  const activeHtml = active.map((d) => card(d, 'live')).join('\n');
  const upcomingHtml = upcoming.map((d) => card(d, 'upcoming')).join('\n');

  return shell({
    title: t.gamesTitle,
    description: t.gamesIntro.replace(/<[^>]+>/g, '').slice(0, 180),
    path: '/deals/games',
    active: 'deals',
    lang,
    content: `
      <h1>${t.gamesH1}</h1>
      <p class="intro">${t.gamesIntro}</p>
      <h2 class="section-title">${t.liveHeading}</h2>
      ${activeHtml || `<p class="empty">${t.emptyGames}</p>`}
      ${upcomingHtml ? `<h2 class="section-title">${t.upcomingHeading}</h2>` + upcomingHtml : ''}
      <div class="note"><p>${t.noteGames}</p>${t.credits}</div>`,
  });
}

/** Category copy is assembled from the same dictionary as the rest of the UI. */
function categoryCopy(category, t) {
  const bySlug = {
    servers: { h1: t.serversH1, intro: t.serversIntro, note: t.noteServers },
    software: { h1: t.softwareH1, intro: t.softwareIntro, note: t.noteSoftware },
    ai: { h1: t.aiH1, intro: t.aiIntro, note: t.noteAi },
  };
  return bySlug[category] || null;
}

/** Generic category listing for servers / software / ai. */
export async function dealsCategoryPage(request, env, category) {
  const lang = await resolveLang(request, env);
  const t = UI[lang] || UI.en;
  const copy = categoryCopy(category, t);
  if (!copy) return null;
  const now = nowSec();
  const active = await visibleDeals(env, category, now);

  const card = (d) => {
    const price = d.original_price ? `<span class="price">${escapeHtml(d.original_price)}</span> ` : '';
    const img = d.image_url
      ? `<img src="${escapeHtml(d.image_url)}" alt="${escapeHtml(d.title)}" loading="lazy">`
      : '';
    return `
      <article class="deal-card">
        ${img}
        <div class="deal-body">
          <div class="deal-head"><h2>${escapeHtml(d.title)}</h2><span class="badge live">${t.liveBadge}</span></div>
          <p class="deal-when">${price}${t.listed} ${fmtDate(d.starts_at)}</p>
          ${sourceTag(d, t)}
          <p class="deal-desc">${escapeHtml(d.description)}</p>
          <a class="cta" href="${escapeHtml(d.url)}" target="_blank" rel="noopener nofollow">${t.openOffer} &rarr;</a>
        </div>
      </article>`;
  };

  return shell({
    title: `${copy.h1} | Plobi-kit`,
    description: copy.intro.replace(/<[^>]+>/g, '').slice(0, 180),
    path: `/deals/${category}`,
    active: 'deals',
    lang,
    content: `
      <h1>${copy.h1}</h1>
      <p class="intro">${copy.intro}</p>
      ${active.map(card).join('\n') || `<p class="empty">${t.emptyCategory}</p>`}
      <div class="note"><p>${copy.note}</p>${t.credits}</div>`,
  });
}

/* ------------------------------ Page shell ------------------------------- */

const ORIGIN = 'https://plobikit.com';
const SS_LANGS = ['en', 'cn', 'es'];
const SS_HREFLANG = { en: 'en', cn: 'zh', es: 'es' };
const SS_HTML_LANG = { en: 'en', cn: 'zh', es: 'es' };
const LANG_OPTIONS = { en: 'EN', cn: '中文', es: 'ES' };

export function pageUrl(lang, path) {
  return lang === 'en' ? path : `/${lang}${path}`;
}

function canonicalFor(lang, path) {
  return ORIGIN + pageUrl(lang, path);
}

/**
 * Shared shell for every worker-rendered page. Reuses /styles.css and the same
 * header/footer markup as static pages. Each language owns a real URL prefix,
 * so hreflang points at an indexable page rather than a cookie-only variant.
 */
export function shell({ title, description, path, active, content, lang = 'en' }) {
  const t = UI[lang] || UI.en;
  // Header/footer links used to be hard-coded English paths, so clicking one
  // from /cn/deals dropped the reader back into English. Chinese has a full
  // translated tree; Spanish only has the entry page, so English is the safe
  // fallback there (same rule the static normalize-nav pass follows).
  const local = (href) => (lang === 'cn' ? `/cn${href}` : href);
  const nav = [
    ['/tools/', t.navHome, 'home'],
    ['/cheatsheets/', t.navCheatsheets, 'cheatsheets'],
    ['/guides/', t.navGuides, 'guides'],
    ['/deals', t.navDeals, 'deals'],
    ['/collection/', t.navCollection, 'collection'],
    ['/about', t.navAbout, 'about'],
  ].map(([href, label, key]) =>
    `<a href="${local(href)}" id="nav-${key}"${key === active ? ' class="active"' : ''}>${label}</a>`).join('\n        ');

  const footer = [
    ['/privacy', t.footerPrivacy, 'privacy'],
    ['/terms', t.footerTerms, 'terms'],
    ['/about', t.footerAbout, 'about'],
    ['/contact', t.footerContact, 'contact'],
  ].map(([href, label, key]) =>
    `<a href="${local(href)}" id="nav-footer-${key}">${label}</a>`).join('\n        ');

  const alternates = SS_LANGS.map((l) =>
    `<link rel="alternate" hreflang="${SS_HREFLANG[l]}" href="${canonicalFor(l, path)}">`)
    .concat(`<link rel="alternate" hreflang="x-default" href="${canonicalFor('en', path)}">`)
    .join('\n  ');

  const langSwitch = SS_LANGS.map((l) =>
    `<a href="${pageUrl(l, path)}"${l === lang ? ' class="active"' : ''} data-lang="${l}" onclick="document.cookie='plobi-lang=${l}; max-age=31536000; path=/; SameSite=Lax'">${LANG_OPTIONS[l]}</a>`).join('');

  return `<!DOCTYPE html>
<html lang="${SS_HTML_LANG[lang] || 'en'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonicalFor(lang, path)}">
${alternates}
<link rel="stylesheet" href="/styles.css">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#fafafa">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  main.deals-main { max-width: 920px; margin: 0 auto; padding: 12px 20px 64px; }
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
  .deal-source { display: inline-block; font-size: 11.5px; color: var(--text-muted); margin: 0 0 10px; }
  .deal-source a { color: var(--success-color); text-decoration: none; border-bottom: 1px solid var(--border-color); }
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
  .note { margin-top: 36px; font-size: 13px; line-height: 1.8; color: var(--text-muted); background: var(--accent-light); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px 20px; }
  .note p { margin: 0; }
  .note p + p { margin-top: 10px; }
  .note a { color: var(--success-color); }
  .deal-index { border-top: 1px solid var(--rule-strong); margin-top: 6px; }
  .deal-row {
    display: grid; grid-template-columns: 44px minmax(0, 1fr) auto 18px;
    align-items: baseline; gap: 16px; padding: 20px 0;
    border-bottom: 1px solid var(--border-color);
    text-decoration: none; color: inherit; transition: padding-left .16s ease;
  }
  .deal-row:hover { padding-left: 8px; }
  .deal-no { font-family: var(--font-mono); font-size: 10.5px; color: var(--rule-strong); }
  .deal-main { display: flex; flex-direction: column; gap: 4px; }
  .deal-name {
    font-family: var(--font-display); font-size: 22px; font-weight: 500;
    letter-spacing: -0.015em; color: var(--text-main);
  }
  .deal-desc { font-size: 13.5px; color: var(--text-muted); line-height: 1.6; }
  .deal-count {
    font-family: var(--font-mono); font-size: 10px; letter-spacing: .1em;
    text-transform: uppercase; color: var(--rule-strong); white-space: nowrap;
  }
  .deal-arrow { font-size: 14px; color: var(--text-muted); }
  .deal-row:hover .deal-arrow { color: var(--accent-hover); }
  @media (max-width: 560px) {
    .deal-row { grid-template-columns: 26px 1fr 16px; }
    .deal-count { display: none; }
  }
  .model-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .model-table th, .model-table td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--border-color); }
  .model-table th { font-size: 12px; color: var(--text-muted); }
  .model-table a { color: var(--success-color); text-decoration: none; }
  @media (max-width: 560px) { .deal-card { flex-direction: column; } .deal-card img { width: 100%; height: auto; aspect-ratio: 2/1; } }
</style>
</head>
<body data-available-langs="en,cn,es">
  <div class="app-container">
    <header class="app-header">
      <div class="logo">
        <a href="${pageUrl(lang, '/')}" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">
          <span class="logo-icon" style="background:var(--success-color);">P</span>
          <span id="txt-logo-name">Plobi-kit</span>
        </a>
      </div>
      <nav class="nav-links">
        ${nav}
      </nav>
      <div class="controls">
        <div class="lang-switch" role="group" aria-label="Language">${langSwitch}</div>
      </div>
    </header>

    <main class="deals-main">
      ${content}
    </main>

    <footer class="app-footer">
      <div class="footer-nav">
        ${footer}
      </div>
      <div class="copyright" id="nav-footer-copy">
        &copy; 2026 Plobi. ${t.rights}
      </div>
    </footer>
  </div>

</body>
</html>`;
}

/* -------------------------------- Helpers -------------------------------- */

function fmtDate(unixSec) {
  if (!unixSec) return '—';
  const d = new Date(unixSec * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

function daysLeft(unixSec, lang) {
  const days = Math.max(0, Math.ceil((unixSec - nowSec()) / 86400));
  if (lang === 'cn') return days === 1 ? '剩 1 天' : `剩 ${days} 天`;
  if (lang === 'es') return days === 1 ? 'queda 1 día' : `quedan ${days} días`;
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
 * Resolve the visitor's language for SSR pages. Order:
 *   1. '?lang=xx' explicit deep link
 *   2. URL prefix (/cn/deals, /es/deals) — each language owns a real URL
 *   3. cookie 'plobi-lang' set by the static site's selector
 *   4. Accept-Language header
 *   5. English fallback
 */
export async function resolveLang(request, env) {
  const u = new URL(request.url);
  const q = u.searchParams.get('lang');
  if (q && SS_LANGS.includes(q)) return q;
  const prefix = u.pathname.match(/^\/(cn|es)(?=\/|$)/);
  if (prefix) return prefix[1];
  const cookieHeader = request.headers.get('cookie') || '';
  const m = cookieHeader.match(/(?:^|;\s*)plobi-lang=([^;]+)/);
  if (m && SS_LANGS.includes(m[1])) return m[1];
  const first = (request.headers.get('accept-language') || '').toLowerCase().split(',')[0] || '';
  if (first.startsWith('zh')) return 'cn';
  if (first.startsWith('es')) return 'es';
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
