/* ads.js — AdSense slot bootstrap (and an honest empty-slot fallback). */

const ADSENSE_PUB_ID = 'ca-pub-5108296372072915';

/**
 * Register each <ins> exactly once.
 *
 * Google's standard integration queues slot registrations on
 * window.adsbygoogle. Before adsbygoogle.js runs it is a plain array, so a
 * push simply queues the work; after the library loads, push processes the
 * slot immediately. Either way there is no reason to wait for an onload event.
 *
 * The old version bound `script.onload` to the <script> that already existed
 * in <head>. An async script that has finished loading never fires onload
 * again, so triggerPushAds() usually never ran and the slot stayed empty.
 * Its onerror handler also called a function that did not exist.
 */
function pushSlots() {
  try {
    const queue = (window.adsbygoogle = window.adsbygoogle || []);
    document.querySelectorAll('ins.adsbygoogle').forEach((el) => {
      if (el.dataset.plobiQueued === '1') return;
      if (el.hasAttribute('data-adsbygoogle-status') || el.hasAttribute('data-ad-status')) return;
      el.dataset.plobiQueued = '1';
      queue.push({});
    });
  } catch (err) {
    console.warn('AdSense slot registration failed:', err);
  }
}

/** Only pages that actually carry a slot do any of this work. */
export function initAdSlots() {
  if (!document.querySelector('ins.adsbygoogle')) return;

  // Every ad-bearing page ships <script async ...adsbygoogle.js> in <head>.
  // If a template ever drops it, load it here rather than leaving an empty
  // ADVERTISEMENT box on the page forever.
  if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`;
    document.head.appendChild(script);
  }

  pushSlots();
  checkUnfilledSlots();
}

/**
 * If the library never touched the slot (blocked, offline, script error),
 * replace the empty box with one quiet editorial line instead of a warning.
 * The container keeps its height so layout and the placement contract do not
 * change. A slot Google has already claimed is left strictly alone.
 */
function checkUnfilledSlots() {
  setTimeout(() => {
    document.querySelectorAll('.ad-container').forEach((container) => {
      const slot = container.querySelector('ins.adsbygoogle');
      if (!slot) return;
      if (slot.hasAttribute('data-adsbygoogle-status') || slot.hasAttribute('data-ad-status')) return;
      if (container.querySelector('.ad-fallback')) return;
      renderAdFallback(container);
    });
  }, 6000);
}

const FALLBACK = {
  en: {
    label: 'Note',
    text: 'This ad slot is empty — every tool on this site still works. Tools run locally in your browser, but ads are served by Google and may use cookies. See our ',
    link: 'Privacy Policy',
    href: '/privacy#cookies',
  },
  zh: {
    label: '说明',
    text: '这个广告位没有加载，不影响本页工具使用。工具确实完全在浏览器本地运行，但广告由 Google 提供，可能使用 Cookie。详见',
    link: '隐私政策',
    href: '/cn/privacy#cookies',
  },
};

/**
 * Truthful copy. The tools really do run locally, but that says nothing about
 * advertising: this page loads AdSense, and Google / its vendors may set
 * cookies. An earlier version falsely claimed the site had no advertising cookies.
 */
function renderAdFallback(container) {
  const lang = document.documentElement.lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  const c = FALLBACK[lang];
  container.classList.add('blocked');
  container.innerHTML = `
    <div class="ad-fallback">
      <span class="ad-fallback-label">${c.label}</span>
      <span>${c.text}<a href="${c.href}">${c.link}</a>${lang === 'zh' ? '。' : '.'}</span>
    </div>`;
  container.style.border = '';
  container.style.borderStyle = '';
  container.style.borderColor = '';
}

// A visitor offline with a v3-cached app.js still imports the old name.
// Keeping the alias avoids a module-resolution failure that would take every
// tool on the page down with it.
export const initAdSenseLazyLoad = initAdSlots;
