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
  gotd: { feed: 'http://feeds.feedburner.com/giveawayoftheday/feed', category: 'software', windowDays: 2 },
  sos: { feed: 'https://www.sharewareonsale.com/feed', category: 'software', windowDays: 7 },
};

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
       title = excluded.title,
       description = excluded.description,
       url = excluded.url,
       original_price = excluded.original_price,
       starts_at = excluded.starts_at,
       ends_at = excluded.ends_at,
       updated_at = excluded.updated_at`
  ).bind(d.id, d.source, d.category, d.title, d.description, d.url, d.image_url || '', d.original_price || '', d.starts_at, d.ends_at, d.updated_at);
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
  if (stmts.length) await env.DB.batch(stmts);
  await env.DB.prepare('DELETE FROM deals WHERE source = ? AND ends_at < ?').bind(sourceKey, now - 7 * 86400).run();
  return stmts.length;
}

/* ---------------------- Reddit FGF & GOG (games) -------------------------- */

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
  if (stmts.length) await env.DB.batch(stmts);
  await env.DB.prepare('DELETE FROM deals WHERE source = ? AND ends_at < ?').bind('fgf', now - 7 * 86400).run();
  return stmts.length;
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
  const out = {};
  out.epic = await refreshEpicDeals(env).then((n) => `${n} upserted`).catch((e) => `failed: ${e.message}`);
  out.fgf = await refreshRedditFGF(env).then((n) => `${n} upserted`).catch((e) => `failed: ${e.message}`);
  out.leb = await refreshFeedDeals(env, 'leb').then((n) => `${n} upserted`).catch((e) => `failed: ${e.message}`);
  out.gotd = await refreshFeedDeals(env, 'gotd').then((n) => `${n} upserted`).catch((e) => `failed: ${e.message}`);
  out.sos = await refreshFeedDeals(env, 'sos').then((n) => `${n} upserted`).catch((e) => `failed: ${e.message}`);
  out.aiSeeds = await refreshAiSeeds(env).then((n) => `${n} upserted`).catch((e) => `failed: ${e.message}`);
  return out;
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
    hubDesc: 'Curated freebies with zero junk: free game giveaways, AI software deals, and server promotions — refreshed automatically, expired offers removed.',
    hubH1: 'Free Deals & Giveaways',
    hubIntro: 'Hand-checked freebies, aggregated automatically. We pull directly from official store APIs on a daily schedule, list only 100%-off offers, and remove anything expired — no dead links, no fake discounts, no affiliate padding.',
    browse: 'Browse', liveSuffix: 'live',
    catGames: 'Free Games', catGamesDesc: 'Free-to-keep giveaways from Epic — official store API, refreshed daily.',
    catAi: 'AI Software Deals', catAiDesc: 'Evergreen free tiers and credits on AI tools and model APIs, hand-checked.',
    catServers: 'Server & VPS Deals', catServersDesc: 'Cheap-VPS and hosting promotions from LowEndBox, refreshed daily.',
    catSoftware: 'Software Giveaways', catSoftwareDesc: 'Time-limited free licenses, refreshed daily.',
    gamesTitle: 'Free Games Giveaway — Claim & Keep | Plobi-kit',
    gamesH1: 'Free Games Giveaway',
    gamesIntro: "Every game below is 100% off on the Epic Games Store right now or soon — claim it during the window and it stays in your library forever. This page refreshes automatically every day from Epic's official store API.",
    liveHeading: 'Free right now', upcomingHeading: 'Upcoming',
    emptyGames: 'No giveaways are live at this exact moment — new ones usually land every Thursday. Check the upcoming list below.',
    emptyCategory: 'Nothing live right now — check back tomorrow, the feeds refresh daily.',
    freeNow: 'FREE NOW', upcoming: 'UPCOMING', liveBadge: 'LIVE',
    claim: 'Claim on Epic Games', view: 'View on Epic Games', openOffer: 'Open offer',
    freeUntil: 'Free until', freeFrom: 'Free from', dayLeft: '1 day left', daysLeft: 'days left',
    listed: 'listed', source: 'source',
    noteGames: "<strong>How this works:</strong> we query Epic's public store API on a daily schedule, keep only 100%-discount offers, and delete listings a week after they end. Claim windows are shown in UTC — double-check the store page before the deadline.",
    noteServers: '<strong>How this works:</strong> we parse the LowEndBox RSS feed daily and keep listings for 30 days from publication. Windows are estimated from the publication date; always confirm on the provider page.',
    noteSoftware: '<strong>How this works:</strong> we parse the Giveaway of the Day and SharewareOnSale feeds daily. Windows are estimated from publication date; confirm the licence terms on the source page.',
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
    hubDesc: '精心整理的免费资源：游戏赠送、AI 免费档与服务器促销，每日自动更新，过期自动下架。',
    hubH1: '免费优惠与限时赠送',
    hubIntro: '人工核查、自动聚合的免费资源。我们每天从官方商店 API 拉取数据，只保留 100% 免费的项目，过期即下架——没有失效链接、没有虚假折扣、没有推广填充。',
    browse: '查看', liveSuffix: '条在架',
    catGames: '免费游戏', catGamesDesc: 'Epic 官方商店 API 的「领取后永久保留」赠送，每日更新。',
    catAi: 'AI 软件优惠', catAiDesc: '人工核查的 AI 工具与模型 API 免费档。',
    catServers: '服务器与 VPS 优惠', catServersDesc: '来自 LowEndBox 的低价 VPS 与主机促销，每日更新。',
    catSoftware: '软件限时赠送', catSoftwareDesc: '限时免费的正版软件授权，每日更新。',
    gamesTitle: '免费游戏领取 — 领取后永久保留 | Plobi-kit',
    gamesH1: '免费游戏领取',
    gamesIntro: '下面每款游戏当前或即将在 Epic 商店 100% 免费——在窗口期内领取后永久留在你的游戏库。本页每天从 Epic 官方商店 API 自动刷新。',
    liveHeading: '现在可领', upcomingHeading: '即将开始',
    emptyGames: '当前没有正在进行的赠送——通常每周四上新，可以先看下面的预告。',
    emptyCategory: '当前没有在架条目——数据源每天刷新，明天再来看看。',
    freeNow: '现在免费', upcoming: '即将开始', liveBadge: '在架',
    claim: '前往 Epic 领取', view: '在 Epic 查看', openOffer: '打开优惠',
    freeUntil: '免费至', freeFrom: '自', dayLeft: '剩余 1 天', daysLeft: '天',
    listed: '发布于', source: '来源',
    noteGames: '<strong>数据说明：</strong>每天查询 Epic 公开商店 API，只保留 100% 折扣的赠送，结束后一周删除。领取窗口以 UTC 显示，截止前请在商店页面再次确认。',
    noteServers: '<strong>数据说明：</strong>每天解析 LowEndBox 的 RSS，按发布时间保留 30 天。有效期由发布时间推算，下单前请在服务商页面确认。',
    noteSoftware: '<strong>数据说明：</strong>每天解析 Giveaway of the Day 与 SharewareOnSale 的 feed，有效期由发布时间推算，授权条款请以来源页面为准。',
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
    hubDesc: 'Regalos gratis, niveles gratuitos de IA y promociones de servidores: actualización diaria y baja automática al caducar.',
    hubH1: 'Ofertas y regalos gratis',
    hubIntro: 'Promociones verificadas y recopiladas automáticamente. Consultamos las APIs oficiales de las tiendas cada día, mostramos solo ofertas al 100 % y retiramos lo caducado: sin enlaces muertos, sin descuentos falsos y sin relleno de afiliados.',
    browse: 'Ver', liveSuffix: 'activos',
    catGames: 'Juegos gratis', catGamesDesc: 'Regalos para conservar de Epic, desde su API oficial y actualizados a diario.',
    catAi: 'Ofertas de IA', catAiDesc: 'Niveles gratuitos de herramientas y APIs de modelos, revisados a mano.',
    catServers: 'Servidores y VPS', catServersDesc: 'Promociones de VPS y alojamiento de LowEndBox, actualizadas a diario.',
    catSoftware: 'Software gratis', catSoftwareDesc: 'Licencias gratuitas por tiempo limitado, actualizadas a diario.',
    gamesTitle: 'Juegos gratis para conservar | Plobi-kit',
    gamesH1: 'Juegos gratis para siempre',
    gamesIntro: 'Cada juego de esta lista es 100 % gratis en la Epic Games Store ahora o en breve: reclámalo dentro del plazo y se queda en tu biblioteca para siempre. La página se actualiza cada día desde la API oficial de Epic.',
    liveHeading: 'Disponibles ahora', upcomingHeading: 'Próximamente',
    emptyGames: 'Ahora mismo no hay regalos activos. Suelen llegar los jueves; consulta la lista de próximos lanzamientos.',
    emptyCategory: 'No hay nada activo ahora mismo; las fuentes se actualizan cada día.',
    freeNow: 'GRATIS AHORA', upcoming: 'PRONTO', liveBadge: 'ACTIVO',
    claim: 'Reclamar en Epic', view: 'Ver en Epic', openOffer: 'Abrir oferta',
    freeUntil: 'Gratis hasta', freeFrom: 'Gratis desde', dayLeft: 'queda 1 día', daysLeft: 'días restantes',
    listed: 'publicado', source: 'fuente',
    noteGames: '<strong>Cómo funciona:</strong> consultamos a diario la API pública de Epic, conservamos solo las ofertas al 100 % y eliminamos cada registro una semana después de finalizar. Los plazos se muestran en UTC; confírmalos en la tienda.',
    noteServers: '<strong>Cómo funciona:</strong> leemos el RSS de LowEndBox cada día y conservamos los artículos 30 días desde su publicación. Las fechas son estimadas; confirma en la página del proveedor.',
    noteSoftware: '<strong>Cómo funciona:</strong> leemos a diario los feeds de Giveaway of the Day y SharewareOnSale. Las fechas son estimadas; consulta los términos de la licencia en la fuente.',
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
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM deals WHERE category = ? AND starts_at <= ? AND ends_at > ?')
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
      <div class="note"><p>${t.noteGames}</p></div>`,
  });
}

