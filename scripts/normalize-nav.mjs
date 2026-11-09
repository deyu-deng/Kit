/**
 * Chrome contract — the last pass over every static page. Idempotent.
 *
 * Owns, for all of public/:
 *   1. header nav + footer nav (labels, order, active state, data-i18n keys)
 *   2. the logo link -> the language homepage
 *   3. the language selector inside .controls
 *   4. every internal link and asset URL rewritten into its canonical,
 *      root-absolute form
 *   5. hreflang alternates, generated from the language versions that really
 *      exist on disk (plus worker-owned routes)
 *   6. data-available-langs on <body>, so the client switcher never sends a
 *      visitor to a URL that does not exist
 *   7. the i18n activation script, so /js/i18n-content.js actually runs
 *
 * Generators are free to write chrome the old way: this pass fixes every page
 * afterwards, and check-links.mjs proves it stayed fixed. Adding a translated
 * page needs no edit here — hreflang, nav targets and the switcher follow the
 * filesystem automatically.
 *
 * Run: node scripts/normalize-nav.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildIndex, fileToUrl, walkHtml, resolveFrom, toLf, EXTERNAL,
  LANGS, HREFLANG, langFromUrl, stripLangPrefix, urlForLang, langVariants,
} from './lib/urls.mjs';

const SITE = join(process.cwd(), 'public');
const ORIGIN = 'https://plobikit.com';

const LABELS = {
  en: {
    tools: 'Tools', cheatsheets: 'Cheat Sheets', library: 'Library', deals: 'Deals',
    collection: 'Collection', about: 'About',
    privacy: 'Privacy Policy', terms: 'Terms', contact: 'Contact',
  },
  cn: {
    tools: '工具箱', cheatsheets: '速查表', library: '知识库', deals: '优惠活动',
    collection: '精选合集', about: '关于我们',
    privacy: '隐私政策', terms: '服务条款', contact: '联系我们',
  },
  es: {
    tools: 'Herramientas', cheatsheets: 'Guías rápidas', library: 'Biblioteca', deals: 'Ofertas',
    collection: 'Colección', about: 'Acerca de',
    privacy: 'Privacidad', terms: 'Términos', contact: 'Contacto',
  },
};

const LANG_NAMES = { en: 'EN', cn: '中文', es: 'ES' };

// section -> [key, enUrl, cnUrl, esUrl]. A language URL is used only when that
// page actually exists there (static or worker-owned); otherwise the English
// tree is the destination and the client dictionary keeps the chosen language.
const SECTIONS = [
  ['tools', '/tools/', '/cn/tools/', '/es/tools/'],
  ['cheatsheets', '/cheatsheets/', '/cn/cheatsheets/', '/es/cheatsheets/'],
  ['library', '/guides/', '/cn/guides/', '/es/guides/'],
  ['deals', '/deals', '/cn/deals', '/es/deals'],
  ['collection', '/collection/', '/cn/collection/', '/es/collection/'],
  ['about', '/about', '/cn/about', '/es/about'],
];
const FOOTER_LINKS = [
  ['privacy', '/privacy', '/cn/privacy', '/es/privacy'],
  ['terms', '/terms', '/cn/terms', '/es/terms'],
  ['about', '/about', '/cn/about', '/es/about'],
  ['contact', '/contact', '/cn/contact', '/es/contact'],
];

const sectionUrl = (section, lang, index) => {
  const pos = LANGS.indexOf(lang) + 1;
  const candidate = section[pos];
  return index.resolve(candidate) ? candidate : section[1];
};

function pageContext(file) {
  const rel = file.slice(SITE.length + 1).replace(/\\/g, '/');
  const url = fileToUrl(rel);
  const lang = langFromUrl(url);
  let active = '';
  const bare = stripLangPrefix(url);
  if (bare.startsWith('/tools/') || bare === '/tools/') active = 'tools';
  else if (bare.startsWith('/cheatsheets/') || bare === '/cheatsheets/') active = 'cheatsheets';
  else if (bare === '/about') active = 'about';
  else if (bare.startsWith('/guides/') || bare === '/guides/') active = 'library';
  else if (bare.startsWith('/collection/')) active = 'collection';
  return { rel, url, lang, active };
}

function navBlocks(ctx, index) {
  const L = LABELS[ctx.lang];
  const link = (section) => sectionUrl(section, ctx.lang, index);
  const header = SECTIONS
    .map((section) => {
      const [key] = section;
      const cls = key === ctx.active ? ' class="active"' : '';
      return `<a href="${link(section)}"${cls} id="nav-${key}" data-i18n="nav.${key}">${L[key]}</a>`;
    })
    .join('\n        ');
  const footer = FOOTER_LINKS
    .map((section) => {
      const [key] = section;
      return `<a href="${link(section)}" id="nav-footer-${key}" data-i18n="nav-footer.${key}">${L[key]}</a>`;
    })
    .join('\n        ');
  return { header, footer };
}

function langControl(lang) {
  return `<select id="lang-select" class="lang-btn" aria-label="Language">\n`
    + LANGS.map((l) => `          <option value="${l}"${l === lang ? ' selected' : ''}>${LANG_NAMES[l]}</option>`).join('\n')
    + `\n        </select>`;
}

/** Rebuild hreflang from the language versions that really exist. */
function hreflangBlock(selfUrl, index) {
  const bare = stripLangPrefix(selfUrl);
  const variants = langVariants(bare, index.pages);
  const links = variants.map((l) =>
    `<link rel="alternate" hreflang="${HREFLANG[l]}" href="${ORIGIN}${urlForLang(bare, l)}">`);
  links.push(`<link rel="alternate" hreflang="x-default" href="${ORIGIN}${urlForLang(bare, 'en')}">`);
  return links.join('\n  ');
}

