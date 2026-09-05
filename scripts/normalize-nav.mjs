/**
 * Navigation normalization (idempotent — safe to re-run).
 *
 * Regenerates the whole <nav class="nav-links"> block and the footer-nav
 * div on every static page from ONE canonical spec, so header/footer can
 * never drift apart again (labels, order, active state, depth prefixes).
 *
 * Spec:
 *   header: Home · Cheat Sheet · Guides · Deals · Collection · About
 *           (frequency order; About last; no Contact — it lives in the footer)
 *   footer: Privacy Policy · Terms · About · Contact  (+ © line untouched)
 *
 * CN pages keep Chinese labels and link within the /cn/ subtree for site
 * pages; Deals/Collection (en-only) always point at the site root.
 *
 * Run: node scripts/normalize-nav.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const DIRS = ['.', 'cn', 'tools', 'cn/tools', 'guides', 'cn/guides', 'collection', 'cheatsheets'].map((d) => join('public', d));

function listHtmlFiles() {
  const files = [];
  for (const dir of DIRS) {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.html')) files.push(join(ROOT, dir, entry.name));
    }
  }
  return files;
}

function buildNav(file) {
  const rel = relative(join(ROOT, 'public'), file).replace(/\\/g, '/');
  const depth = rel.split('/').length - 1;
  const rootPrefix = '../'.repeat(depth);          // reaches site root from this file
  const cnSub = rel.startsWith('cn/');
  const cnPrefix = '../'.repeat(Math.max(0, depth - 1)); // reaches /cn/ from a cn file
  const cn = cnSub || /<html lang="zh"/.test(readFileSync(file, 'utf8').slice(0, 200));

  // Site-page links stay inside the current language subtree.
  const site = (name) => (cnSub ? cnPrefix : rootPrefix) + name;
  // En-only sections always live at the site root.
  const rootLink = (name) => rootPrefix + name;

  const L = cn
    ? { tools: '工具箱', cheatsheets: '速查表', library: '知识库', guides: '技术教程', deals: '优惠活动', collection: '精选合集', about: '关于我们', privacy: '隐私政策', terms: '服务条款', contact: '联系我们' }
    : { tools: 'Tools', cheatsheets: 'Cheat Sheets', library: 'Library', guides: 'Guides', deals: 'Deals', collection: 'Collection', about: 'About', privacy: 'Privacy Policy', terms: 'Terms', contact: 'Contact' };

  const items = [
    ['tools', L.tools, site('tools/index.html')],
    ['cheatsheets', L.cheatsheets, rootLink('cheatsheets/')],
    ['library', L.library, site('guides/index.html')],
    ['deals', L.deals, rootLink('deals')],
    ['collection', L.collection, rootLink('collection/index.html')],
    ['about', L.about, site('about.html')],
  ];

  // Which section is this page in? (for the active highlight)
  let active = '';
  if (rel === 'tools/index.html' || rel.startsWith('tools/') || rel.startsWith('cn/tools/')) active = 'tools';
  else if (rel.startsWith('cheatsheets/')) active = 'cheatsheets';
  else if (rel === 'about.html' || rel === 'cn/about.html') active = 'about';
  else if (rel.startsWith('guides/') || rel.startsWith('cn/guides/')) active = 'library';
  else if (rel.startsWith('collection/')) active = 'collection';

  const header = items
    .map(([key, label, href]) => {
      const cls = key === active ? ' class="active"' : '';
      return `<a href="${href}"${cls} id="nav-${key}" data-i18n="nav.${key}">${label}</a>`;
    })
    .join('\n        ');

  const footer = [
    `<a href="${site('privacy.html')}" id="nav-footer-privacy" data-i18n="nav-footer.privacy">${L.privacy}</a>`,
    `<a href="${site('terms.html')}" id="nav-footer-terms" data-i18n="nav-footer.terms">${L.terms}</a>`,
    `<a href="${site('about.html')}" id="nav-footer-about" data-i18n="nav-footer.about">${L.about}</a>`,
    `<a href="${site('contact.html')}" id="nav-footer-contact" data-i18n="nav-footer.contact">${L.contact}</a>`,
  ].join('\n        ');

  return { header, footer, rel, cnSub, cnPrefix, rootPrefix, cn };
}

let changed = 0;
for (const file of listHtmlFiles()) {
  const s = readFileSync(file, 'utf8');
  const { header, footer, rel, cnSub, cnPrefix, rootPrefix, cn } = buildNav(file);

  let out = s;
  let touched = false;

  const navBlock = out.match(/<nav class="nav-links">[\s\S]*?<\/nav>/);
  if (navBlock) {
    const next = `<nav class="nav-links">\n        ${header}\n      </nav>`;
    if (navBlock[0] !== next) { out = out.replace(navBlock[0], next); touched = true; }
  }

  const footerBlock = out.match(/<div class="footer-nav">[\s\S]*?<\/div>/);
  if (footerBlock) {
    const next = `<div class="footer-nav">\n        ${footer}\n      </div>`;
    if (footerBlock[0] !== next) { out = out.replace(footerBlock[0], next); touched = true; }
  }

  if (touched) {
    writeFileSync(file, out, 'utf8');
    changed++;
    console.log(`normalized: ${rel}`);
  }

  // --- Logo must link to the language home (the nav has no Home item) ---
  // --- Controls must contain the language toggle                       ---
  const logoHome = cnSub ? cnPrefix + 'index.html' : rootPrefix + 'index.html';
  const langLabel = cn ? 'EN' : 'CN';
  let out2 = readFileSync(file, 'utf8');
  let touched2 = false;

  const bareLogo = out2.match(/<div class="logo">\s*<span class="logo-icon"[^>]*>[^<]*<\/span>\s*<span id="txt-logo-name">[^<]*<\/span>\s*<\/div>/);
  if (bareLogo) {
    out2 = out2.replace(
      bareLogo[0],
      `<div class="logo">\n        <a href="${logoHome}" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">\n          <span class="logo-icon" style="background:var(--success-color);">P</span>\n          <span id="txt-logo-name">Plobi-kit</span>\n        </a>\n      </div>`
    );
    touched2 = true;
  }

  if (!/<button class="lang-btn"/.test(out2)) {
    const emptyControls = out2.match(/<div class="controls">\s*<\/div>/);
    if (emptyControls) {
      out2 = out2.replace(
        emptyControls[0],
        `<div class="controls">\n        <button class="lang-btn" id="lang-btn">${langLabel}</button>\n      </div>`
      );
      touched2 = true;
    }
  }

  if (touched2) {
    writeFileSync(file, out2, 'utf8');
    if (!touched) changed++;
    console.log(`chrome fixed: ${rel}`);
  }
}
console.log(`\n${changed} file(s) updated.`);
