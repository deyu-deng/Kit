/* glassmorphism.js - Glassmorphism CSS Parameter controls and previews */
import { translations } from './i18n.js';

export function initGlassmorphismTool() {
  const opSlider = document.getElementById('glass-opacity');
  const blurSlider = document.getElementById('glass-blur');
  const radSlider = document.getElementById('glass-radius');
  const borderSlider = document.getElementById('glass-border');
  const colorPicker = document.getElementById('glass-color');
  
  const opLabel = document.getElementById('glass-opacity-val');
  const blurLabel = document.getElementById('glass-blur-val');
  const radLabel = document.getElementById('glass-radius-val');
  const borderLabel = document.getElementById('glass-border-val');
  
  const glassPreview = document.getElementById('glass-preview');
  const cssTextarea = document.getElementById('glass-css-code');
  const copyBtn = document.getElementById('glass-copy-btn');
  const tailwindTextarea = document.getElementById('glass-tailwind-code');
  const copyTailwindBtn = document.getElementById('glass-copy-tailwind-btn');
  const elAlert = document.getElementById('glass-alert');

  if (!opSlider || !glassPreview) return;

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  }

  function updateGlassEffect() {
    const opacity = opSlider.value;
    const blur = blurSlider.value;
    const radius = radSlider.value;
    const borderOpacity = borderSlider.value;
    const colorHex = colorPicker.value;
    const rgb = hexToRgb(colorHex);

    // Update value labels
    opLabel.textContent = opacity;
    blurLabel.textContent = `${blur}px`;
    radLabel.textContent = `${radius}px`;
    borderLabel.textContent = borderOpacity;

    // Apply inline styles to preview box
    const bgColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    const borderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${borderOpacity})`;
    
    glassPreview.style.background = bgColor;
    glassPreview.style.backdropFilter = `blur(${blur}px)`;
    glassPreview.style.webkitBackdropFilter = `blur(${blur}px)`;
    glassPreview.style.borderRadius = `${radius}px`;
    glassPreview.style.border = `1px solid ${borderColor}`;
    
    // Generate CSS code
    const cssCode = `background: ${bgColor};
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border-radius: ${radius}px;
border: 1px solid ${borderColor};`;

    cssTextarea.value = cssCode;

    // Generate Tailwind code
    const tailwindCode = `bg-[rgba(${rgb.r},${rgb.g},${rgb.b},${opacity})] backdrop-blur-[${blur}px] rounded-[${radius}px] border border-[rgba(${rgb.r},${rgb.g},${rgb.b},${borderOpacity})]`;
    tailwindTextarea.value = tailwindCode;
  }

  // Event bindings
  const inputs = [opSlider, blurSlider, radSlider, borderSlider, colorPicker];
  inputs.forEach(input => {
    input.addEventListener('input', updateGlassEffect);
  });

  // Copy CSS
  copyBtn.addEventListener('click', () => {
    if (!cssTextarea.value) return;
    navigator.clipboard.writeText(cssTextarea.value).then(() => {
      const lang = localStorage.getItem('app-lang') || 'en';
      const dict = translations[lang] || translations.en;
      elAlert.textContent = dict['glass-copied-css'] || 'CSS copied to clipboard!';
      elAlert.style.display = 'block';
      setTimeout(() => {
        elAlert.style.display = 'none';
      }, 2000);
    });
  });

  // Copy Tailwind
  copyTailwindBtn.addEventListener('click', () => {
    if (!tailwindTextarea.value) return;
    navigator.clipboard.writeText(tailwindTextarea.value).then(() => {
      const lang = localStorage.getItem('app-lang') || 'en';
      const dict = translations[lang] || translations.en;
      elAlert.textContent = dict['glass-copied-tailwind'] || 'Tailwind classes copied!';
      elAlert.style.display = 'block';
      setTimeout(() => {
        elAlert.style.display = 'none';
      }, 2000);
    });
  });

  // Initial calculation
  updateGlassEffect();
}
