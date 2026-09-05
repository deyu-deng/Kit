/**
 * share.js — share-link front end for Plobi-kit tools.
 *
 * Usage (tool page, cn pages use ../../js/share.js):
 *   import { attachShare } from '../js/share.js';
 *   attachShare({
 *     tool: 'cron',                  // must exist in the Worker TOOLS whitelist
 *     title: () => '...',            // share title
 *     description: () => '...',      // optional
 *     state: () => ({ ... }),        // serializable tool state (<= 12KB)
 *     restore: (state) => {},        // apply a shared state to the tool
 *   });
 *
 * Behavior:
 *  - Injects a Share button into .tool-header.
 *  - POSTs the state to /api/share, copies the returned link to the clipboard.
 *  - If the page URL has ?share=<id>, fetches /api/share/<id> and restores.
 */

const IS_CN = location.pathname.includes('/cn/');

const T = IS_CN
  ? {
      share: '分享',
      loading: '生成中…',
      copied: '分享链接已复制',
      failed: '分享失败，请稍后再试',
      restored: '已载入分享的配置',
      restoreFailed: '分享链接无效或已过期',
    }
  : {
      share: 'Share',
      loading: 'Sharing…',
      copied: 'Share link copied to clipboard',
      failed: 'Could not create the share link, please retry',
      restored: 'Loaded the shared setup',
      restoreFailed: 'This share link is invalid or has expired',
    };

export function attachShare(cfg) {
  const start = () => setTimeout(() => init(cfg), 150);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}

function init(cfg) {
  const header = document.querySelector('.tool-header');
  if (!header) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn plobi-share-btn';
  btn.textContent = T.share;
  header.appendChild(btn);
  injectStyles();

  btn.addEventListener('click', async () => {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = T.loading;
    try {
      const payload = {
        tool: cfg.tool,
        lang: IS_CN ? 'cn' : 'en',
        title: (cfg.title ? cfg.title() : '') || document.title,
        description: cfg.description ? cfg.description() : '',
        state: cfg.state(),
      };
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || res.status);
      const link = new URL(data.url, location.origin).href;
      await copyText(link);
      toast(`${T.copied}: ${link}`, 6000);
    } catch {
      toast(T.failed);
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });

  // Restore shared state when arriving via /tools/x.html?share=<id>
  const sid = new URLSearchParams(location.search).get('share');
  if (!sid) return;
  history.replaceState(null, '', location.pathname);
  fetch(`/api/share/${encodeURIComponent(sid)}`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('http ' + r.status))))
    .then((data) => {
      if (!data.ok) throw new Error('bad payload');
      cfg.restore(data.share.state);
      toast(T.restored);
    })
    .catch(() => toast(T.restoreFailed));
}

function injectStyles() {
  if (document.getElementById('plobi-share-styles')) return;
  const style = document.createElement('style');
  style.id = 'plobi-share-styles';
  style.textContent = `
    .plobi-share-btn {
      margin-top: 14px;
      background: var(--success-color, #0070f3) !important;
      border-color: var(--success-color, #0070f3) !important;
      cursor: pointer;
      font-size: 13px;
      padding: 9px 18px;
    }
    .plobi-share-btn:hover:not(:disabled) {
      filter: brightness(0.92);
    }
    .plobi-share-btn:disabled { opacity: 0.6; cursor: wait; }
    #plobi-share-toast {
      position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%) translateY(20px);
      background: #111; color: #fff; font-size: 13px; font-family: inherit;
      padding: 10px 18px; border-radius: 8px; opacity: 0; pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease; z-index: 9999;
      max-width: min(90vw, 480px); word-break: break-all; box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    }
    #plobi-share-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  `;
  document.head.appendChild(style);
}

let toastTimer = null;

function toast(message, duration = 3200) {
  let el = document.getElementById('plobi-share-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'plobi-share-toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  // force reflow so the transition replays for repeated toasts
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // http:// or older browsers: fall back to a temporary textarea
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } finally {
      ta.remove();
    }
  }
}
