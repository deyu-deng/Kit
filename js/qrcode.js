/* qrcode.js - Client-Side QR Code Generator logic */
import { translations } from './i18n.js';

export function initQrCodeTool() {
  const elInput = document.getElementById('qr-input');
  const elCanvas = document.getElementById('qrcode-canvas');
  const elPlaceholder = document.getElementById('qr-ph-text');
  const btnDownload = document.getElementById('qr-download-btn');
  const btnClear = document.getElementById('qr-clear-btn');

  if (!elInput || !elCanvas) return;

  function generateQR() {
    const rawVal = elInput.value.trim();
    if (!rawVal) {
      elCanvas.style.display = 'none';
      elPlaceholder.style.display = 'block';
      btnDownload.disabled = true;
      return;
    }

    try {
      // Hide placeholder, show canvas
      elPlaceholder.style.display = 'none';
      elCanvas.style.display = 'block';
      btnDownload.disabled = false;

      // Render QR code using QrCreator library loaded globally
      if (window.QrCreator) {
        // Clear canvas contents first by resetting dimensions or drawing white background
        const ctx = elCanvas.getContext('2d');
        ctx.clearRect(0, 0, elCanvas.width, elCanvas.height);
        
        window.QrCreator.render({
          text: rawVal,
          radius: 0.0, // square blocks (standard)
          ecLevel: 'M', // medium error correction
          fill: '#000000', // black dots
          background: '#ffffff', // white back
          size: 250
        }, elCanvas);
      } else {
        const lang = localStorage.getItem('app-lang') || 'en';
        const dict = translations[lang] || translations.en;
        
        // Fallback: draw an error on canvas if CDN fails
        const ctx = elCanvas.getContext('2d');
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 250, 250);
        ctx.fillStyle = "#ff0000";
        ctx.font = "14px Arial";
        ctx.fillText(dict['qr-cdn-failed-title'] || "CDN load failed.", 10, 50);
        ctx.fillText(dict['qr-cdn-failed-sub'] || "Please check internet connection.", 10, 80);
      }
    } catch (err) {
      console.error('Failed to generate QR Code:', err);
    }
  }

  // Bind input listeners
  elInput.addEventListener('input', generateQR);

  // Download QR Code as PNG
  btnDownload.addEventListener('click', () => {
    if (!elCanvas) return;
    
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    // Convert canvas data to PNG url
    link.href = elCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Clear
  btnClear.addEventListener('click', () => {
    elInput.value = '';
    elCanvas.style.display = 'none';
    elPlaceholder.style.display = 'block';
    btnDownload.disabled = true;
  });
}
