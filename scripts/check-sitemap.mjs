/**
 * Check sitemap.xml against the pages in public/:
 *   - every HTML page has a <loc>
 *   - every <loc> maps to a real page (or an allowlisted worker route)
 *   - every URL is canonical for the assets layer's auto-trailing-slash
 *     html_handling: no .html, no /index
 *   - every hreflang alternate points at a URL the sitemap also lists
 *
 * Exits non-zero on any drift. Run with: node scripts/check-sitemap.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SITE = join(ROOT, 'public');

// Worker-owned paths (wrangler.jsonc -> assets.run_worker_first).
const WORKER_PREFIXES = ['/api/', '/s/', '/deals'];

// public/a/b.html -> /a/b , public/a/index.html -> /a/ , public/index.html -> /
function fileToUrl(rel) {
  const clean = rel.replace(/\\/g, '/').replace(/\.html$/, '');
  if (clean === 'index') return '/';
  if (clean.endsWith('/index')) return '/' + clean.slice(0, -'index'.length);
  return '/' + clean;
}

function isWorkerRoute(url) {
  return WORKER_PREFIXES.some((p) => url === p.slice(0, -1) || url === p.slice(0, -1) + '/' || url.startsWith(p));
}

const pages = [];
(function walk(dir, rel) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) walk(join(dir, e.name), r);
    else if (e.name.endsWith('.html')) pages.push(fileToUrl(r));
  }
})(SITE, '');

const xml = readFileSync(join(SITE, 'sitemap.xml'), 'utf8');
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const hreflangs = [...xml.matchAll(/hreflang="(?:zh|en)" href="([^"]+)"/g)].map((m) => new URL(m[1]).pathname);

const listed = new Set(locs);
const onDisk = new Set(pages);
const problems = [];

for (const p of pages) if (!listed.has(p)) problems.push(`page not in sitemap: ${p}`);
for (const u of new Set(locs)) {
  if (onDisk.has(u)) continue;
  if (isWorkerRoute(u)) continue;
  problems.push(`sitemap url has no page: ${u}`);
}
for (const u of [...locs, ...hreflangs]) {
  if (u.endsWith('.html')) problems.push(`non-canonical url (.html): ${u}`);
  else if (u === '/index' || u.endsWith('/index')) problems.push(`non-canonical url (/index): ${u}`);
}
for (const u of hreflangs) {
  if (!isWorkerRoute(u) && !onDisk.has(u)) problems.push(`hreflang target has no page: ${u}`);
  if (!listed.has(u)) problems.push(`hreflang target is not itself listed: ${u}`);
}

const dupes = locs.filter((u, i) => locs.indexOf(u) !== i);
for (const u of new Set(dupes)) problems.push(`duplicate <loc>: ${u}`);

console.log(`pages=${pages.length} sitemap=${locs.length} hreflang=${hreflangs.length}`);
if (problems.length) {
  for (const p of problems) console.error(`FAIL ${p}`);
  console.error(`\n${problems.length} problem(s). Fix sitemap.xml (or scripts/update-sitemap.mjs) before deploying.`);
  process.exit(1);
}
console.log('OK sitemap.xml matches public/ and is canonical');
