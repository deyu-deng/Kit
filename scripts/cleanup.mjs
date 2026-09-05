/**
 * One-shot hygiene pass over every HTML page (idempotent — safe to re-run):
 *
 *   1. remove the two fake ad units (placeholder data-ad-slot values
 *      "1234567890" / "5678901234") — the top banner with the real slot stays
 *   2. drop the "Managed legally under AdSense guidelines" footer phrase
 *      (EN + CN variants) — classic made-for-adsense signaling
 *   3. repair malformed guide markup: an orphan <h2 ...> opening tag
 *      immediately followed by another <h2 ...>, and bare "text</h2>" lines
 *   4. add <link rel="canonical"> where missing (clean URLs: /tools/cron)
 *
 * Run: node scripts/cleanup.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const DIRS = ['.', 'cn', 'tools', 'cn/tools', 'guides', 'cn/guides'].map((d) => join('public', d));
const H2_STYLE = 'style="font-size:20px;color:var(--text-main);margin:24px 0 12px;"';

function listHtmlFiles() {
  const files = [];
  for (const dir of DIRS) {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(join(ROOT, dir, entry.name));
      }
    }
  }
  return files;
}

function canonicalUrl(absPath) {
  const rel = relative(join(ROOT, 'public'), absPath).replace(/\\/g, '/');
  if (rel === 'index.html') return 'https://plobikit.com/';
  if (rel.endsWith('/index.html')) return `https://plobikit.com/${rel.slice(0, -'index.html'.length)}`;
  return `https://plobikit.com/${rel.replace(/\.html$/, '')}`;
}

function removeFakeAds(s, changes) {
  const before = s;
  // Step 1: drop any <ins> carrying a placeholder slot id. This also catches
  // units inside guide pages' i18n template literals (their language-switched
  // article bodies embed ad blocks too).
  s = s.replace(/<ins\s[^>]*data-ad-slot="(?:1234567890|5678901234)"[^>]*>\s*<\/ins>/g, '');
  // Step 2: remove ad containers left empty by step 1 (the top banner keeps
  // its real <ins>, so it never becomes empty).
  s = s.replace(/<div[^>]*class="ad-container[^"]*"[^>]*>\s*<\/div>\s*/g, '');
  if (s !== before) changes.push('removed fake ad units');
  return s;
}

function removeMfaFooter(s, changes) {
  const before = s;
  s = s.replace(/ ?Managed legally under AdSense guidelines\./g, '');
  s = s.replace(/ ?依据 AdSense 指南合规运营。/g, '');
  if (s !== before) changes.push('removed MFA footer phrase');
  return s;
}

function fixBrokenHeadings(s, changes) {
  const before = s;
  // Orphan <h2 ...> opening tag right before a real <h2 ...> — drop the orphan.
  while (/<h2[^>]*>\s*<h2[^>]*>/.test(s)) {
    s = s.replace(/<h2[^>]*>(\s*)<h2([^>]*)>/g, '<h2$2>');
  }
  // A line that is bare text + </h2> (the closing tag of the heading that
  // lost its opener): wrap it as a proper heading. Lines that already
  // contain an <h2 are left alone (those are legitimate).
  s = s
    .split('\n')
    .map((line) => {
      const m = line.match(/^(\s*)(\S[^<]*?)\s*<\/h2>(\r?)\s*$/);
      if (m && !line.includes('<h2') && m[2].length <= 100) {
        return `${m[1]}<h2 ${H2_STYLE}>${m[2]}</h2>${m[3]}`;
      }
      return line;
    })
    .join('\n');
  if (s !== before) changes.push('repaired broken h2 markup');
  return s;
}

function addCanonical(s, changes, absPath) {
  if (/<link\s+rel="canonical"/i.test(s)) return s;
  const canon = canonicalUrl(absPath);
  const patched = s.replace('</head>', `  <link rel="canonical" href="${canon}">\n</head>`);
  if (patched !== s) changes.push(`canonical → ${canon}`);
  return patched;
}

let totalChanged = 0;
for (const file of listHtmlFiles()) {
  const original = readFileSync(file, 'utf8');
  const changes = [];
  let out = original;
  out = removeFakeAds(out, changes);
  out = removeMfaFooter(out, changes);
  out = fixBrokenHeadings(out, changes);
  out = addCanonical(out, changes, file);
  if (out !== original) {
    writeFileSync(file, out, 'utf8');
    totalChanged++;
    console.log(`${relative(ROOT, file).replace(/\\/g, '/')}`);
    for (const c of changes) console.log(`    - ${c}`);
  }
}
console.log(`\n${totalChanged} file(s) updated.`);

// Post-run verification: anything left behind?
const leftovers = [];
for (const file of listHtmlFiles()) {
  const s = readFileSync(file, 'utf8');
  if (/1234567890|5678901234/.test(s)) leftovers.push(`${file}: fake ad slot still present`);
  if (/Managed legally under AdSense|依据 AdSense/.test(s)) leftovers.push(`${file}: MFA phrase still present`);
  if (/<h2[^>]*>\s*<h2[^>]*>/.test(s)) leftovers.push(`${file}: double <h2> still present`);
  if (!/<link\s+rel="canonical"/i.test(s)) leftovers.push(`${file}: canonical missing`);
}
if (leftovers.length) {
  console.log('\nLEFTOVERS (need manual attention):');
  for (const l of leftovers) console.log(`  ! ${l}`);
  process.exitCode = 1;
} else {
  console.log('Verification clean: no fake slots, no MFA phrases, no broken h2, all pages have canonicals.');
}
