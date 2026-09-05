/* codeToImage.js - Code Snippet to Image Exporter */

export function initCodeToImageTool() {
  const txtInput = document.getElementById('code-input');
  const txtTitle = document.getElementById('code-title-input');
  
  // Customization controls
  const selectTheme = document.getElementById('code-theme-select');
  const selectPadding = document.getElementById('code-padding-select');
  const selectLang = document.getElementById('code-lang-select'); // For formatting placeholder/tags
  const btnExport = document.getElementById('code-export-btn');
  const btnClear = document.getElementById('code-clear-btn');
  const elAlert = document.getElementById('code-alert');

  // Preview elements
  const divPreviewWrapper = document.getElementById('code-preview-wrapper'); // The gradient background container
  const divWindowFrame = document.getElementById('code-window-frame'); // The mock Mac window
  const elWindowTitle = document.getElementById('code-window-title');
  const elPreCode = document.getElementById('code-display-pre');

  if (!txtInput || !divPreviewWrapper || !elPreCode) return;

  function getLang() {
    return localStorage.getItem('app-lang') || 'en';
  }

  function updatePreview() {
    // Update window title
    if (elWindowTitle && txtTitle) {
      elWindowTitle.textContent = txtTitle.value.trim() || 'untitled';
    }

    // Update code text
    elPreCode.textContent = txtInput.value || '// Type or paste your code here...';

    // Update background theme
    const theme = selectTheme.value;
    divPreviewWrapper.className = `code-preview-wrapper theme-${theme}`;

    // Update padding
    const padding = selectPadding.value;
    divPreviewWrapper.style.padding = `${padding}px`;

    // Apply minimal code syntax highlight coloring (client-side regex parser)
    highlightCodeContent();
  }

  function highlightCodeContent() {
    let codeText = elPreCode.textContent;
    // Simple basic highlighting for presentation purposes (comments, strings, keywords)
    codeText = codeText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Highlight comments
    codeText = codeText.replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span class="code-hl-comment">$1</span>');
    // Highlight strings
    codeText = codeText.replace(/(["'`])(.*?)\1/g, '<span class="code-hl-string">$1$2$1</span>');
    // Highlight keywords
    const keywords = /\b(const|let|var|function|return|import|export|from|class|extends|if|else|for|while|async|await|try|catch|new|this|typeof|instanceof)\b/g;
    codeText = codeText.replace(keywords, '<span class="code-hl-keyword">$1</span>');

    elPreCode.innerHTML = codeText;
  }

  function exportImage() {
    if (typeof html2canvas === 'undefined') {
      const appLang = getLang();
      alert(
        appLang === 'cn'
          ? '导出脚本加载中，请稍后或检查网络连接。'
          : 'html2canvas library is not loaded. Please wait or check your internet connection.'
      );
      return;
    }

    btnExport.disabled = true;
    const originalText = btnExport.textContent;
    const appLang = getLang();
    btnExport.textContent = appLang === 'cn' ? '生成图片中...' : 'Generating Image...';

    // Call html2canvas with scale optimized for high-DPI screenshots
    html2canvas(divPreviewWrapper, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${txtTitle.value.trim() || 'code-snippet'}.png`;
      link.click();

      btnExport.disabled = false;
      btnExport.textContent = originalText;

      if (elAlert) {
        elAlert.style.display = 'block';
        setTimeout(() => elAlert.style.display = 'none', 2000);
      }
    }).catch(err => {
      console.error(err);
      btnExport.disabled = false;
      btnExport.textContent = originalText;
    });
  }

  // Bind input listeners
  [txtInput, txtTitle, selectTheme, selectPadding, selectLang].forEach(el => {
    if (el) {
      el.addEventListener('input', updatePreview);
      el.addEventListener('change', updatePreview);
    }
  });

  // Run initial state
  updatePreview();

  if (btnExport) {
    btnExport.addEventListener('click', exportImage);
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      txtInput.value = '';
      if (txtTitle) txtTitle.value = 'index.js';
      updatePreview();
    });
  }
}
