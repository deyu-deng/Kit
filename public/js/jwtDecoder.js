/* jwtDecoder.js - JWT Decoder and Expiry Visualizer */

export function initJwtDecoderTool() {
  const txtInput = document.getElementById('jwt-input');
  const divHeader = document.getElementById('jwt-header-output');
  const divPayload = document.getElementById('jwt-payload-output');
  const divMeta = document.getElementById('jwt-meta-output');
  const btnClear = document.getElementById('jwt-clear-btn');

  if (!txtInput || !divHeader || !divPayload) return;

  function getLang() {
    return localStorage.getItem('app-lang') || 'en';
  }

  function base64UrlDecode(str) {
    // Replace URL-safe chars
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if necessary
    while (base64.length % 4) {
      base64 += '=';
    }
    try {
      // Decode base64 to binary string, then decode percent-encoding for UTF-8
      const binary = atob(base64);
      const percentEscaped = Array.from(binary)
        .map(char => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
        .join('');
      return decodeURIComponent(percentEscaped);
    } catch (e) {
      return null;
    }
  }

  function syntaxHighlight(jsonStr) {
    if (!jsonStr) return '';
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

  function decodeJwt() {
    const token = txtInput.value.trim();
    if (!token) {
      divHeader.innerHTML = '';
      divPayload.innerHTML = '';
      divMeta.innerHTML = '';
      divMeta.style.display = 'none';
      return;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      const lang = getLang();
      divHeader.innerHTML = `<span class="text-danger">${lang === 'cn' ? '无效的 JWT 格式（必须包含三个由点分隔的部分）' : 'Invalid JWT format (must contain 3 parts separated by dots).'}</span>`;
      divPayload.innerHTML = '';
      divMeta.innerHTML = '';
      divMeta.style.display = 'none';
      return;
    }

    const rawHeader = base64UrlDecode(parts[0]);
    const rawPayload = base64UrlDecode(parts[1]);

    if (!rawHeader || !rawPayload) {
      const lang = getLang();
      divHeader.innerHTML = `<span class="text-danger">${lang === 'cn' ? '解码 Base64 失败，令牌可能损坏' : 'Failed to decode Base64Url parts. Token may be corrupted.'}</span>`;
      divPayload.innerHTML = '';
      divMeta.innerHTML = '';
      divMeta.style.display = 'none';
      return;
    }

    try {
      const headerObj = JSON.parse(rawHeader);
      const payloadObj = JSON.parse(rawPayload);

      divHeader.innerHTML = syntaxHighlight(JSON.stringify(headerObj, null, 2));
      divPayload.innerHTML = syntaxHighlight(JSON.stringify(payloadObj, null, 2));

      // Expiry & metadata calculation
      let metaHtml = '';
      const lang = getLang();

      if (payloadObj.exp) {
        const expMs = payloadObj.exp * 1000;
        const expDate = new Date(expMs);
        const nowMs = Date.now();
        const diffMs = expMs - nowMs;

        metaHtml += `<p><strong>${lang === 'cn' ? '过期时间' : 'Expiration Time'}:</strong> ${expDate.toLocaleString()}</p>`;
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / 3600000);
          const minutes = Math.floor((diffMs % 3600000) / 60000);
          metaHtml += `<p class="text-success"><strong>${lang === 'cn' ? '状态: ✓ 未过期' : 'Status: ✓ Valid'}</strong> (${lang === 'cn' ? `剩余 ${hours} 小时 ${minutes} 分钟` : `${hours}h ${minutes}m remaining`})</p>`;
        } else {
          metaHtml += `<p class="text-danger"><strong>${lang === 'cn' ? '状态: ✗ 已过期' : 'Status: ✗ Expired'}</strong> (${lang === 'cn' ? `已过期 ${Math.abs(Math.floor(diffMs / 60000))} 分钟` : `expired ${Math.abs(Math.floor(diffMs / 60000))} minutes ago`})</p>`;
        }
      } else {
        metaHtml += `<p><strong>${lang === 'cn' ? '过期时间' : 'Expiration Time'}:</strong> ${lang === 'cn' ? '未设置 (永不过期)' : 'Not set (never expires)'}</p>`;
      }

      if (payloadObj.iat) {
        const iatDate = new Date(payloadObj.iat * 1000);
        metaHtml += `<p><strong>${lang === 'cn' ? '签发时间' : 'Issued At'}:</strong> ${iatDate.toLocaleString()}</p>`;
      }

      if (payloadObj.iss) {
        metaHtml += `<p><strong>${lang === 'cn' ? '签发者 (Issuer)' : 'Issuer (iss)'}:</strong> ${payloadObj.iss}</p>`;
      }

      if (payloadObj.sub) {
        metaHtml += `<p><strong>${lang === 'cn' ? '主题 (Subject)' : 'Subject (sub)'}:</strong> ${payloadObj.sub}</p>`;
      }

      divMeta.innerHTML = metaHtml;
      divMeta.style.display = 'block';
    } catch (err) {
      const lang = getLang();
      divHeader.innerHTML = `<span class="text-danger">${lang === 'cn' ? '解析 JSON 结构失败' : 'Failed to parse JSON structures.'}</span>`;
      divPayload.innerHTML = '';
      divMeta.innerHTML = '';
      divMeta.style.display = 'none';
    }
  }

  txtInput.addEventListener('input', decodeJwt);

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      txtInput.value = '';
      divHeader.innerHTML = '';
      divPayload.innerHTML = '';
      divMeta.innerHTML = '';
      divMeta.style.display = 'none';
    });
  }
}
