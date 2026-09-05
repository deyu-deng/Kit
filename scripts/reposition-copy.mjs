/**
 * One-shot brand-copy repositioning (Stage: audience broadening).
 *
 * Principle (proposal.md 门口去身份化): brand-doorway copy (homepage,
 * about, guides hub, meta descriptions) sells the OUTCOME (fast, private,
 * in-browser) — never a fixed audience identity. Specific tool pages keep
 * speaking to their real users (cron → server admins is correct).
 *
 * Team sentences ("we are a team of developers and designers") are kept:
 * they describe the makers, not the audience.
 *
 * Run: node scripts/reposition-copy.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const P = (f) => join(ROOT, 'public', f);

/** file → [ [oldString, newString], ... ] (exact, single-occurrence) */
const TABLE = {
  'index.html': [
    [
      'A fast, clean, and minimal collection of online tools for developers and designers under the Plobi brand. Free Base64 encoder, CSS Glassmorphism generator, QR Code maker, Color Palette generator, and Regex tester.',
      'A fast, clean collection of free online tools that run entirely in your browser — nothing you paste ever leaves your device. Base64 encoder, QR code maker, color palettes, regex tester, cron editor, image compression, and more.',
    ],
    [
      'A secure, privacy-first, and ultra-fast suite of developer and designer tools including',
      'A secure, privacy-first, and ultra-fast suite of online tools including',
    ],
    [
      'Developer &amp; Designer Tools That <span style="color: var(--success-color);">Never See Your Data</span>',
      'Online Tools That <span style="color: var(--success-color);">Never See Your Data</span>',
    ],
    ['No account. No tracking. No backend.', 'No account. No tracking.'],
  ],

  'about.html': [
    [
      'created to streamline the day-to-day work of web developers, programmers, and digital designers under the Plobi brand.',
      'that streamlines everyday work in the browser — for developers, designers, students, and anyone who needs a tool that just works.',
    ],
    ['We believe developer tools should be simple', 'We believe online tools should be simple'],
    [
      'Plobi-kit was created as an open-source developer efficiency project to provide the global developer community with a single, unified, ad-supported toolbox that remains free forever.',
      'Plobi-kit started as an open-source project to give the web community a single, unified, ad-supported toolbox that remains free forever.',
    ],
    [
      'making Plobi-kit equally accessible to developers across the globe',
      'making Plobi-kit equally accessible to users across the globe',
    ],
    ['Plobi-kit currently offers 17 free developer and designer utility tools:', 'Plobi-kit currently offers 17 free online utility tools:'],
    ['based on developer feedback.', 'based on user feedback.'],
  ],

  'guides/index.html': [
    [
      'Explore high-value technical guides and AI integration tutorials for developers and designers under the Plobi brand.',
      'Explore practical guides on privacy, security, design, and AI workflows — how to get more out of free web infrastructure.',
    ],
    ['<title>Developer Guides & AI Workflows - Plobi-kit</title>', '<title>Practical Guides & AI Workflows - Plobi-kit</title>'],
    ['<h1 class="tool-title" id="guides-title">Developer Guides & Tutorials</h1>', '<h1 class="tool-title" id="guides-title">Practical Guides & Tutorials</h1>'],
    ["'guides-title': 'Developer Guides & Tutorials'", "'guides-title': 'Practical Guides & Tutorials'"],
    [
      'Learn how to maximize your developer productivity and leverage free web infrastructure.',
      'Practical guides on privacy, security, design, and getting more out of free web infrastructure.',
    ],
  ],

  'cn/index.html': [
    ['<title>Plobi-kit - 开发者与设计师免费在线工具箱</title>', '<title>Plobi-kit - 免费在线工具箱,隐私优先</title>'],
    [
      '一套<span style="color: var(--success-color);">永远看不到你数据</span>的开发者与设计师工具',
      '一套<span style="color: var(--success-color);">永远看不到你数据</span>的在线工具箱',
    ],
  ],

  'cn/about.html': [
    [
      '旨在简化网页开发者、程序员和数字设计师的日常工作。',
      '旨在为开发者、设计师、学生以及任何需要一个顺手工具的人,简化浏览器里的日常工作。',
    ],
  ],

  'cn/guides/index.html': [["'guides-title': '开发者技术教程与指南'", "'guides-title': '实用技术教程与指南'"]],

  // --- Honesty pass: "no backend" claims predate the share/contact backend ---
  'index.html': [
    ['No account. No tracking. No backend.', 'No account. No tracking.'],
    [
      'Open any tool and use it instantly. We have no database to store you, because there is no backend to log into.',
      'Open any tool and use it instantly. Nothing you type is stored — accounts are simply not part of how the tools work.',
    ],
    [
      'Our architecture has <strong>no backend, no database, and no API endpoint</strong> that could ever receive your input. Every tool is a static bundle served from a CDN, executing in your browser via JavaScript, Web Workers, and the HTML5 File API. There is nothing on our side to log, store, sell, or be breached for. That is not a feature we bolted on — it is the foundation the entire site is built on.',
      'Every tool processes your input <strong>entirely inside your browser</strong> — nothing you type is transmitted, logged, or profiled. The only server-side actions are the ones you explicitly trigger: creating a share link or sending a contact message, both described plainly in our <a href="privacy.html">privacy policy</a>. Local-first is not a feature we bolted on — it is the foundation the site is built on.',
    ],
  ],

  'about.html': [
    [
      'We keep the team deliberately small so that every tool carries the same guarantee: no backend, no data collection, no exceptions.',
      'We keep the team deliberately small so that every tool carries the same guarantee: your input stays on your device — no accounts, and no collection of anything you paste or compress. The only server actions are the ones you trigger yourself, like share links and the contact form.',
    ],
  ],

  'tools/base64.html': [
    ['The page has no backend at all." }', 'Nothing you type is ever stored on our side." }'],
    [
      'The page has no backend at all — which is also why it keeps working offline.',
      'Nothing you type is stored on our side — which is also why the tool keeps working offline.',
    ],
  ],

  'cn/index.html': [
    ['无需账号、没有追踪、没有后端。', '无需账号、没有追踪。'],
    [
      '打开任意工具即可立即使用。我们没有数据库来存你,因为根本没有可供登录的后端。',
      '打开任意工具即可立即使用。你输入的内容不会被存储——账号本就不是工具运作方式的一部分。',
    ],
    [
      '我们的架构<strong>没有后端、没有数据库、也没有任何可能接收你输入的 API 端点</strong>。每个工具都是从 CDN 分发的静态包,通过 JavaScript、Web Worker 与 HTML5 File API 在你的浏览器内执行。我们这一侧没有任何东西可被记录、存储、转卖或被攻破。这不是我们后来贴上去的功能,而是整个站点建立的根基。',
      '每个工具都在<strong>你的浏览器内</strong>完成全部处理——你输入的内容不会被传输、记录或建立画像。仅有的服务端动作是你主动触发的:生成分享链接或发送留言,这些在<a href="privacy.html">隐私政策</a>中有明确说明。本地优先不是一个后来贴上去的功能,而是整个站点建立的根基。',
    ],
  ],

  'cn/tools/base64.html': [
    ['这个页面根本没有后端。" }', '你输入的内容不会被存储。" }'],
    ['这个页面根本没有后端。', '你输入的内容不会被存储。'],
  ],

  'cn/guides/never-paste-secrets.html': [
    [
      '<li><strong>根本没有后端。</strong>没有服务器、没有数据库、没有可能接收你输入的任何 API 端点。本站是一个由 CDN 分发的静态包。</li>',
      '<li><strong>本地处理,不上传。</strong>本站每个工具的处理全部在你的浏览器内完成,你粘贴的内容不会被上传或记录。</li>',
    ],
  ],
};

let applied = 0;
let missed = [];
for (const [file, pairs] of Object.entries(TABLE)) {
  const path = P(file);
  let s = readFileSync(path, 'utf8');
  let fileChanged = false;
  for (const [oldStr, newStr] of pairs) {
    if (s.includes(newStr)) continue; // already applied
    if (!s.includes(oldStr)) {
      missed.push(`${file}: "${oldStr.slice(0, 50)}..."`);
      continue;
    }
    s = s.replace(oldStr, newStr);
    applied++;
    fileChanged = true;
  }
  if (fileChanged) writeFileSync(path, s, 'utf8');
}
console.log(`${applied} replacement(s) applied.`);
if (missed.length) {
  console.log('MISSED (source string not found):');
  for (const m of missed) console.log('  ! ' + m);
}
