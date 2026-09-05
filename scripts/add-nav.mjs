/**
 * Navigation wiring (idempotent, self-repairing — safe to re-run):
 * ensures Deals + Collection links exist in header nav (after nav-guides)
 * and footer nav (after nav-footer-guides) of every page, with correct
 * labels for the page language and a prefix that always reaches site root.
 *
 * Run: node scripts/add-nav.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const DIRS = ['.', 'cn', 'tools', 'cn/tools', 'guides', 'cn/guides', 'collection'].map((d) => join('public', d));

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

function wiringFor(file) {
  const rel = relative(join(ROOT, 'public'), file).replace(/\\/g, '/');
  const depth = rel.split('/').length - 1; // directories below site root
  const prefix = '../'.repeat(depth);
  const cn = /^cn\//.test(rel) || /<html lang="zh"/.test(readFileSync(file, 'utf8').slice(0, 200));
  return {
    dealsHref: prefix + 'deals',
    collHref: prefix + 'collection/index.html',
    dealsLabel: cn ? '优惠活动' : 'Deals',
    collLabel: cn ? '精选合集' : 'Collection',
  };
}

let changed = 0;
for (const file of listHtmlFiles()) {
  const rel = relative(join(ROOT, 'public'), file).replace(/\\/g, '/');
  const s = readFileSync(file, 'utf8');
  const { dealsHref, collHref, dealsLabel, collLabel } = wiringFor(file);
  const dealsAnchor = `<a href="${dealsHref}" id="nav-deals">${dealsLabel}</a>`;
  const collAnchor = `<a href="${collHref}" id="nav-collection">${collLabel}</a>`;
  const fDealsAnchor = `<a href="${dealsHref}" id="nav-footer-deals">${dealsLabel}</a>`;
  const fCollAnchor = `<a href="${collHref}" id="nav-footer-collection">${collLabel}</a>`;

  let out = s;
  let touched = false;

  // Fix or insert header links.
  const hDeals = out.match(/<a href="[^"]*" id="nav-deals">[^<]*<\/a>/);
  if (hDeals) {
    if (hDeals[0] !== dealsAnchor) { out = out.replace(hDeals[0], dealsAnchor); touched = true; }
  } else {
    const hGuides = out.match(/<a[^>]*id="nav-guides"[^>]*>[^<]*<\/a>/);
    if (!hGuides) { console.log(`skip (no nav-guides): ${relative(ROOT, file)}`); continue; }
    out = out.replace(hGuides[0], `${hGuides[0]}\n        ${dealsAnchor}\n        ${collAnchor}`);
    touched = true;
  }
  const hColl = out.match(/<a href="[^"]*" id="nav-collection">[^<]*<\/a>/);
  if (hColl) {
    if (hColl[0] !== collAnchor) { out = out.replace(hColl[0], collAnchor); touched = true; }
  }

  // Fix or insert footer links.
  const fDeals = out.match(/<a href="[^"]*" id="nav-footer-deals">[^<]*<\/a>/);
  if (fDeals) {
    if (fDeals[0] !== fDealsAnchor) { out = out.replace(fDeals[0], fDealsAnchor); touched = true; }
  } else {
    const fGuides = out.match(/<a[^>]*id="nav-footer-guides"[^>]*>[^<]*<\/a>/);
    if (fGuides) {
      out = out.replace(fGuides[0], `${fGuides[0]}\n        ${fDealsAnchor}\n        ${fCollAnchor}`);
      touched = true;
    }
  }
  const fColl = out.match(/<a href="[^"]*" id="nav-footer-collection">[^<]*<\/a>/);
  if (fColl) {
    if (fColl[0] !== fCollAnchor) { out = out.replace(fColl[0], fCollAnchor); touched = true; }
  }

  if (touched) {
    writeFileSync(file, out, 'utf8');
    changed++;
    console.log(`wired: ${rel}`);
  }
}
console.log(`\n${changed} file(s) updated.`);
