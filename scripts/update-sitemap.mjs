/**
 * Refresh sitemap.xml:
 *   - clean URLs (drop .html / index.html — matches the assets layer's
 *     auto-trailing-slash html_handling)
 *   - keep every recorded <lastmod>; date entries that have none, and pass
 *     --restamp when a batch of content really did change
 *   - append any page (or SSR route) that is not listed yet
 *   - rebuild hreflang alternates for EVERY entry from the language versions
 *     that really exist, plus x-default -> the English URL
 * Also ensures robots.txt declares the sitemap.
 *
 * Run after content changes: node scripts/update-sitemap.mjs [--restamp]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  fileToUrl, walkHtml, toLf, LANGS, HREFLANG,
  stripLangPrefix, urlForLang, langVariants,
} from './lib/urls.mjs';

const ROOT = process.cwd();
const SITE = join(ROOT, 'public');
const ORIGIN = 'https://plobikit.com';

// SSR pages are real, indexable URLs in each language tree — not cookie-only
// variants. Keep one explicit list so sitemap and checks agree.
const SSR_PAGES = [
  '/deals', '/deals/games', '/deals/servers', '/deals/software', '/deals/ai',
  '/ai/free-models',
];
const SSR_URLS = SSR_PAGES.flatMap((p) => LANGS.map((l) => urlForLang(p, l)));

let sitemap = toLf(readFileSync(join(SITE, 'sitemap.xml'), 'utf8'));

// Clean every absolute URL in <loc> and hreflang href attributes.
sitemap = sitemap.replace(/https:\/\/plobikit\.com\/((?:cn|es)\/)?([^"<\s]*?)\.html/g, (m, prefix, rest) => {
  const base = `${ORIGIN}/${prefix || ''}`;
  if (rest === '' || rest === 'index') return base;
  if (rest.endsWith('/index')) return base + rest.slice(0, -'index'.length);
  return base + rest;
});

// lastmod must be reproducible on any machine, and a file's mtime is not: a
// fresh checkout stamps every page with "now", so a CI build rewrote all dates
// and failed the drift gate. Recorded dates are therefore kept as committed;
// --restamp re-dates everything when a batch of content actually changed.
const TODAY = new Date().toISOString().slice(0, 10);
const restamp = process.argv.includes('--restamp');

sitemap = sitemap.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
  if (!block.includes('<loc>')) return block;
  const dated = /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(block);
  if (dated && !restamp) return block;
  if (/<lastmod>[^<]*<\/lastmod>/.test(block)) {
    return block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${TODAY}</lastmod>`);
  }
  return block.replace('</loc>', `</loc>\n    <lastmod>${TODAY}</lastmod>`);
});

const pages = walkHtml(SITE).map(fileToUrl);
const listed = new Set([...sitemap.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1]));
const served = new Set([...pages, ...SSR_URLS]);

const missing = [...new Set([...pages, ...SSR_URLS].filter((u) => !listed.has(u)))];
if (missing.length) {
  const entries = missing.map((u) =>
    `  <url>\n    <loc>${ORIGIN}${u}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>`);
  sitemap = sitemap.replace(/<\/urlset>/, `${entries.join('\n')}\n</urlset>`);
}

// Rebuild hreflang for every entry. Old alternates are removed first so a page
// that gained or lost a translation cannot leave a stale link behind.
sitemap = sitemap.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
  const m = block.match(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/);
  if (!m) return block;
  const bare = stripLangPrefix(m[1]);
  // Horizontal whitespace only — see normalize-nav.mjs for why \s* is unsafe.
  const clean = block.replace(/^[\t ]*<xhtml:link[^>]*hreflang="[^"]+"[^>]*\/?>[ \t]*\r?\n?/gim, '');
  const variants = langVariants(bare, served);
  const alts = variants.map((l) =>
    `\n    <xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${ORIGIN}${urlForLang(bare, l)}"/>`).join('')
    + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${urlForLang(bare, 'en')}"/>`;
  return clean.replace(/\s*<\/url>/, `${alts}\n  </url>`);
});

writeFileSync(join(SITE, 'sitemap.xml'), sitemap, 'utf8');

const robotsPath = join(SITE, 'robots.txt');
let robots = readFileSync(robotsPath, 'utf8');
if (!/Sitemap:/i.test(robots)) {
  robots = `Sitemap: ${ORIGIN}/sitemap.xml\n\n${robots}`;
  writeFileSync(robotsPath, robots, 'utf8');
  console.log('robots.txt: sitemap line added');
}

const urls = (sitemap.match(/<loc>/g) || []).length;
const sample = sitemap.match(/<loc>([^<]+)<\/loc>/g).slice(0, 4).map((x) => x.replace(/<\/?loc>/g, ''));
console.log(`sitemap.xml updated: ${urls} URLs, e.g. ${sample.join(', ')}`);
