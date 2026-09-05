/* metatagsGenerator.js - SEO Meta Tags Generator and Preview Simulator */

export function initMetatagsGeneratorTool() {
  // Inputs
  const elTitle = document.getElementById('meta-title');
  const elDesc = document.getElementById('meta-desc');
  const elUrl = document.getElementById('meta-url');
  const elImage = document.getElementById('meta-image');
  const elRobots = document.getElementById('meta-robots');
  const elType = document.getElementById('meta-type');

  // Outputs & Previews
  const txtOutput = document.getElementById('meta-output');
  const btnCopy = document.getElementById('meta-copy-btn');
  const btnClear = document.getElementById('meta-clear-btn');
  const elAlert = document.getElementById('meta-alert');

  // Google Preview
  const googleTitle = document.getElementById('google-title');
  const googleUrl = document.getElementById('google-url');
  const googleDesc = document.getElementById('google-desc');

  // Facebook Preview
  const fbImage = document.getElementById('fb-image');
  const fbUrl = document.getElementById('fb-url');
  const fbTitle = document.getElementById('fb-title');
  const fbDesc = document.getElementById('fb-desc');

  // Twitter Preview
  const twImage = document.getElementById('tw-image');
  const twUrl = document.getElementById('tw-url');
  const twTitle = document.getElementById('tw-title');
  const twDesc = document.getElementById('tw-desc');

  if (!elTitle || !txtOutput) return;

  function updateMetaTags() {
    const titleVal = elTitle.value.trim() || 'Plobi-kit Tool Title';
    const descVal = elDesc.value.trim() || 'This is a description of the webpage that search engines and social platforms will read.';
    const urlVal = elUrl.value.trim() || 'https://plobikit.com';
    const imgVal = elImage.value.trim() || 'https://plobikit.com/icon-512.png';
    const robotsVal = elRobots.value;
    const typeVal = elType.value;

    // Build Hostname for small card previews
    let hostname = 'plobikit.com';
    try {
      hostname = new URL(urlVal).hostname;
    } catch (e) {
      hostname = urlVal;
    }

    // 1. Update Previews
    if (googleTitle) googleTitle.textContent = titleVal;
    if (googleUrl) googleUrl.textContent = urlVal;
    if (googleDesc) {
      googleDesc.textContent = descVal.length > 155 ? descVal.substring(0, 152) + '...' : descVal;
    }

    if (fbImage) {
      fbImage.style.backgroundImage = `url('${imgVal}')`;
    }
    if (fbUrl) fbUrl.textContent = hostname.toUpperCase();
    if (fbTitle) fbTitle.textContent = titleVal;
    if (fbDesc) {
      fbDesc.textContent = descVal.length > 95 ? descVal.substring(0, 92) + '...' : descVal;
    }

    if (twImage) {
      twImage.style.backgroundImage = `url('${imgVal}')`;
    }
    if (twUrl) twUrl.textContent = hostname.toLowerCase();
    if (twTitle) twTitle.textContent = titleVal;
    if (twDesc) {
      twDesc.textContent = descVal.length > 120 ? descVal.substring(0, 117) + '...' : descVal;
    }

    // 2. Generate HTML Output
    const htmlCode = `<!-- Primary Meta Tags -->
<title>${titleVal}</title>
<meta name="title" content="${titleVal}">
<meta name="description" content="${descVal}">
<meta name="robots" content="${robotsVal}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="${typeVal}">
<meta property="og:url" content="${urlVal}">
<meta property="og:title" content="${titleVal}">
<meta property="og:description" content="${descVal}">
<meta property="og:image" content="${imgVal}">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${urlVal}">
<meta property="twitter:title" content="${titleVal}">
<meta property="twitter:description" content="${descVal}">
<meta property="twitter:image" content="${imgVal}">`;

    txtOutput.value = htmlCode;
  }

  // Bind input change listeners
  [elTitle, elDesc, elUrl, elImage, elRobots, elType].forEach(el => {
    if (el) {
      el.addEventListener('input', updateMetaTags);
      el.addEventListener('change', updateMetaTags);
    }
  });

  // Run once initially
  updateMetaTags();

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      elTitle.value = '';
      elDesc.value = '';
      elUrl.value = '';
      elImage.value = '';
      elRobots.value = 'index, follow';
      elType.value = 'website';
      updateMetaTags();
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      if (!txtOutput.value) return;
      navigator.clipboard.writeText(txtOutput.value).then(() => {
        if (elAlert) {
          elAlert.style.display = 'block';
          setTimeout(() => elAlert.style.display = 'none', 2000);
        }
      });
    });
  }
}
