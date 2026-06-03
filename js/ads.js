/* ads.js - AdSense Script Lazy Loader & CLS Optimizer */

let adsLoaded = false;
const ADSENSE_PUB_ID = 'ca-pub-XXXXXXXXXXXXXXXX'; // Replace with real publisher ID

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
    
    // Inject AdSense tag
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`;
    document.body.appendChild(script);

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
}

/**
 * Triggers pushing ad configurations into the empty slots.
 * This should only be executed once the main JS file loads.
 */
/**
 * Triggers pushing ad configurations into the empty slots.
 * This should only be executed once the main JS file loads.
 */
function triggerPushAds() {
  try {
    // If window.adsbygoogle is not loaded, it means ads are blocked
    if (!window.adsbygoogle) {
      handleAdBlockNotice();
      return;
    }
    
    const slots = document.querySelectorAll('.adsbygoogle');
    slots.forEach(() => {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  } catch (err) {
    console.warn('AdSense push failed (probably blocked by ad-blocker):', err);
    handleAdBlockNotice();
  }
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

