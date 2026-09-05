/**
 * One-shot: replace the homepage tool grid with the portal layout
 * (section cards + featured tools). The full grid now lives at /tools/.
 * Run: node scripts/restructure-home.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const file = join(process.cwd(), 'public', 'index.html');
let s = readFileSync(file, 'utf8');

const START = '<div class="tools-grid" id="tools-grid">';
const END = '\n        </section>';
const start = s.indexOf(START);
if (start === -1) throw new Error('tools-grid not found (already portalized?)');
const endMarker = s.indexOf(END, start);
if (endMarker === -1) throw new Error('grid end marker not found');

const portal = `<!-- Explore Plobi-kit: section portal -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
            <a href="tools/index.html" style="text-decoration: none;">
              <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px; height: 100%;">
                <div style="font-size: 24px; margin-bottom: 10px;">🧰</div>
                <h3 style="font-size: 17px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Tools <span style="font-size: 12px; font-weight: 600; color: var(--success-color); background: rgba(0, 112, 243, 0.08); padding: 2px 8px; border-radius: 999px;">17</span></h3>
                <p style="font-size: 13px; color: var(--text-muted); line-height: 1.7;">Encoders, formatters, generators, and compressors — every tool runs 100% in your browser.</p>
                <p style="font-size: 13px; color: var(--success-color); font-weight: 600; margin-top: 12px;">Browse all tools &rarr;</p>
              </div>
            </a>
            <a href="cheatsheets/" style="text-decoration: none;">
              <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px; height: 100%;">
                <div style="font-size: 24px; margin-bottom: 10px;">📋</div>
                <h3 style="font-size: 17px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Cheat Sheets <span style="font-size: 12px; font-weight: 600; color: var(--success-color); background: rgba(0, 112, 243, 0.08); padding: 2px 8px; border-radius: 999px;">8</span></h3>
                <p style="font-size: 13px; color: var(--text-muted); line-height: 1.7;">Cron, Git, regex, Markdown, HTTP codes — quick reference tables that pair with the tools.</p>
                <p style="font-size: 13px; color: var(--success-color); font-weight: 600; margin-top: 12px;">Look things up &rarr;</p>
              </div>
            </a>
            <a href="guides/index.html" style="text-decoration: none;">
              <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px; height: 100%;">
                <div style="font-size: 24px; margin-bottom: 10px;">📚</div>
                <h3 style="font-size: 17px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Guides</h3>
                <p style="font-size: 13px; color: var(--text-muted); line-height: 1.7;">Practical deep-dives on privacy, security, design, and getting more from free infrastructure.</p>
                <p style="font-size: 13px; color: var(--success-color); font-weight: 600; margin-top: 12px;">Read &rarr;</p>
              </div>
            </a>
            <a href="deals" style="text-decoration: none;">
              <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px; height: 100%;">
                <div style="font-size: 24px; margin-bottom: 10px;">🎁</div>
                <h3 style="font-size: 17px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Deals <span style="font-size: 12px; font-weight: 600; color: var(--success-color); background: rgba(0, 112, 243, 0.08); padding: 2px 8px; border-radius: 999px;">auto-updated</span></h3>
                <p style="font-size: 13px; color: var(--text-muted); line-height: 1.7;">Free game giveaways and software promotions, pulled from official APIs daily. Zero dead links.</p>
                <p style="font-size: 13px; color: var(--success-color); font-weight: 600; margin-top: 12px;">Claim freebies &rarr;</p>
              </div>
            </a>
            <a href="collection/index.html" style="text-decoration: none;">
              <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px; height: 100%;">
                <div style="font-size: 24px; margin-bottom: 10px;">⭐</div>
                <h3 style="font-size: 17px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Collection</h3>
                <p style="font-size: 13px; color: var(--text-muted); line-height: 1.7;">A hand-picked directory of genuinely useful websites, each with an honest review.</p>
                <p style="font-size: 13px; color: var(--success-color); font-weight: 600; margin-top: 12px;">Browse the shortlist &rarr;</p>
              </div>
            </a>
          </div>

          <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin: 40px 0 16px 0; letter-spacing: -0.4px;">Popular tools</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <a href="tools/base64.html" style="text-decoration: none; font-size: 14px; color: var(--text-main); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 999px; padding: 8px 16px;">⚡ Base64</a>
            <a href="tools/qrcode.html" style="text-decoration: none; font-size: 14px; color: var(--text-main); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 999px; padding: 8px 16px;">📱 QR Code</a>
            <a href="tools/json.html" style="text-decoration: none; font-size: 14px; color: var(--text-main); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 999px; padding: 8px 16px;">🔤 JSON</a>
            <a href="tools/cron.html" style="text-decoration: none; font-size: 14px; color: var(--text-main); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 999px; padding: 8px 16px;">⏰ Cron</a>
            <a href="tools/regex.html" style="text-decoration: none; font-size: 14px; color: var(--text-main); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 999px; padding: 8px 16px;">🔍 Regex</a>
            <a href="tools/colorpalette.html" style="text-decoration: none; font-size: 14px; color: var(--text-main); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 999px; padding: 8px 16px;">🎨 Color Palette</a>
            <a href="tools/image.html" style="text-decoration: none; font-size: 14px; color: var(--text-main); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 999px; padding: 8px 16px;">🖼️ Image Compressor</a>
            <a href="tools/jwt.html" style="text-decoration: none; font-size: 14px; color: var(--text-main); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 999px; padding: 8px 16px;">🔑 JWT</a>
          </div>
        </section>`;

s = s.slice(0, start) + portal + s.slice(endMarker + END.length);
writeFileSync(file, s, 'utf8');
console.log('homepage portalized: grid replaced with section cards + featured tools.');
