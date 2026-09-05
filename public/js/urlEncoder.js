/* urlEncoder.js - URL Encoder and Decoder Tool */

export function initUrlEncoderTool() {
  const txtInput = document.getElementById('url-input');
  const txtOutput = document.getElementById('url-output');
  const btnEncode = document.getElementById('url-btn-encode');
  const btnDecode = document.getElementById('url-btn-decode');
  const btnCopy = document.getElementById('url-copy-btn');
  const btnClear = document.getElementById('url-clear-btn');
  const elAlert = document.getElementById('url-alert');
  const chkRfc3986 = document.getElementById('url-rfc3986');

  if (!txtInput || !txtOutput) return;

  function rfc3986Encode(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
  }

  function handleEncode() {
    const rawVal = txtInput.value;
    if (chkRfc3986 && chkRfc3986.checked) {
      txtOutput.value = rfc3986Encode(rawVal);
    } else {
      txtOutput.value = encodeURIComponent(rawVal);
    }
  }

  function handleDecode() {
    const rawVal = txtInput.value;
    try {
      txtOutput.value = decodeURIComponent(rawVal);
    } catch (e) {
      txtOutput.value = 'Error decoding URL: Invalid escape sequence.';
    }
  }

  if (btnEncode) btnEncode.addEventListener('click', handleEncode);
  if (btnDecode) btnDecode.addEventListener('click', handleDecode);

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      txtInput.value = '';
      txtOutput.value = '';
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const textToCopy = txtOutput.value;
      if (!textToCopy) return;
      navigator.clipboard.writeText(textToCopy).then(() => {
        if (elAlert) {
          elAlert.style.display = 'block';
          setTimeout(() => elAlert.style.display = 'none', 2000);
        }
      });
    });
  }

  // Real-time update checkbox logic
  if (chkRfc3986) {
    chkRfc3986.addEventListener('change', () => {
      if (txtInput.value) {
        handleEncode();
      }
    });
  }
}
