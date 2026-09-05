/**
 * gen-guides.mjs — markdown → bilingual HTML for the Library section.
 *
 * Input:  content/guides/<slug>.md  (English, source of truth)
 *         content/guides/<slug>.zh.md (optional, Chinese translation)
 * Output: public/guides/<slug>.html  (EN)
 *         public/cn/guides/<slug>.html (CN, falls back to EN with a notice
 *                                        if the .zh.md file does not exist)
 *
 * Frontmatter (YAML-ish, parsed by hand to avoid an extra dependency):
 *   title:        string (required)
 *   description:  string (used in <meta> and social cards)
 *   category:     privacy | recipes | comparison | howto
 *   tags:         [string, string, ...]
 *   published:    2026-09-05
 *   readTime:     "2 min"
 *   related:      [other-slug, other-slug]
 *
 * The body is plain Markdown — supports h2/h3, paragraphs, fenced code, lists,
 * tables, and inline code / bold / italic. Rendering is a small custom pass;
 * for the scale we need (50-100 articles) it stays readable and ships zero deps.
 *
 * Run: node scripts/gen-guides.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'content', 'guides');
const OUT_EN = join(ROOT, 'public', 'guides');
const OUT_CN = join(ROOT, 'public', 'cn', 'guides');

mkdirSync(OUT_EN, { recursive: true });
mkdirSync(OUT_CN, { recursive: true });

/* ----------------------------- frontmatter ----------------------------- */

function parseFrontmatter(text) {
  if (!text.startsWith('---')) return { meta: {}, body: text };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { meta: {}, body: text };
  const header = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\n/, '');
  const meta = {};
  for (const line of header.split('\n')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }
    meta[key] = value;
  }
  return { meta, body };
}

/* ------------------------------- markdown ------------------------------ */

const ESC = (s) => String(s).replace(/&(?!(amp|lt|gt|quot|nbsp);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(s) {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function renderMarkdown(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) { out.push(`<h2>${inline(ESC(line.slice(3)))}</h2>`); i++; continue; }
    if (line.startsWith('### ')) { out.push(`<h3>${inline(ESC(line.slice(4)))}</h3>`); i++; continue; }

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++; }
      i++;
      out.push(`<pre class="codeblock"><code${lang ? ` class="lang-${ESC(lang)}"` : ''}>${ESC(code.join('\n'))}</code></pre>`);
      continue;
    }

    if (/^\s*\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s/, '')); i++; }
      out.push('<ol>' + items.map((it) => `<li>${inline(ESC(it))}</li>`).join('') + '</ol>');
      continue;
    }
    if (/^\s*-\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*-\s/.test(lines[i])) { items.push(lines[i].replace(/^\s*-\s/, '')); i++; }
      out.push('<ul>' + items.map((it) => `<li>${inline(ESC(it))}</li>`).join('') + '</ul>');
      continue;
    }

    if (/^\s*\|.+\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s\-:|]+\|\s*$/.test(lines[i + 1])) {
      const header = line.split('|').slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) {
        rows.push(lines[i].split('|').slice(1, -1).map((c) => c.trim()));
        i++;
      }
      out.push('<div class="tablewrap"><table><thead><tr>' +
        header.map((c) => `<th>${inline(ESC(c))}</th>`).join('') +
        '</tr></thead><tbody>' +
        rows.map((r) => '<tr>' + r.map((c) => `<td>${inline(ESC(c))}</td>`).join('') + '</tr>').join('') +
        '</tbody></table></div>');
      continue;
    }

    if (line.trim() === '') { out.push(''); i++; continue; }

    // paragraph: collect lines until blank
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !/^(##|###|```|\s*[-\d])/.test(lines[i])) { buf.push(lines[i]); i++; }
    out.push(`<p>${inline(ESC(buf.join(' ')))}</p>`);
  }
  return out.join('\n');
}

/* ------------------------------- chrome -------------------------------- */

const CATEGORIES = {
  privacy:    { en: 'Privacy & Security',    cn: '隐私与安全' },
  recipes:    { en: 'Recipes',                cn: '配方' },
  comparison: { en: 'Tool Comparison',        cn: '工具对比' },
  howto:      { en: 'How-To',                 cn: '教程' },
};

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

