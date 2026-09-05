/* jsonFormatter.js - JSON Formatter and Validator Tool */

export function initJsonFormatterTool() {
  const txtInput = document.getElementById('json-input');
  const txtOutput = document.getElementById('json-output');
  const btnFormat2 = document.getElementById('json-format-2');
  const btnFormat4 = document.getElementById('json-format-4');
  const btnMinify = document.getElementById('json-minify');
  const btnCopy = document.getElementById('json-copy-btn');
  const btnClear = document.getElementById('json-clear-btn');
  const elAlert = document.getElementById('json-alert');
  const elStatus = document.getElementById('json-status');

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

  function syntaxHighlight(jsonStr) {
    // Escape HTML special chars
    jsonStr = jsonStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return jsonStr.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\b\d+(?:\.\d*)?(?:[eE][+-]?\d+)?\b)/g, function (match) {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  }

  function processJson(spaces) {
    const rawVal = txtInput.value.trim();
    if (!rawVal) {
      txtOutput.innerHTML = '';
      showStatus('');
      return;
    }

    try {
      const parsed = JSON.parse(rawVal);
      const formatted = JSON.stringify(parsed, null, spaces);
      txtOutput.innerHTML = syntaxHighlight(formatted);
      
      const lang = getLang();
      showStatus(lang === 'cn' ? 'JSON 验证成功，格式化完成。' : 'Valid JSON formatted successfully.');
    } catch (err) {
      txtOutput.innerHTML = '';
      showStatus(err.message, true);
    }
  }

  if (btnFormat2) {
    btnFormat2.addEventListener('click', () => processJson(2));
  }

  if (btnFormat4) {
    btnFormat4.addEventListener('click', () => processJson(4));
  }

  if (btnMinify) {
    btnMinify.addEventListener('click', () => {
      const rawVal = txtInput.value.trim();
      if (!rawVal) return;
      try {
        const parsed = JSON.parse(rawVal);
        const minified = JSON.stringify(parsed);
        txtOutput.innerHTML = syntaxHighlight(minified);
        const lang = getLang();
        showStatus(lang === 'cn' ? 'JSON 压缩完成。' : 'JSON minified successfully.');
      } catch (err) {
        txtOutput.innerHTML = '';
        showStatus(err.message, true);
      }
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      txtInput.value = '';
      txtOutput.innerHTML = '';
      showStatus('');
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const textToCopy = txtOutput.textContent;
      if (!textToCopy) return;
      navigator.clipboard.writeText(textToCopy).then(() => {
        if (elAlert) {
          elAlert.style.display = 'block';
          setTimeout(() => elAlert.style.display = 'none', 2000);
        }
      });
    });
  }

  // Real-time validation
  txtInput.addEventListener('input', () => {
    const rawVal = txtInput.value.trim();
    if (!rawVal) {
      showStatus('');
      return;
    }
    try {
      JSON.parse(rawVal);
      const lang = getLang();
      showStatus(lang === 'cn' ? '✓ 有效的 JSON 格式' : '✓ Valid JSON format');
    } catch (err) {
      showStatus(err.message, true);
    }
  });
}
