/**
 * gen-tool-hub.mjs — generates /tools/index.html and /cn/tools/index.html
 * from a shared template + the i18n-content.js dictionary. Single source of
 * truth: change the dictionary and rerun.
 *
 * Run: node scripts/gen-tool-hub.mjs
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const TOOLS = [
  { key: 'base64',       slug: 'base64.html' },
  { key: 'json',         slug: 'json.html' },
  { key: 'jwt',          slug: 'jwt.html' },
  { key: 'url',          slug: 'url.html' },
  { key: 'markdown',     slug: 'markdown.html' },
  { key: 'regex',        slug: 'regex.html' },
  { key: 'cron',         slug: 'cron.html' },
  { key: 'git',          slug: 'git.html' },
  { key: 'colorpalette', slug: 'colorpalette.html' },
  { key: 'glassmorphism',slug: 'glassmorphism.html' },
  { key: 'flexgrid',     slug: 'flexgrid.html' },
  { key: 'svg',          slug: 'svg.html' },
  { key: 'metatags',     slug: 'metatags.html' },
  { key: 'codeimage',    slug: 'codeimage.html' },
  { key: 'image',        slug: 'image.html' },
  { key: 'qrcode',       slug: 'qrcode.html' },
  { key: 'prompt',       slug: 'prompt.html' },
];

const SECTIONS = [
  { key: 'text',   labelKey: 'tools.section.text',   tools: ['base64','json','jwt','url','markdown','regex','cron','git'] },
  { key: 'design', labelKey: 'tools.section.design', tools: ['colorpalette','glassmorphism','flexgrid','svg','metatags','codeimage'] },
  { key: 'media',  labelKey: 'tools.section.media',  tools: ['image','qrcode','prompt'] },
];

const TITLES = {
  base64:       { en: 'Free Online Tools — All 17, Privacy-First | Plobi-kit', cn: '全部工具 - 17 款免费在线工具,隐私优先 | Plobi-kit' },
  tools:        { en: 'https://plobikit.com/tools/', cn: 'https://plobikit.com/cn/tools/' },
};
const DESCS = {
  tools: {
    en: 'The complete Plobi-kit toolbox: 17 free online tools that run entirely in your browser — encoders, formatters, generators, and converters for text, data, design, and images. No sign-up, no uploads.',
    cn: 'Plobi-kit 完整工具箱:17 款完全在浏览器内运行的免费在线工具——编解码、格式化、生成器与压缩器,覆盖文本、数据、设计与图像。无需注册,上传零次。',
  },
};
const NAV = {
  en: ['Tools','Cheat Sheets','Guides','Deals','Collection','About'],
  cn: ['工具箱','速查表','技术教程','优惠活动','精选合集','关于我们'],
};
const NAV_PATH = {
  en: { tools: 'index.html', cheatsheets: '../cheatsheets/', guides: '../guides/index.html', deals: '../deals', collection: '../collection/index.html', about: '../about.html' },
  cn: { tools: 'index.html', cheatsheets: '../../cheatsheets/', guides: '../guides/index.html', deals: '../../deals', collection: '../../collection/index.html', about: '../about.html' },
};
const ICONS = {
  base64:       '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
  json:         '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
  jwt:          '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
  url:          '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  markdown:     '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
  regex:        '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  cron:         '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  git:          '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  colorpalette: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
  glassmorphism:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  flexgrid:     '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  svg:          '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
  metatags:     '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  codeimage:    '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  image:        '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  qrcode:       '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  prompt:       '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
};

const head = (lang) => {
  const hreflangEn = lang === 'en' ? '' : `  <link rel="alternate" hreflang="en" href="https://plobikit.com/tools/">\n  `;
  const hreflangCn = lang === 'cn' ? `  <link rel="alternate" hreflang="zh" href="https://plobikit.com/cn/tools/">\n  ` : '';
  const isCN = lang === 'cn';
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${TITLES.base64[lang]}</title>
<meta name="description" content="${DESCS.tools[lang]}">
<link rel="stylesheet" href="${isCN ? '../' : ''}styles.css">
<link rel="manifest" href="${isCN ? '../' : ''}manifest.json">
<meta name="theme-color" content="#fafafa">
<link rel="canonical" href="${TITLES.tools[lang]}">
${hreflangEn}${hreflangCn}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5108296372072915" crossorigin="anonymous"></script>
<style>.tool-card-icon svg { width: 22px; height: 22px; color: var(--success-color); }</style>`;
};

const navBlock = (lang) => {
  const np = NAV_PATH[lang];
  const labels = NAV[lang];
  return `<header class="app-header">
      <div class="logo">
        <a href="${lang === 'cn' ? '../' : ''}index.html" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">
          <span class="logo-icon" style="background:var(--success-color);">P</span>
          <span id="txt-logo-name">Plobi-kit</span>
        </a>
      </div>
      <nav class="nav-links">
        <a href="${np.tools}" class="active" id="nav-tools">${labels[0]}</a>
        <a href="${np.cheatsheets}" id="nav-cheatsheets">${labels[1]}</a>
        <a href="${np.guides}" id="nav-guides">${labels[2]}</a>
        <a href="${np.deals}" id="nav-deals">${labels[3]}</a>
        <a href="${np.collection}" id="nav-collection">${labels[4]}</a>
        <a href="${np.about}" id="nav-about">${labels[5]}</a>
      </nav>
      <div class="controls">
        <button class="lang-btn" id="lang-btn">${lang === 'cn' ? 'EN' : 'CN'}</button>
      </div>
    </header>`;
};

const footerBlock = (lang) => `<footer class="app-footer">
      <div class="footer-nav">
        <a href="${lang === 'cn' ? '../' : ''}privacy.html" id="nav-footer-privacy">${lang === 'cn' ? '隐私政策' : 'Privacy Policy'}</a>
        <a href="${lang === 'cn' ? '../' : ''}terms.html" id="nav-footer-terms">${lang === 'cn' ? '服务条款' : 'Terms'}</a>
        <a href="${lang === 'cn' ? '../' : ''}about.html" id="nav-footer-about">${lang === 'cn' ? '关于我们' : 'About'}</a>
        <a href="${lang === 'cn' ? '../' : ''}contact.html" id="nav-footer-contact">${lang === 'cn' ? '联系我们' : 'Contact'}</a>
      </div>
      <div class="copyright" id="nav-footer-copy">
        &copy; 2026 Plobi. ${lang === 'cn' ? '保留所有权利。' : 'All rights reserved.'}
      </div>
    </footer>`;

const section = (lang, s) => `
      <h2 data-i18n="tools.section.${s.key}" style="font-size: 20px; color: var(--text-main); margin: 28px 0 14px 0;">${s.labelKey}</h2>
      <div class="tools-grid" style="margin-bottom: 8px;">
${s.tools.map((key) => {
          const tool = TOOLS.find((t) => t.key === key);
          return `        <a href="${tool.slug}" class="tool-card">
          <div class="tool-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[key]}</svg></div>
          <h3 class="tool-card-title" data-i18n="tool.${key}.title">${key}</h3>
          <p class="tool-card-desc" data-i18n="tool.${key}.desc"></p>
        </a>`;
        }).join('\n')}
      </div>`;

const build = (lang) => `<!DOCTYPE html>
<html lang="${lang === 'cn' ? 'zh' : 'en'}">
<head>
  <meta name="google-adsense-account" content="ca-pub-5108296372072915">
  ${head(lang)}
</head>
<body>

  <div class="app-container">
    ${navBlock(lang)}

    <main style="max-width: 900px; margin: 0 auto; margin-bottom: 40px;">
      <h1 data-i18n="tools.h1" style="font-size: 28px; margin-bottom: 12px; letter-spacing: -0.5px; color: var(--text-main);">${lang === 'cn' ? '全部工具' : 'All Tools'}</h1>
      <p data-i18n="tools.intro" style="font-size: 15px; color: var(--text-muted); line-height: 1.8; margin-bottom: 32px;">${lang === 'cn' ? 'Plobi-kit 完整工具箱...' : 'Every Plobi-kit tool in one place. All of them run 100% inside your browser — whatever you paste, compress, or generate never touches a server. No account, no queue, no watermark.'}</p>

${SECTIONS.map((s) => section(lang, s)).join('\n')}

      <div style="font-size: 13px; color: var(--text-muted); background: var(--accent-light); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px 20px; line-height: 1.8; margin-top: 28px;">
        <span data-i18n="tools.cta.cheatsheets">${lang === 'cn' ? '想查资料而不是转换?看看<a href="../../cheatsheets/">速查表</a>。' : 'Looking things up instead of converting? Check the Cheat Sheets — quick reference tables for cron, Git, regex, and more.'}</span>
      </div>
    </main>

    ${footerBlock(lang)}
  </div>

  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('Service Worker registered successfully.', reg))
          .catch(err => console.log('Service Worker registration failed.', err));
      });
    }
  </script>
  <script type="module">
    import { applyTranslations, currentLang } from './js/i18n-content.js';
    document.addEventListener('DOMContentLoaded', () => applyTranslations(currentLang()));
    import('./app.js');
  </script>
</body>
</html>`;

writeFileSync(join(process.cwd(), 'public', 'tools', 'index.html'), build('en'), 'utf8');
writeFileSync(join(process.cwd(), 'public', 'cn', 'tools', 'index.html'), build('cn'), 'utf8');
console.log('generated: tools/index.html + cn/tools/index.html');