function collectArticles() {
  if (!existsSync(SRC)) return [];
  const out = [];
  for (const fn of readdirSync(SRC)) {
    if (!fn.endsWith('.md') || fn.endsWith('.zh.md')) continue;
    const slug = basename(fn, '.md');
    const text = readFileSync(join(SRC, fn), 'utf-8');
    const { meta, body } = parseFrontmatter(text);
    const zhPath = join(SRC, `${slug}.zh.md`);
    const zhText = readIfExists(zhPath);
    let zhMeta = null;
    if (zhText) zhMeta = parseFrontmatter(zhText).meta;
    out.push({ slug, meta, body, enText: text, zhText, zhMeta });
  }
  out.sort((a, b) => (b.meta.published || '').localeCompare(a.meta.published || ''));
  return out;
}

/** Localized metadata: prefer the .zh.md frontmatter when lang is cn. */
function localizedMeta(a, lang) {
  if (lang === 'cn' && a.zhMeta) return { ...a.meta, ...a.zhMeta };
  return a.meta;
}

function readIfExists(p) {
  return existsSync(p) ? readFileSync(p, 'utf-8') : null;
}

/* ------------------------------- single page ----------------------------- */

const page = (a, lang, all) => {
  const m = a.meta;
  const dir = lang === 'cn' ? 'cn/' : '';
  const isHome = a.slug === 'index';
  const titleSuffix = lang === 'cn' ? ' | Plobi-kit' : ' | Plobi-kit';
  const html = isHome ? '' : '';

  const related = (m.related || []).map((slug) => {
    const r = all.find((x) => x.slug === slug);
    if (!r) return '';
    return `<a class="related-card" href="${dir}guides/${r.slug}.html">${ESC(r.meta.title || slug)}</a>`;
  }).filter(Boolean).join('');

  const cat = CATEGORIES[m.category] || { en: m.category || '', cn: m.category || '' };
  const catLabel = lang === 'cn' ? cat.cn : cat.en;

  const bodyHtml = isHome ? '' : `
    <article class="article">
      <header class="article-head">
        <div class="article-meta">
          ${catLabel ? `<span class="tag" data-i18n="lib.cat.${m.category || 'howto'}">${catLabel}</span>` : ''}
          ${m.published ? `<time>${fmtDate(m.published)}</time>` : ''}
          ${m.readTime ? `<span class="readtime">${ESC(m.readTime)}</span>` : ''}
        </div>
        <h1>${ESC(m.title || a.slug)}</h1>
        ${m.description ? `<p class="lead">${ESC(m.description)}</p>` : ''}
      </header>
      <div class="article-body">
${renderMarkdown(a.body)}
      </div>
      ${related ? `<section class="article-related"><h3 data-i18n="lib.related">${lang === 'cn' ? '相关文章' : 'Related articles'}</h3><div class="related-grid">${related}</div></section>` : ''}
    </article>`;

  return `<!DOCTYPE html>
<html lang="${lang === 'cn' ? 'zh' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ESC(m.title || a.slug)}${titleSuffix}</title>
  <meta name="description" content="${ESC(m.description || '')}">
  <link rel="stylesheet" href="/styles.css">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#fafafa">
  <link rel="canonical" href="https://plobikit.com/${dir}guides/${a.slug}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5108296372072915" crossorigin="anonymous"></script>
  <style>
    .lib-wrap { max-width: 780px; margin: 0 auto; padding: 12px 20px 64px; }
    .lib-breadcrumb { font-size: 13px; color: var(--text-muted); margin: 16px 0 4px; }
    .lib-breadcrumb a { color: var(--success-color); text-decoration: none; }
    .article-head { margin: 24px 0 32px; }
    .article-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
    .article-meta .tag { background: var(--accent-light); color: var(--text-main); font-weight: 600; padding: 3px 9px; border-radius: 999px; }
    .article-head h1 { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; color: var(--text-main); margin: 0 0 12px; }
    .article-head .lead { font-size: 17px; color: var(--text-muted); line-height: 1.65; margin: 0; }
    .article-body { font-size: 16px; color: var(--text-main); line-height: 1.8; }
    .article-body h2 { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; margin: 36px 0 12px; color: var(--text-main); }
    .article-body h3 { font-size: 18px; font-weight: 700; margin: 28px 0 8px; color: var(--text-main); }
    .article-body p { margin: 14px 0; }
    .article-body code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 14px; background: var(--accent-light); padding: 1px 5px; border-radius: 4px; }
    .article-body pre.codeblock { background: #111; color: #e8e8e8; padding: 16px 18px; border-radius: var(--radius-md); overflow-x: auto; font-size: 13px; line-height: 1.7; }
    .article-body pre.codeblock code { background: transparent; padding: 0; color: inherit; }
    .article-body ul, .article-body ol { padding-left: 22px; margin: 14px 0; }
    .article-body li { margin: 4px 0; }
    .article-body a { color: var(--success-color); text-decoration: underline; }
    .article-related { margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--border-color); }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 12px; }
    .related-card { display: block; padding: 14px 16px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 14px; color: var(--text-main); text-decoration: none; background: var(--bg-card); transition: border-color .18s; }
    .related-card:hover { border-color: var(--success-color); }
    .tablewrap { overflow-x: auto; margin: 16px 0; }
    .article-body table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .article-body th, .article-body td { padding: 9px 12px; border: 1px solid var(--border-color); text-align: left; }
    .article-body th { background: var(--accent-light); }
    @media (max-width: 640px) { .article-head h1 { font-size: 26px; } }
  </style>
</head>
<body>

  <div class="app-container">
    <header class="app-header">
      <div class="logo">
        <a href="/${lang === 'cn' ? 'cn/' : ''}" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">
          <span class="logo-icon" style="background:var(--success-color);">P</span>
          <span id="txt-logo-name">Plobi-kit</span>
        </a>
      </div>
      <nav class="nav-links">
        <a href="/${lang === 'cn' ? 'cn/' : ''}tools/" data-i18n="nav.tools">Tools</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}cheatsheets/" data-i18n="nav.cheatsheets">Cheat Sheets</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}guides/index.html" class="active" data-i18n="nav.library">Library</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}deals" data-i18n="nav.deals">Deals</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}collection/index.html" data-i18n="nav.collection">Collection</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}about.html" data-i18n="nav.about">About</a>
      </nav>
      <div class="controls">
        <button class="lang-btn" id="lang-btn">${lang === 'cn' ? 'EN' : 'CN'}</button>
      </div>
    </header>

    <main class="lib-wrap">
      <p class="lib-breadcrumb"><a href="/${lang === 'cn' ? 'cn/' : ''}guides/">${lang === 'cn' ? '知识库' : 'Library'}</a> · ${ESC(m.category || '')}</p>
      ${bodyHtml}
    </main>

    <footer class="app-footer">
      <div class="footer-nav">
        <a href="/${lang === 'cn' ? 'cn/' : ''}privacy.html" data-i18n="nav-footer.privacy">Privacy Policy</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}terms.html" data-i18n="nav-footer.terms">Terms</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}about.html" data-i18n="nav-footer.about">About</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}contact.html" data-i18n="nav-footer.contact">Contact</a>
      </div>
      <div class="copyright" id="nav-footer-copy">
        &copy; 2026 Plobi. All rights reserved.
      </div>
    </footer>
  </div>

  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('Service Worker registered successfully.', reg))
          .catch(err => console.log('Service Worker registration failed.', err));
      });
    }
  </script>
  <script type="module">
    import { applyTranslations, currentLang } from '/js/i18n-content.js';
    import '/app.js';
    applyTranslations(currentLang());
  </script>
</body>
</html>`;
};

