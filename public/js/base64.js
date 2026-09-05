/* base64.js - Base64 Encoding & Decoding Operations */
import { translations } from './i18n.js';

export function initBase64Tool() {
  const elInput = document.getElementById('b64-input');
  const elOutput = document.getElementById('b64-output');
  const btnEncode = document.getElementById('b64-mode-encode');
  const btnDecode = document.getElementById('b64-mode-decode');
  const btnCopy = document.getElementById('b64-copy-btn');
  const btnClear = document.getElementById('b64-clear-btn');
  const elAlert = document.getElementById('b64-alert');
  
  let currentMode = 'encode'; // 'encode' or 'decode'

  if (!elInput || !elOutput) return;

  function runBase64() {
    const rawVal = elInput.value.trim();
    if (!rawVal) {
      elOutput.value = '';
      return;
    }
    
    try {
      if (currentMode === 'encode') {
        // Handle unicode character strings correctly via utf-8 conversion
        const encoded = btoa(encodeURIComponent(rawVal).replace(/%([0-9A-F]{2})/g, (match, p1) => {
          return String.fromCharCode(parseInt(p1, 16));
        }));
        elOutput.value = encoded;
      } else {
        const decoded = decodeURIComponent(atob(rawVal).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        elOutput.value = decoded;
      }
    } catch (e) {
      const lang = localStorage.getItem('app-lang') || 'en';
      const dict = translations[lang] || translations.en;
      elOutput.value = currentMode === 'encode' 
        ? (dict['b64-error-encode'] || 'Error encoding text.') 
        : (dict['b64-error-decode'] || 'Error decoding text. Invalid Base64 format.');
    }
  }

  // Bind input listeners for real-time conversion
  elInput.addEventListener('input', runBase64);

  // Toggle modes
  btnEncode.addEventListener('click', () => {
    currentMode = 'encode';
    btnEncode.classList.remove('btn-secondary');
    btnDecode.classList.add('btn-secondary');
    runBase64();
  });

  btnDecode.addEventListener('click', () => {
    currentMode = 'decode';
    btnDecode.classList.remove('btn-secondary');
    btnEncode.classList.add('btn-secondary');
    runBase64();
  });

  // Copy result
  btnCopy.addEventListener('click', () => {
    if (!elOutput.value) return;
    navigator.clipboard.writeText(elOutput.value).then(() => {
      elAlert.style.display = 'block';
      setTimeout(() => {
        elAlert.style.display = 'none';
      }, 2000);
    });
  });

  // Clear
  btnClear.addEventListener('click', () => {
    elInput.value = '';
    elOutput.value = '';
  });
}
