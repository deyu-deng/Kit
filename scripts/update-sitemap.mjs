/**
 * Refresh sitemap.xml:
 *   - clean URLs (drop .html / index.html — matches the assets layer's
 *     auto-trailing-slash html_handling)
 *   - real <lastmod> dates from each file's modification time
 *   - append any page that is not listed yet, with hreflang alternates when the
 *     other language has a page too
 * Also ensures robots.txt declares the sitemap.
 *
 * Run after content changes: node scripts/update-sitemap.mjs
 */
import { readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileToUrl, walkHtml, toLf } from './lib/urls.mjs';

const ROOT = process.cwd();
const SITE = join(ROOT, 'public');

function urlToFile(pathname) {
  if (pathname === '/') return join(SITE, 'index.html');
  if (pathname.endsWith('/')) return join(SITE, pathname.slice(1), 'index.html');
  return join(SITE, pathname.slice(1) + '.html');
}

let sitemap = toLf(readFileSync(join(SITE, 'sitemap.xml'), 'utf8'));

// Clean every absolute URL in <loc> and hreflang href attributes.
sitemap = sitemap.replace(/https:\/\/plobikit\.com\/(cn\/)?([^"<\s]*?)\.html/g, (m, cn, rest) => {
  const base = `https://plobikit.com/${cn || ''}`;
  if (rest === '' || rest === 'index') return base;
  // section hubs: guides/index.html -> guides/ , never bare guides/index
  if (rest.endsWith('/index')) return base + rest.slice(0, -'index'.length);
  return base + rest;
});

// Real lastmod per <url> block, from the file's mtime.
sitemap = sitemap.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
  const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1];
  if (!loc) return block;
  const file = urlToFile(new URL(loc).pathname);
  if (!existsSync(file)) return block;
  const iso = statSync(file).mtime.toISOString().slice(0, 10);
  return block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${iso}</lastmod>`);
});

// A page that exists on disk but is not listed yet gets appended, so adding a
// translated page cannot leave the sitemap behind.
const pages = walkHtml(SITE).map(fileToUrl);
const listed = new Set([...sitemap.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1]));

const counterpart = (u) =>
  u === '/' ? '/cn/' : u.startsWith('/cn/') ? (u.slice(3) || '/') : `/cn${u}`;

function newEntry(u) {
  const other = counterpart(u);
  const zh = u.startsWith('/cn') ? u : pages.includes(other) ? other : null;
  const en = u.startsWith('/cn') ? (pages.includes(other) ? other : null) : u;
  const alts = zh && en
    ? `\n    <xhtml:link rel="alternate" hreflang="zh" href="https://plobikit.com${zh}"/>`
      + `\n    <xhtml:link rel="alternate" hreflang="en" href="https://plobikit.com${en}"/>`
    : '';
  const lastmod = statSync(urlToFile(u)).mtime.toISOString().slice(0, 10);
  return `  <url>\n    <loc>https://plobikit.com${u}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>${alts}\n  </url>`;
}

const missing = [...new Set(pages.filter((u) => !listed.has(u)))];
if (missing.length) {
  sitemap = sitemap.replace(/<\/urlset>/, `${missing.map(newEntry).join('\n')}\n</urlset>`);
}

writeFileSync(join(SITE, 'sitemap.xml'), sitemap, 'utf8');

// robots.txt: declare the sitemap once.
const robotsPath = join(SITE, 'robots.txt');
let robots = readFileSync(robotsPath, 'utf8');
if (!/Sitemap:/i.test(robots)) {
  robots = `Sitemap: https://plobikit.com/sitemap.xml\n\n${robots}`;
  writeFileSync(robotsPath, robots, 'utf8');
  console.log('robots.txt: sitemap line added');
}

const urls = (sitemap.match(/<loc>/g) || []).length;
const sample = sitemap.match(/<loc>([^<]+)<\/loc>/g).slice(0, 4).map((x) => x.replace(/<\/?loc>/g, ''));
console.log(`sitemap.xml updated: ${urls} URLs, e.g. ${sample.join(', ')}`);
