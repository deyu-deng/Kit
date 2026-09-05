/**
 * shareTools.js — central registry wiring every tool page to the share backend.
 *
 * app.js calls initShareTools() once; the current tool is detected from the
 * visible .tool-panel id, so no per-page HTML edits are needed. Tools whose
 * state is a local file (image compressor) or a pure random roll (color
 * palette) have nothing meaningful to restore and are intentionally absent.
 */

import { attachShare } from './share.js';

function currentTool() {
  const panel = document.querySelector('.tool-panel');
  return panel ? panel.id.replace('panel-', '') : null;
}

function readField(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function setField(id, value) {
  const el = document.getElementById(id);
  if (!el || value === undefined || value === null) return;
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function setChecked(id, value) {
  const el = document.getElementById(id);
  if (!el || value === undefined) return;
  el.checked = !!value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function clickBtn(id) {
  const el = document.getElementById(id);
  if (el) el.click();
}

function snip(text, max = 80) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function lang() {
  return document.documentElement.lang === 'zh' ? 'cn' : 'en';
}

const CONFIGS = {
  base64: {
    title: () => snip(readField('b64-input'), 60),
    state: () => ({
      input: readField('b64-input'),
      // base64.js marks the inactive mode with .btn-secondary
      mode: document.getElementById('b64-mode-encode').classList.contains('btn-secondary') ? 'decode' : 'encode',
    }),
    restore: (s) => {
      clickBtn(s.mode === 'decode' ? 'b64-mode-decode' : 'b64-mode-encode');
      setField('b64-input', s.input);
    },
  },

  glassmorphism: {
    title: () => `Glass ${readField('glass-opacity')}% / blur ${readField('glass-blur')}px`,
    state: () => ({
      opacity: readField('glass-opacity'),
      blur: readField('glass-blur'),
      radius: readField('glass-radius'),
      border: readField('glass-border'),
      color: readField('glass-color'),
    }),
    restore: (s) => {
      setField('glass-opacity', s.opacity);
      setField('glass-blur', s.blur);
      setField('glass-radius', s.radius);
      setField('glass-border', s.border);
      setField('glass-color', s.color);
    },
  },

  qrcode: {
    title: () => snip(readField('qr-input'), 60),
    state: () => ({ input: readField('qr-input') }),
    restore: (s) => setField('qr-input', s.input),
  },

  regex: {
    title: () => snip(readField('regex-pattern'), 60) || 'Regex pattern',
    description: () => snip(readField('regex-text'), 160),
    state: () => ({
      pattern: readField('regex-pattern'),
      flags: readField('regex-flags'),
      text: readField('regex-text'),
    }),
    restore: (s) => {
      setField('regex-pattern', s.pattern);
      setField('regex-flags', s.flags);
      setField('regex-text', s.text);
    },
  },

  git: {
    title: () => snip(readField('git-output-code'), 80) || 'Git command',
    state: () => ({
      category: readField('git-action-category'),
      output: readField('git-output-code'),
    }),
    restore: (s) => {
      const cat = document.getElementById('git-action-category');
      if (!cat || !s.category) return;
      cat.value = s.category;
      cat.dispatchEvent(new Event('change', { bubbles: true }));
    },
  },

  cron: {
    title: () => readField('cron-output-expression') || 'Cron expression',
    description: () => snip((document.getElementById('cron-readable-translation')?.textContent || '').trim(), 160),
    state: () => ({ expression: readField('cron-output-expression') }),
    restore: (s) => {
      const parts = String(s?.expression || '').split(/\s+/).filter(Boolean);
      if (parts.length < 5) return;
      ['cron-min', 'cron-hour', 'cron-day', 'cron-month', 'cron-week'].forEach((id, i) => {
        setField(id, parts[i]);
      });
    },
  },

  json: {
    title: () => 'Shared JSON snippet',
    description: () => snip(readField('json-input'), 160),
    state: () => ({ input: readField('json-input') }),
    restore: (s) => setField('json-input', s.input),
  },

  jwt: {
    title: () => 'Shared JWT token',
    description: () => snip(readField('jwt-input'), 120),
    state: () => ({ input: readField('jwt-input') }),
    restore: (s) => setField('jwt-input', s.input),
  },

  url: {
    title: () => snip(readField('url-input'), 60),
    state: () => ({ input: readField('url-input') }),
    restore: (s) => setField('url-input', s.input),
  },

  markdown: {
    title: () => snip(readField('md-input'), 60) || 'Shared markdown',
    state: () => ({ input: readField('md-input') }),
    restore: (s) => setField('md-input', s.input),
  },

  flexgrid: {
    title: () => `${readField('fg-display')} · ${readField('fg-cols')} cols / ${readField('fg-gap')}px gap`,
    state: () => ({
      display: readField('fg-display'),
      direction: readField('fg-direction'),
      justify: readField('fg-justify'),
      align: readField('fg-align'),
      cols: readField('fg-cols'),
      gap: readField('fg-gap'),
    }),
    restore: (s) => {
      setField('fg-display', s.display);
      setField('fg-direction', s.direction);
      setField('fg-justify', s.justify);
      setField('fg-align', s.align);
      setField('fg-cols', s.cols);
      setField('fg-gap', s.gap);
    },
  },

  svg: {
    title: () => 'Shared SVG snippet',
    description: () => snip(readField('svg-input'), 160),
    state: () => ({
      input: readField('svg-input'),
      opts: ['svg-opt-attrs', 'svg-opt-metadata', 'svg-opt-viewbox', 'svg-opt-fills', 'svg-opt-minify']
        .map((id) => (document.getElementById(id) ? document.getElementById(id).checked : undefined)),
    }),
    restore: (s) => {
      setField('svg-input', s.input);
      ['svg-opt-attrs', 'svg-opt-metadata', 'svg-opt-viewbox', 'svg-opt-fills', 'svg-opt-minify'].forEach((id, i) => {
        setChecked(id, s.opts ? s.opts[i] : undefined);
      });
      clickBtn('svg-optimize-btn');
    },
  },

  metatags: {
    title: () => snip(readField('meta-title'), 70) || 'Shared meta tags',
    state: () => ({
      title: readField('meta-title'),
      desc: readField('meta-desc'),
      url: readField('meta-url'),
      image: readField('meta-image'),
      robots: readField('meta-robots'),
      type: readField('meta-type'),
    }),
    restore: (s) => {
      setField('meta-title', s.title);
      setField('meta-desc', s.desc);
      setField('meta-url', s.url);
      setField('meta-image', s.image);
      setField('meta-robots', s.robots);
      setField('meta-type', s.type);
    },
  },

  prompt: {
    title: () => snip(readField('prompt-output'), 80) || 'Shared prompt',
    state: () => ({
      role: readField('prompt-role-select'),
      fields: Array.from(
        document.querySelectorAll('#prompt-dynamic-inputs input, #prompt-dynamic-inputs select, #prompt-dynamic-inputs textarea')
      )
        .map((el) => ({ key: el.id || el.name || '', value: el.value }))
        .filter((f) => f.key && f.value),
    }),
    restore: (s) => {
      const sel = document.getElementById('prompt-role-select');
      const needRole = sel && s.role && sel.value !== s.role;
      if (needRole) {
        sel.value = s.role;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      setTimeout(() => {
        (s.fields || []).forEach((f) => {
          const el = document.getElementById(f.key) || document.querySelector(`#prompt-dynamic-inputs [name="${f.key}"]`);
          if (el) {
            el.value = f.value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }, needRole ? 250 : 0);
    },
  },

  codeimage: {
    title: () => snip(readField('code-title-input'), 60) || 'Shared code screenshot',
    description: () => snip(readField('code-input'), 160),
    state: () => ({
      code: readField('code-input'),
      title: readField('code-title-input'),
      theme: readField('code-theme-select'),
      padding: readField('code-padding-select'),
      language: readField('code-lang-select'),
    }),
    restore: (s) => {
      setField('code-theme-select', s.theme);
      setField('code-padding-select', s.padding);
      setField('code-lang-select', s.language);
      setField('code-title-input', s.title);
      setField('code-input', s.code);
    },
  },
};

export function initShareTools() {
  const tool = currentTool();
  const cfg = tool && CONFIGS[tool];
  // share.js reads cfg.tool for the API whitelist — inject the detected name
  if (cfg) attachShare({ tool, ...cfg });
}
