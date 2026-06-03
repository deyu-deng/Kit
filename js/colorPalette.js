/* colorPalette.js - Dynamic Color Palette Generator based on HSL color wheel harmony */

export function initColorPaletteTool() {
  const container = document.getElementById('palette-container');
  const btnGenerate = document.getElementById('palette-generate-btn');
  const btnCopyAll = document.getElementById('palette-copy-all-btn');
  const elAlert = document.getElementById('palette-alert');

  if (!container) return;

  let currentPalette = [];

  // Helper to convert HSL to Hex
  function hslToHex(h, s, l) {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function generateHarmoniousPalette() {
    container.innerHTML = '';
    currentPalette = [];

    // Algorithmic color harmony generation
    // Pick a random base Hue (0 - 360)
    const baseHue = Math.floor(Math.random() * 360);
    // Lock saturation to 65% - 85% and lightness to 45% - 65% for aesthetic UI vibes
    const saturation = Math.floor(Math.random() * 20) + 65; 
    const lightness = Math.floor(Math.random() * 20) + 45;

    // We generate 5 colors. Let's make it analogous or monochromatic-split.
    // offsets: base, +30, +60, +180 (complementary), +210
    const offsets = [0, 30, 60, 180, 210];

    offsets.forEach((offset, idx) => {
      const h = (baseHue + offset) % 360;
      // Slighly vary lightness for gradient look
      const l = Math.min(Math.max(lightness + (idx - 2) * 4, 30), 85);
      const hex = hslToHex(h, saturation, l).toUpperCase();
      currentPalette.push(hex);

      // Create color card elements
      const card = document.createElement('div');
      card.className = 'color-card';
      card.dataset.hex = hex;
      
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = hex;
      
      const hexLabel = document.createElement('div');
      hexLabel.className = 'color-hex';
      hexLabel.textContent = hex;

      card.appendChild(swatch);
      card.appendChild(hexLabel);
      container.appendChild(card);

      // Copy individual color card click handler
      card.addEventListener('click', () => {
        navigator.clipboard.writeText(hex).then(() => {
          showAlert(`Color ${hex} copied!`);
        });
      });
    });
  }

  function showAlert(msg) {
    elAlert.textContent = msg;
    elAlert.style.display = 'block';
    setTimeout(() => {
      elAlert.style.display = 'none';
    }, 2000);
  }

  // Generate on load
  generateHarmoniousPalette();

  // Button hooks
  btnGenerate.addEventListener('click', generateHarmoniousPalette);

  btnCopyAll.addEventListener('click', () => {
    const listText = currentPalette.join(', ');
    navigator.clipboard.writeText(listText).then(() => {
      showAlert('All Hex codes copied: ' + listText);
    });
  });
}
