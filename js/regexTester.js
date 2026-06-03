/* regexTester.js - Real-time Regular Expression testing and highlighting */

export function initRegexTester() {
  const elPattern = document.getElementById('regex-pattern');
  const elFlags = document.getElementById('regex-flags');
  const elText = document.getElementById('regex-text');
  const elOverlay = document.getElementById('regex-highlights-overlay');
  const elSummary = document.getElementById('regex-match-summary');

  if (!elPattern || !elText || !elOverlay) return;

  function runRegexTest() {
    const pattern = elPattern.value;
    const flags = elFlags.value || '';
    const text = elText.value;

    if (!pattern || !text) {
      elOverlay.innerHTML = escapeHtml(text);
      elSummary.textContent = 'No pattern or text entered.';
      return;
    }

    try {
      // Validate flags (allow only standard ones g, i, m, s, u, y)
      const sanitizedFlags = flags.replace(/[^gimsuy]/g, '');
      const regex = new RegExp(pattern, sanitizedFlags);
      
      // Calculate matches
      let matchesCount = 0;
      let highlightedText = '';

      if (sanitizedFlags.includes('g')) {
        let lastIndex = 0;
        let match;
        
        // Prevent infinite loops with empty regex matches (like .*)
        let safetyCounter = 0;
        
        while ((match = regex.exec(text)) !== null && safetyCounter < 1000) {
          safetyCounter++;
          matchesCount++;
          
          const matchIndex = match.index;
          const matchedVal = match[0];
          
          // Append pre-match plain text
          highlightedText += escapeHtml(text.substring(lastIndex, matchIndex));
          // Append matched text wrapped in mark
          highlightedText += `<mark>${escapeHtml(matchedVal)}</mark>`;
          
          lastIndex = regex.lastIndex;
          
          // Zero-width match safeguard
          if (match[0].length === 0) {
            regex.lastIndex++; 
          }
        }
        
        // Append remaining text
        highlightedText += escapeHtml(text.substring(lastIndex));
      } else {
        // Single match mode
        const match = text.match(regex);
        if (match) {
          matchesCount = 1;
          const matchIndex = match.index;
          const matchedVal = match[0];
          
          highlightedText = escapeHtml(text.substring(0, matchIndex)) + 
                            `<mark>${escapeHtml(matchedVal)}</mark>` + 
                            escapeHtml(text.substring(matchIndex + matchedVal.length));
        } else {
          highlightedText = escapeHtml(text);
        }
      }

      elOverlay.innerHTML = highlightedText;

      // Update summary log
      if (matchesCount > 0) {
        elSummary.innerHTML = `<strong>Success:</strong> Found ${matchesCount} match(es).`;
        elSummary.style.color = '#0070f3'; // Blue
      } else {
        elSummary.innerHTML = 'No matches found.';
        elSummary.style.color = 'var(--text-muted)';
      }

    } catch (err) {
      // Show regex compile error
      elOverlay.innerHTML = escapeHtml(text);
      elSummary.innerHTML = `<strong>Regex Error:</strong> ${escapeHtml(err.message)}`;
      elSummary.style.color = 'var(--danger-color)'; // Red
    }
  }

  // HTML escaping helper to prevent script injection in highlights
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Synchronize scrolling of textarea and highlights overlay div
  elText.addEventListener('scroll', () => {
    elOverlay.scrollTop = elText.scrollTop;
    elOverlay.scrollLeft = elText.scrollLeft;
  });

  // Bind key inputs
  elPattern.addEventListener('input', runRegexTest);
  elFlags.addEventListener('input', runRegexTest);
  elText.addEventListener('input', runRegexTest);

  // Resize syncing
  elText.addEventListener('mouseup', () => {
    // Sync size if textarea is manualy resized by user drag handle
    elOverlay.style.width = elText.clientWidth + 'px';
    elOverlay.style.height = elText.clientHeight + 'px';
  });
}
