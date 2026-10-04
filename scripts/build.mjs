/**
 * The whole static build, in the one order that is correct.
 *
 *   1. generators   write the pages they own (content data -> HTML)
 *   2. cleanup      hygiene pass over every page (ad slots, markup, canonicals)
 *   3. normalize-nav  the chrome contract: nav/footer/logo/assets/i18n boot
 *   4. update-sitemap lastmod refresh + robots declaration
 *
 * Order matters: the chrome contract must run after the generators, because a
 * generator template is free to emit stale chrome and normalize-nav fixes every
 * page afterwards. Anything that rewrites HTML in stage 1 or 2 therefore has to
 * be followed by stage 3 — that is exactly how the 52 recipe pages lost their
 * i18n boot script in the first place.
 *
 * Hand-written pages (home, about/contact/privacy/terms + their /cn/ twins, the
 * two cheat-sheet hubs, collection/) are source, not build output: the
 * generators never write them, and normalize-nav only re-chromes them.
 *
 * Run: node scripts/build.mjs          (or: npm run build)
 */
import { execFileSync } from 'node:child_process';

const STAGES = [
  ['gen-cheatsheets', 'Cheat-sheet pages'],
  ['gen-recipes', 'Recipe pages (cron + git clusters)'],
  ['gen-guides', 'Library articles, EN + CN'],
  ['gen-tool-hub', 'Tools hubs, EN + CN'],
  ['cleanup', 'Hygiene + canonicals'],
  ['normalize-nav', 'Chrome contract over every page'],
  ['update-sitemap', 'Sitemap lastmod + robots'],
];

for (const [name, what] of STAGES) {
  process.stdout.write(`build: ${name} — ${what}\n`);
  execFileSync(process.execPath, [`scripts/${name}.mjs`], { stdio: 'inherit', cwd: process.cwd() });
}
console.log('\nbuild: done.');