/** rewrite href/src outside <script> bodies */
function canonicalizeUrls(html, selfUrl, index) {
  return html
    .split(/(<script[\s\S]*?<\/script>)/g)
    .map((part) => (/^<script/.test(part) ? part : part.replace(/((?:href|src)=")([^"]+)"/g, (m, prefix, raw) => {
      if (EXTERNAL.test(raw)) return m;
      const served = index.resolve(resolveFrom(selfUrl, raw));
      return served ? `${prefix}${served}"` : m;
    })))
    .join('');
}

const BARE_LOGO = /<div class="logo">\s*<span class="logo-icon"[^>]*>[^<]*<\/span>\s*<span id="txt-logo-name">[^<]*<\/span>\s*<\/div>/;
const LOGO_LINK = /<a href="[^"]*"\s+style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">/g;
// Horizontal whitespace only: a trailing \s* would swallow the next line's
// newline and indentation, leaving alternates behind (and re-adding a new set
// on every build). That made the build non-idempotent and failed the CI gate.
const HREFLANG_LINK = /^[\t ]*<link[^>]*rel="alternate"[^>]*hreflang="[^"]+"[^>]*>[ \t]*\r?\n?/gim;
const OLD_LANG_BUTTON = /<button class="lang-btn"[^>]*>[\s\S]*?<\/button>/;
const I18N_BOOT = `<script type="module">
    import { applyTranslations, currentLang } from '/js/i18n-content.js';
    import '/app.js';
    applyTranslations(currentLang());
  </script>
</body>`;

// One type system for every page: Fraunces for display, Inter for body,
// JetBrains Mono for labels/data. Injected here so a new page can never ship
// with a different font stack.
const FONT_QUERY = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap';
const FONT_LINK_TAG = `<link href="${FONT_QUERY}" rel="stylesheet">`;

const index = buildIndex(SITE);
let changed = 0;

for (const rel of walkHtml(SITE)) {
  const file = join(SITE, rel);
  const before = readFileSync(file, 'utf8');
  const ctx = pageContext(file);
  const { header, footer } = navBlocks(ctx, index);
  const home = urlForLang('/', ctx.lang);
  let out = before;

  const navBlock = out.match(/<nav class="nav-links">[\s\S]*?<\/nav>/);
  if (navBlock) out = out.replace(navBlock[0], `<nav class="nav-links">\n        ${header}\n      </nav>`);

  const footerBlock = out.match(/<div class="footer-nav">[\s\S]*?<\/div>/);
  if (footerBlock) out = out.replace(footerBlock[0], `<div class="footer-nav">\n        ${footer}\n      </div>`);

  out = out.replace(
    BARE_LOGO,
    `<div class="logo">\n        <a href="${home}" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">\n          <span class="logo-icon" style="background:var(--success-color);">P</span>\n          <span id="txt-logo-name">Plobi-kit</span>\n        </a>\n      </div>`
  );
  out = out.replace(LOGO_LINK, `<a href="${home}" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">`);

  const control = langControl(ctx.lang);
  if (OLD_LANG_BUTTON.test(out)) out = out.replace(OLD_LANG_BUTTON, control);
  else out = out.replace(/<div class="controls">\s*<\/div>/, `<div class="controls">\n        ${control}\n      </div>`);

  out = canonicalizeUrls(out, ctx.url, index);

  out = out.replace(/<link[^>]*fonts\.googleapis\.com\/css2[^>]*>/g, FONT_LINK_TAG);
  if (!out.includes(FONT_LINK_TAG)) out = out.replace('</head>', `  ${FONT_LINK_TAG}\n</head>`);

  out = out.replace(HREFLANG_LINK, '');
  out = out.replace(/<\/head>/, `  ${hreflangBlock(ctx.url, index)}\n</head>`);

  const variants = langVariants(ctx.url, index.pages).join(',');
  out = out.replace(/<body([^>]*)>/, (m, attrs) =>
    `<body${attrs.replace(/\s*data-available-langs="[^"]*"/g, '')} data-available-langs="${variants}">`);

  if (!/applyTranslations\s*\(/.test(out)) out = out.replace(/<\/body>/, I18N_BOOT);

  out = toLf(out);
  if (out !== before) {
    writeFileSync(file, out, 'utf8');
    changed++;
    console.log(`chrome: ${rel}`);
  }
}
console.log(`\n${changed} file(s) updated.`);