/* ------------------------------- hub page ------------------------------ */

function buildHub(all, lang) {
  const dir = lang === 'cn' ? 'cn/' : '';
  const T = lang === 'cn'
    ? { title: '知识库', intro: '实用的隐私、配方、对比与教程——回答你搜索的每一个问题。', cat: '分类', read: '阅读', all: '全部' }
    : { title: 'Library', intro: 'Practical guides on privacy, recipes, comparisons, and how-tos — answering the questions you actually search for.', cat: 'Categories', read: 'read', all: 'All' };

  const cards = all.map((a) => {
    const m = localizedMeta(a, lang);
    return `<a class="lib-card" href="${dir}guides/${a.slug}.html">
      <div class="lib-card-meta">
        <span class="tag">${ESC((CATEGORIES[m.category] || { en: '' })[lang] || m.category || '')}</span>
        ${m.readTime ? `<span class="readtime">${ESC(m.readTime)}</span>` : ''}
      </div>
      <h2>${ESC(m.title || a.slug)}</h2>
      ${m.description ? `<p>${ESC(m.description)}</p>` : ''}
    </a>`;
  }).join('\n      ');

  return `<!DOCTYPE html>
<html lang="${lang === 'cn' ? 'zh' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${T.title} | Plobi-kit</title>
  <meta name="description" content="${T.intro}">
  <link rel="stylesheet" href="/styles.css">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#fafafa">
  <link rel="canonical" href="https://plobikit.com/${dir}guides/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5108296372072915" crossorigin="anonymous"></script>
  <style>
    .lib-wrap { max-width: 920px; margin: 0 auto; padding: 12px 20px 64px; }
    .lib-intro h1 { font-size: 36px; font-weight: 800; letter-spacing: -0.025em; line-height: 1.15; margin: 24px 0 12px; color: var(--text-main); }
    .lib-intro p { font-size: 17px; color: var(--text-muted); line-height: 1.7; max-width: 640px; margin: 0 0 32px; }
    .lib-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; }
    .lib-card { display: block; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 22px 24px; text-decoration: none; color: inherit; transition: border-color .18s, transform .18s; }
    .lib-card:hover { border-color: var(--success-color); transform: translateY(-2px); }
    .lib-card-meta { display: flex; gap: 10px; align-items: center; font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
    .lib-card-meta .tag { background: var(--accent-light); color: var(--text-main); font-weight: 600; padding: 2px 9px; border-radius: 999px; }
    .lib-card h2 { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.3; margin: 0 0 8px; color: var(--text-main); }
    .lib-card p { font-size: 13.5px; color: var(--text-muted); line-height: 1.6; margin: 0; }
  </style>
</head>
<body>

  <div class="app-container">
    <header class="app-header">
      <div class="logo">
        <a href="/${lang === 'cn' ? 'cn/' : ''}" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">
          <span class="logo-icon" style="background:var(--success-color);">P</span>
          <span id="txt-logo-name">Plobi-kit</span>
        </a>
      </div>
      <nav class="nav-links">
        <a href="/${lang === 'cn' ? 'cn/' : ''}tools/" data-i18n="nav.tools">Tools</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}cheatsheets/" data-i18n="nav.cheatsheets">Cheat Sheets</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}guides/" class="active" data-i18n="nav.library">Library</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}deals" data-i18n="nav.deals">Deals</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}collection/index.html" data-i18n="nav.collection">Collection</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}about.html" data-i18n="nav.about">About</a>
      </nav>
      <div class="controls">
        <button class="lang-btn" id="lang-btn">${lang === 'cn' ? 'EN' : 'CN'}</button>
      </div>
    </header>

    <main class="lib-wrap">
      <div class="lib-intro">
        <h1>${T.title}</h1>
        <p>${T.intro}</p>
      </div>
      <div class="lib-grid">
      ${cards}
      </div>
    </main>

    <footer class="app-footer">
      <div class="footer-nav">
        <a href="/${lang === 'cn' ? 'cn/' : ''}privacy.html" data-i18n="nav-footer.privacy">Privacy Policy</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}terms.html" data-i18n="nav-footer.terms">Terms</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}about.html" data-i18n="nav-footer.about">About</a>
        <a href="/${lang === 'cn' ? 'cn/' : ''}contact.html" data-i18n="nav-footer.contact">Contact</a>
      </div>
      <div class="copyright" id="nav-footer-copy">
        &copy; 2026 Plobi. All rights reserved.
      </div>
    </footer>
  </div>

  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('Service Worker registered successfully.', reg))
          .catch(err => console.log('Service Worker registration failed.', err));
      });
    }
  </script>
  <script type="module">
    import { applyTranslations, currentLang } from '/js/i18n-content.js';
    import '/app.js';
    applyTranslations(currentLang());
  </script>
</body>
</html>`;
}

