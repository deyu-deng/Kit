/* ads.js - AdSense Script Lazy Loader & CLS Optimizer */

let adsLoaded = false;
const ADSENSE_PUB_ID = 'ca-pub-5108296372072915'; // Replace with real publisher ID

/**
 * Lazy loads the AdSense script upon first scroll, interaction, or after a timer.
 */
export function initAdSenseLazyLoad() {
  // Listen for user interaction
  const triggerEvents = ['scroll', 'click', 'keydown', 'mousemove', 'touchstart'];
  
  const loadScriptAndTrigger = () => {
    if (adsLoaded) return;
    adsLoaded = true;
    
    // Remove listeners
    triggerEvents.forEach(evt => window.removeEventListener(evt, loadScriptAndTrigger));
    
    // Inject AdSense tag if not already present in DOM
    let script = document.querySelector('script[src*="adsbygoogle.js"]');
    if (!script) {
      script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`;
      document.body.appendChild(script);
    }

    script.onload = () => {
      console.log('Google AdSense script loaded successfully.');
      triggerPushAds();
    };

    script.onerror = () => {
      console.warn('Google AdSense script failed to load (blocked by browser or network error).');
      handleAdBlockNotice();
    };
  };

  // Attach triggers
  triggerEvents.forEach(evt => window.addEventListener(evt, loadScriptAndTrigger, { passive: true }));

  // Fallback timer: load after 4 seconds if no user interaction has occurred
  setTimeout(loadScriptAndTrigger, 4000);

  // Check for AdBlock after 6 seconds from page load
  checkAdBlock();
}

/**
 * Triggers pushing ad configurations into the empty slots.
 */
function triggerPushAds() {
  try {
    const slots = document.querySelectorAll('.adsbygoogle');
    slots.forEach(() => {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  } catch (err) {
    console.warn('AdSense push failed (probably blocked by ad-blocker):', err);
  }
}

/**
 * Checks if AdSense was blocked and shows a friendly developer-oriented message.
 */
function checkAdBlock() {
  setTimeout(() => {
    const adsScriptLoaded = window.adsbygoogle && window.adsbygoogle.loaded;
    if (!adsScriptLoaded) {
      console.log('AdSense blocked by AdBlock. Showing friendly notice.');
      const adContainers = document.querySelectorAll('.ad-container');
      adContainers.forEach(renderAdFallback);
    }
  }, 6000);
}

/**
 * Unfilled or blocked slot: one quiet editorial line instead of a warning box.
 * The slot itself stays in place so layout and the AdSense placement contract
 * do not change; only the placeholder copy does.
 */
function renderAdFallback(container) {
  container.classList.add('blocked');
  container.innerHTML = `
    <div class="ad-fallback">
      <span class="ad-fallback-label">Note</span>
      <span>This site runs locally and sets no tracking cookies. The ad slot covers the domain; whitelisting is appreciated, not required.</span>
    </div>`;
  container.style.border = '';
  container.style.borderStyle = '';
  container.style.borderColor = '';
}