export async function dealsGamesPage(request, env) {
  const lang = await resolveLang(request, env);
  const t = UI[lang] || UI.en;
  const now = nowSec();
  const active = await env.DB.prepare(
    'SELECT * FROM deals WHERE category = ? AND starts_at <= ? AND ends_at > ? ORDER BY ends_at'
  ).bind('games', now, now).all();
  const upcoming = await env.DB.prepare(
    'SELECT * FROM deals WHERE category = ? AND starts_at > ? ORDER BY starts_at LIMIT 12'
  ).bind('games', now).all();

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
          <p class="deal-desc">${escapeHtml(d.description)}</p>
          <a class="cta" href="${escapeHtml(d.url)}" target="_blank" rel="noopener nofollow">${
            state === 'live' ? t.claim : t.view
          } &rarr;</a>
        </div>
      </article>`;
  };

  const activeHtml = (active.results || []).map((d) => card(d, 'live')).join('\n');
  const upcomingHtml = (upcoming.results || []).map((d) => card(d, 'upcoming')).join('\n');

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
      <div class="note"><p>${t.noteGames}</p></div>`,
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
  const active = await env.DB.prepare(
    'SELECT * FROM deals WHERE category = ? AND starts_at <= ? AND ends_at > ? ORDER BY ends_at'
  ).bind(category, now, now).all();

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
          <p class="deal-when">${price}${t.listed} ${fmtDate(d.starts_at)} · ${t.source}: ${escapeHtml(d.source)}</p>
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
      ${(active.results || []).map(card).join('\n') || `<p class="empty">${t.emptyCategory}</p>`}
      <div class="note"><p>${copy.note}</p></div>`,
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
  const nav = [
    ['/tools/', t.navHome, 'home'],
    ['/cheatsheets/', t.navCheatsheets, 'cheatsheets'],
    ['/guides/', t.navGuides, 'guides'],
    ['/deals', t.navDeals, 'deals'],
    ['/collection/', t.navCollection, 'collection'],
    ['/about', t.navAbout, 'about'],
  ].map(([href, label, key]) =>
    `<a href="${href}" id="nav-${key}"${key === active ? ' class="active"' : ''}>${label}</a>`).join('\n        ');

  const footer = [
    ['/privacy', t.footerPrivacy, 'privacy'],
    ['/terms', t.footerTerms, 'terms'],
    ['/about', t.footerAbout, 'about'],
    ['/contact', t.footerContact, 'contact'],
  ].map(([href, label, key]) =>
    `<a href="${href}" id="nav-footer-${key}">${label}</a>`).join('\n        ');

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
