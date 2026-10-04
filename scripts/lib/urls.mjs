/**
 * URL rules for the static site, shared by the build (normalize-nav) and the
 * checks (check-links, check-sitemap).
 *
 * The assets layer runs with html_handling = auto-trailing-slash, verified
 * against the live site:
 *
 *   public/index.html        ->  /
 *   public/a/b.html          ->  /a/b      (/a/b.html answers 307, /a/b/ answers 307)
 *   public/a/index.html      ->  /a/       (/a answers 307)
 *
 * So a canonical URL never carries .html or a trailing /index, and only a
 * directory index keeps its trailing slash. Any internal link written in a
 * non-canonical form costs the visitor and the crawler one redirect.
 */
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

// wrangler.jsonc -> assets.run_worker_first
export const WORKER_PREFIXES = ['/api/', '/s/', '/deals'];

export const EXTERNAL = /^(https?:|mailto:|tel:|data:|javascript:|\/\/|#|blob:)/i;

/** The repo mixes CRLF and LF; every writer normalizes so a build is byte-stable. */
export const toLf = (text) => text.replace(/\r\n/g, '\n');

export function walkHtml(siteDir, rel = '', out = []) {
  for (const e of readdirSync(join(siteDir, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) walkHtml(siteDir, r, out);
    else if (e.name.endsWith('.html')) out.push(r);
  }
  return out;
}

export function fileToUrl(rel) {
  const clean = rel.replace(/\.html$/, '');
  if (clean === 'index') return '/';
  if (clean.endsWith('/index')) return `/${clean.slice(0, -'index'.length)}`;
  return `/${clean}`;
}

export function isWorkerRoute(url) {
  return WORKER_PREFIXES.some((p) => url.startsWith(p));
}

/** Index the site: every page URL plus every non-HTML file that is served. */
export function buildIndex(siteDir) {
  const pages = new Set(walkHtml(siteDir).map(fileToUrl));
  return {
    pages,
    /** the canonical URL a request resolves to, or null when nothing serves it */
    resolve(target) {
      const canonical = canonicalize(target, pages);
      if (pages.has(canonical) || isWorkerRoute(canonical)) return canonical;
      const onDisk = join(siteDir, canonical.replace(/^\/+/, '').replace(/\/+$/, ''));
      return existsSync(onDisk) && statSync(onDisk).isFile() ? canonical : null;
    },
  };
}

/** requested URL -> the canonical URL that answers it */
export function canonicalize(target, pages) {
  let u = target.replace(/^\/+/, '');
  if (u === '' || u === 'index.html') return '/';
  if (u.endsWith('/index.html')) u = u.slice(0, -'index.html'.length);
  else if (u.endsWith('.html')) u = u.slice(0, -'.html'.length);
  if (u.endsWith('/')) return `/${u}`;
  return pages.has(`/${u}/`) ? `/${u}/` : `/${u}`;
}

/** href/src as written on a page -> the URL the browser will request */
export function resolveFrom(selfUrl, raw) {
  const base = selfUrl.endsWith('/') ? selfUrl : selfUrl.slice(0, selfUrl.lastIndexOf('/') + 1);
  return new URL(raw, 'https://plobikit.com' + base).pathname;
}
