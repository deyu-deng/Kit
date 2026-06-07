/* svgOptimizer.js - SVG Markup Optimizer & Cleaner */

export function initSvgOptimizerTool() {
  const txtInput = document.getElementById('svg-input');
  const txtOutput = document.getElementById('svg-output');
  const btnOptimize = document.getElementById('svg-optimize-btn');
  const btnCopy = document.getElementById('svg-copy-btn');
  const btnClear = document.getElementById('svg-clear-btn');
  const divPreview = document.getElementById('svg-preview-container');
  const elAlert = document.getElementById('svg-alert');
  const elStatus = document.getElementById('svg-status');

  // Options checkboxes
  const chkRemoveAttrs = document.getElementById('svg-opt-attrs'); // Remove editor attributes
  const chkRemoveMetadata = document.getElementById('svg-opt-metadata'); // Remove metadata/comments
  const chkAddViewbox = document.getElementById('svg-opt-viewbox'); // Ensure viewBox & remove width/height
  const chkRemoveFills = document.getElementById('svg-opt-fills'); // Remove fill/stroke for CSS inheritance
  const chkMinify = document.getElementById('svg-opt-minify'); // Minify whitespace

  if (!txtInput || !txtOutput) return;

  function getLang() {
    return localStorage.getItem('app-lang') || 'en';
  }

  function showStatus(message, isError = false) {
    if (!elStatus) return;
    elStatus.innerHTML = message;
    if (isError) {
      elStatus.className = 'alert alert-danger';
      elStatus.style.display = 'block';
    } else {
      elStatus.className = 'alert alert-success';
      elStatus.style.display = message ? 'block' : 'none';
    }
  }

  function optimizeSvg() {
    let svg = txtInput.value.trim();
    if (!svg) {
      txtOutput.value = '';
      if (divPreview) divPreview.innerHTML = '';
      showStatus('');
      return;
    }

    // Basic SVG validation
    if (!svg.toLowerCase().includes('<svg') || !svg.toLowerCase().includes('</svg>')) {
      const lang = getLang();
      showStatus(lang === 'cn' ? '无效的 SVG 代码' : 'Invalid SVG code structure.', true);
      return;
    }

    const originalSize = new Blob([svg]).size;

    try {
      // 1. Remove XML declarations, doctypes, and editor comments
      if (chkRemoveMetadata && chkRemoveMetadata.checked) {
        svg = svg.replace(/<\?xml[^>]*\?>/gi, '');
        svg = svg.replace(/<!DOCTYPE[^>]*>/gi, '');
        svg = svg.replace(/<!--[\s\S]*?-->/g, '');
        svg = svg.replace(/<(metadata|desc|title)[\s\S]*?<\/\1>/gi, '');
      }

      // 2. Remove editor namespaces and attributes
      if (chkRemoveAttrs && chkRemoveAttrs.checked) {
        svg = svg.replace(/\s+xmlns:(sodipodi|inkscape|illustrator|adobe)="[^"]*"/gi, '');
        svg = svg.replace(/\s+(sodipodi|inkscape|illustrator|adobe):[a-z0-9_-]+="[^"]*"/gi, '');
        svg = svg.replace(/<sodipodi:namedview[\s\S]*?\/?>/gi, '');
      }

      // 3. Ensure viewBox is present and optionally remove explicit width/height
      if (chkAddViewbox && chkAddViewbox.checked) {
        // Try to parse width & height to build a viewBox if missing
        const widthMatch = svg.match(/\bwidth="([^"]+)"/);
        const heightMatch = svg.match(/\bheight="([^"]+)"/);
        const viewBoxMatch = svg.match(/\bviewBox="([^"]+)"/);

        if (!viewBoxMatch && widthMatch && heightMatch) {
          const w = parseFloat(widthMatch[1]);
          const h = parseFloat(heightMatch[1]);
          if (!isNaN(w) && !isNaN(h)) {
            svg = svg.replace('<svg', `<svg viewBox="0 0 ${w} ${h}"`);
          }
        }
        
        // Remove explicit width & height attributes
        svg = svg.replace(/\s+width="[^"]*"/gi, '');
        svg = svg.replace(/\s+height="[^"]*"/gi, '');
      }

      // 4. Remove fills and strokes if specified
      if (chkRemoveFills && chkRemoveFills.checked) {
        svg = svg.replace(/\s+(fill|stroke)="[^"]*"/gi, '');
      }

      // 5. Minify whitespace
      if (chkMinify && chkMinify.checked) {
        svg = svg.replace(/>\s+</g, '><');
        svg = svg.replace(/\s{2,}/g, ' ');
        svg = svg.trim();
      }

      txtOutput.value = svg;
      if (divPreview) {
        divPreview.innerHTML = svg;
      }

      const optimizedSize = new Blob([svg]).size;
      const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
      const lang = getLang();

      showStatus(
        lang === 'cn'
          ? `优化成功！原始体积: ${originalSize} 字节 | 优化后体积: ${optimizedSize} 字节 (减少了 ${reduction}%)`
          : `Optimized! Original: ${originalSize} B | Optimized: ${optimizedSize} B (Reduced by ${reduction}%)`
      );
    } catch (e) {
      showStatus(e.message, true);
    }
  }

  if (btnOptimize) {
    btnOptimize.addEventListener('click', optimizeSvg);
  }

  // Optimize automatically on option changes
  [chkRemoveAttrs, chkRemoveMetadata, chkAddViewbox, chkRemoveFills, chkMinify].forEach(chk => {
    if (chk) chk.addEventListener('change', optimizeSvg);
  });

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      txtInput.value = '';
      txtOutput.value = '';
      if (divPreview) divPreview.innerHTML = '';
      showStatus('');
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
