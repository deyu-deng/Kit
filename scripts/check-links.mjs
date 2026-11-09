/**
 * Check every internal link and canonical declaration in public/.
 *
 * Fails on:
 *   - a dead internal link (nothing serves that URL, and it is not a worker
 *     route from wrangler.jsonc run_worker_first)
 *   - a non-canonical internal link — the .html and index.html forms answer
 *     307, so each one costs a visitor and a crawler an extra round trip
 *   - a page whose <link rel="canonical"> is not its own canonical URL
 *   - a translated page linking into the English tree for a page that has a
 *     translation (the language switcher is exempt: it is cross-language
 *     on purpose)
 *   - a module specifier inside an inline script that serves nothing
 *
 * URL rules live in scripts/lib/urls.mjs (shared with the build).
 *
 * Exits non-zero on any problem. Run with: node scripts/check-links.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildIndex, fileToUrl, walkHtml, resolveFrom, EXTERNAL,
  langFromUrl, urlForLang,
} from './lib/urls.mjs';

const SITE = join(process.cwd(), 'public');
const files = walkHtml(SITE);
const index = buildIndex(SITE);

const problems = [];

for (const rel of files) {
  const self = fileToUrl(rel);
  const lang = langFromUrl(self);
  const html = readFileSync(join(SITE, rel), 'utf8');

  // hrefs written inside the language switcher, which must stay cross-language
  const switcherHrefs = new Set();
  for (const anchor of html.matchAll(/<a\b[^>]*data-lang="[^"]*"[^>]*>/g)) {
    const href = anchor[0].match(/href="([^"]+)"/);
    if (href) switcherHrefs.add(href[1]);
  }

  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (EXTERNAL.test(raw)) continue;
    const target = resolveFrom(self, raw);
    const served = index.resolve(target);
    if (!served) problems.push(`${rel}: dead link -> ${raw}  (=> ${target})`);
    else if (served !== target) problems.push(`${rel}: non-canonical link -> ${raw}  (answers 307 for ${served})`);
    else if (lang !== 'en' && langFromUrl(served) === 'en' && !switcherHrefs.has(raw)) {
      const sibling = urlForLang(served, lang);
      if (index.resolve(sibling)) problems.push(`${rel}: cross-language link -> ${raw}  (expected ${sibling})`);
    }
  }

  // module specifiers inside inline scripts are not markup, so the build
  // cannot rewrite them — but a wrong depth breaks the page just the same
  for (const block of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    for (const spec of block[1].matchAll(/(?:from\s*|import\s*(?:\(\s*)?)['"]([^'"]+)['"]/g)) {
      const s = spec[1];
      if (!s.startsWith('/') && !s.startsWith('.')) continue; // bare specifier = import map
      if (!index.resolve(resolveFrom(self, s))) problems.push(`${rel}: dead module import -> ${s}`);
    }
  }

  const canonical = (html.match(/rel="canonical" href="https?:\/\/[^/]+([^"]*)"/) || [])[1];
  if (canonical === undefined) problems.push(`${rel}: missing <link rel="canonical">`);
  else if (canonical !== self) problems.push(`${rel}: canonical is ${canonical} but this page is served at ${self}`);
}

console.log(`pages=${files.length} canonical-urls=${index.pages.size}`);
if (problems.length) {
  for (const p of problems) console.error(`FAIL ${p}`);
  console.error(`\n${problems.length} problem(s). Fix the source (generator or hand-written page), then npm run build.`);
  process.exit(1);
}
console.log('OK every internal link resolves canonically and every canonical matches its own URL');
