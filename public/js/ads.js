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
      adContainers.forEach(container => {
        // Clear skeleton before text and format like code comments
        container.innerHTML = `
          <div class="adblock-notice" style="padding: 20px; font-family: monospace; font-size: 11px; text-align: center; color: var(--text-muted); line-height: 1.5; width: 100%;">
            // Note: This site runs 100% locally and has zero tracking cookies.<br>
            // We show quiet ads to cover domain cost.<br>
            // Please whitelist us if we saved you time. Thanks! :)
          </div>
        `;
        // Remove skeleton class to avoid flashing double borders/backgrounds
        container.style.borderStyle = 'solid';
        container.style.borderColor = 'var(--border-color)';
      });
    }
  }, 6000);
}

/**
 * Appends a friendly developer comment to all ad placeholders when blocked.
 */
function handleAdBlockNotice() {
  const containers = document.querySelectorAll('.ad-container');
  containers.forEach(container => {
    // Hide default ADVERTISEMENT text by marking it as blocked
    container.classList.add('blocked');
    // Render a clean monospace code-like notice
    container.innerHTML = `
      <div style="font-family: monospace; font-size: 11px; padding: 20px; color: var(--text-muted); text-align: left; line-height: 1.6; width: 100%; white-space: pre-wrap; box-sizing: border-box; background: var(--bg-card); border-radius: var(--radius-sm); border: 1px dashed var(--border-color);">
// Note: This site runs 100% locally and has zero tracking cookies.
// We show quiet ads to cover domain cost.
// Please whitelist us if we saved you time. Thanks! :)
      </div>
    `;
    // Style adjustments for layout stability
    container.style.border = 'none';
  });
}

