/**
 * Chrome contract — the last pass over every static page. Idempotent.
 *
 * Owns, for all of public/:
 *   1. header nav + footer nav (labels, order, active state, data-i18n keys)
 *   2. the logo link -> the language homepage
 *   3. the language toggle button inside .controls
 *   4. every internal link and asset URL rewritten into its canonical,
 *      root-absolute form, so no page depends on its own depth and no link
 *      costs a 307 hop
 *   5. the i18n activation script, so /js/i18n-content.js actually runs
 *
 * Generators are free to write chrome and links the old way: this pass fixes
 * every page afterwards, and scripts/check-links.mjs proves it stayed fixed.
 * Inline <script> bodies are left untouched — their string literals are not
 * markup.
 *
 * Sections that exist in English only (Cheat Sheets, Deals, Collection) always
 * link to the site root, never to a /cn/ twin.
 *
 * Run: node scripts/normalize-nav.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildIndex, fileToUrl, walkHtml, resolveFrom, toLf, EXTERNAL } from './lib/urls.mjs';

const SITE = join(process.cwd(), 'public');

const EN_LABELS = {
  tools: 'Tools', cheatsheets: 'Cheat Sheets', library: 'Library', deals: 'Deals',
  collection: 'Collection', about: 'About',
  privacy: 'Privacy Policy', terms: 'Terms', contact: 'Contact',
};
const CN_LABELS = {
  tools: '工具箱', cheatsheets: '速查表', library: '知识库', deals: '优惠活动',
  collection: '精选合集', about: '关于我们',
  privacy: '隐私政策', terms: '服务条款', contact: '联系我们',
};

// section -> [enUrl, cnUrl]. The Chinese URL is used only when a page actually
// exists there, so a section that gains a translation needs no edit here, and a
// section that never has one keeps linking to the English tree.
const SECTIONS = [
  ['tools', '/tools/', '/cn/tools/'],
  ['cheatsheets', '/cheatsheets/', '/cn/cheatsheets/'],
  ['library', '/guides/', '/cn/guides/'],
  ['deals', '/deals', '/cn/deals'],
  ['collection', '/collection/', '/cn/collection/'],
  ['about', '/about', '/cn/about'],
];
const FOOTER_LINKS = [
  ['privacy', '/privacy', '/cn/privacy'],
  ['terms', '/terms', '/cn/terms'],
  ['about', '/about', '/cn/about'],
  ['contact', '/contact', '/cn/contact'],
];

// A page links to a section in its own language when that section actually has
// a page there; otherwise it links to the English one.
const sectionUrl = ([, enUrl, cnUrl], cnSub, index) => (cnSub && index.pages.has(cnUrl) ? cnUrl : enUrl);

function pageContext(file) {
  const rel = file.slice(SITE.length + 1).replace(/\\/g, '/');
  const cnSub = rel.startsWith('cn/');
  const cn = cnSub || /<html lang="zh"/.test(readFileSync(file, 'utf8').slice(0, 400));
  let active = '';
  if (rel.startsWith('tools/') || rel.startsWith('cn/tools/')) active = 'tools';
  else if (rel.startsWith('cheatsheets/') || rel.startsWith('cn/cheatsheets/')) active = 'cheatsheets';
  else if (rel === 'about.html' || rel === 'cn/about.html') active = 'about';
  else if (rel.startsWith('guides/') || rel.startsWith('cn/guides/')) active = 'library';
  else if (rel.startsWith('collection/')) active = 'collection';
  return { rel, cn, cnSub, active };
}

function navBlocks(ctx, index) {
  const L = ctx.cn ? CN_LABELS : EN_LABELS;
  const link = (section) => sectionUrl(section, ctx.cnSub, index);
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
const I18N_BOOT = `<script type="module">
    import { applyTranslations, currentLang } from '/js/i18n-content.js';
    import '/app.js';
    applyTranslations(currentLang());
  </script>
</body>`;

const index = buildIndex(SITE);
let changed = 0;

for (const rel of walkHtml(SITE)) {
  const file = join(SITE, rel);
  const before = readFileSync(file, 'utf8');
  const ctx = pageContext(file);
  const { header, footer } = navBlocks(ctx, index);
  const home = ctx.cnSub ? '/cn/' : '/';
  let out = before;

  const navBlock = out.match(/<nav class="nav-links">[\s\S]*?<\/nav>/);
  if (navBlock) out = out.replace(navBlock[0], `<nav class="nav-links">\n        ${header}\n      </nav>`);

  const footerBlock = out.match(/<div class="footer-nav">[\s\S]*?<\/div>/);
  if (footerBlock) out = out.replace(footerBlock[0], `<div class="footer-nav">\n        ${footer}\n      </div>`);

  // a logo without a link is chrome-incomplete: wrap it
  out = out.replace(
    BARE_LOGO,
    `<div class="logo">\n        <a href="${home}" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">\n          <span class="logo-icon" style="background:var(--success-color);">P</span>\n          <span id="txt-logo-name">Plobi-kit</span>\n        </a>\n      </div>`
  );
  out = out.replace(LOGO_LINK, `<a href="${home}" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">`);

  if (!/<button class="lang-btn"/.test(out)) {
    out = out.replace(
      /<div class="controls">\s*<\/div>/,
      `<div class="controls">\n        <button class="lang-btn" id="lang-btn">${ctx.cn ? 'EN' : 'CN'}</button>\n      </div>`
    );
  }

  out = canonicalizeUrls(out, fileToUrl(rel), index);

  if (!/applyTranslations\s*\(/.test(out)) out = out.replace(/<\/body>/, I18N_BOOT);

  out = toLf(out);
  if (out !== before) {
    writeFileSync(file, out, 'utf8');
    changed++;
    console.log(`chrome: ${rel}`);
  }
}
console.log(`\n${changed} file(s) updated.`);
