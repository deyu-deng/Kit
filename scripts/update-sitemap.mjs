/**
 * Refresh sitemap.xml:
 *   - clean URLs (drop .html / index.html — matches the assets layer's
 *     auto-trailing-slash html_handling)
 *   - real <lastmod> dates from each file's modification time
 * Also ensures robots.txt declares the sitemap.
 *
 * Run after content changes: node scripts/update-sitemap.mjs
 */
import { readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SITE = join(ROOT, 'public');

function urlToFile(pathname) {
  if (pathname === '/') return join(SITE, 'index.html');
  if (pathname.endsWith('/')) return join(SITE, pathname.slice(1), 'index.html');
  return join(SITE, pathname.slice(1) + '.html');
}

let sitemap = readFileSync(join(SITE, 'sitemap.xml'), 'utf8');

// Clean every absolute URL in <loc> and hreflang href attributes.
sitemap = sitemap.replace(/https:\/\/plobikit\.com\/(cn\/)?([^"<\s]*?)\.html/g, (m, cn, rest) => {
  if (rest === '' || rest === 'index') return `https://plobikit.com/${cn || ''}`;
  return `https://plobikit.com/${cn || ''}${rest}`;
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