/* -------------------------------- main -------------------------------- */

const articles = collectArticles();
for (const a of articles) {
  if (a.slug === 'index') continue;
  writeFileSync(join(OUT_EN, `${a.slug}.html`), page(a, 'en', articles), 'utf-8');
  if (a.zhText) {
    const { meta: zhMeta, body: zhBody } = parseFrontmatter(a.zhText);
    const merged = { ...a.meta, ...zhMeta, body: zhBody };
    writeFileSync(join(OUT_CN, `${a.slug}.html`), page({ ...a, meta: merged, body: zhBody }, 'cn', articles), 'utf-8');
  } else {
    // No translation yet: emit CN page as a "stub" with a banner.
    const stub = `<div style="background: rgba(0,112,243,.08); border: 1px solid rgba(0,112,243,.25); border-radius: 6px; padding: 12px 20px; font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">该文章暂无中文版本,以下为英文原文。</div>` + renderMarkdown(a.body);
    writeFileSync(join(OUT_CN, `${a.slug}.html`), page({ ...a, body: stub }, 'cn', articles), 'utf-8');
  }
}
writeFileSync(join(OUT_EN, 'index.html'), buildHub(articles.filter((a) => a.slug !== 'index'), 'en'), 'utf-8');
writeFileSync(join(OUT_CN, 'index.html'), buildHub(articles.filter((a) => a.slug !== 'index'), 'cn'), 'utf-8');
console.log(`generated ${articles.length} article(s) + hub for EN and CN.`);
