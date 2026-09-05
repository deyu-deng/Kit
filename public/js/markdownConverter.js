/* markdownConverter.js - Markdown and HTML Converter Tool */

export function initMarkdownConverterTool() {
  const txtInput = document.getElementById('md-input');
  const txtOutput = document.getElementById('md-output');
  const btnMdToHtml = document.getElementById('md-btn-to-html');
  const btnHtmlToMd = document.getElementById('md-btn-to-markdown');
  const btnCopy = document.getElementById('md-copy-btn');
  const btnClear = document.getElementById('md-clear-btn');
  const elAlert = document.getElementById('md-alert');

  if (!txtInput || !txtOutput) return;

  function convertMdToHtml() {
    const rawVal = txtInput.value;
    if (typeof marked !== 'undefined') {
      try {
        txtOutput.value = marked.parse(rawVal);
      } catch (e) {
        txtOutput.value = 'Error parsing Markdown using marked.js.';
      }
    } else {
      txtOutput.value = 'Failed to load markdown parsing library (marked.js). Please verify internet connection.';
    }
  }

  function htmlToMarkdown(element) {
    let markdown = '';
    const childNodes = element.childNodes;
    
    for (let node of childNodes) {
      if (node.nodeType === 3) { // Text Node
        markdown += node.nodeValue;
      } else if (node.nodeType === 1) { // Element Node
        const tagName = node.tagName.toLowerCase();
        let innerMD = htmlToMarkdown(node);
        
        switch (tagName) {
          case 'h1': markdown += `# ${innerMD}\n\n`; break;
          case 'h2': markdown += `## ${innerMD}\n\n`; break;
          case 'h3': markdown += `### ${innerMD}\n\n`; break;
          case 'h4': markdown += `#### ${innerMD}\n\n`; break;
          case 'h5': markdown += `##### ${innerMD}\n\n`; break;
          case 'h6': markdown += `###### ${innerMD}\n\n`; break;
          case 'p': markdown += `${innerMD}\n\n`; break;
          case 'strong': case 'b': markdown += `**${innerMD}**`; break;
          case 'em': case 'i': markdown += `*${innerMD}*`; break;
          case 'code':
            if (node.parentNode && node.parentNode.tagName.toLowerCase() === 'pre') {
              markdown += innerMD;
            } else {
              markdown += `\`${innerMD}\``;
            }
            break;
          case 'pre':
            markdown += `\`\`\`\n${innerMD}\n\`\`\`\n\n`;
            break;
          case 'a':
            const href = node.getAttribute('href') || '';
            markdown += `[${innerMD}](${href})`;
            break;
          case 'ul':
            markdown += `${innerMD}\n`;
            break;
          case 'ol':
            markdown += `${innerMD}\n`;
            break;
          case 'li':
            if (node.parentNode) {
              const parent = node.parentNode.tagName.toLowerCase();
              if (parent === 'ul') {
                markdown += `- ${innerMD}\n`;
              } else if (parent === 'ol') {
                const index = Array.from(node.parentNode.children).indexOf(node) + 1;
                markdown += `${index}. ${innerMD}\n`;
              }
            }
            break;
          case 'blockquote':
            markdown += `> ${innerMD.trim().replace(/\n/g, '\n> ')}\n\n`;
            break;
          case 'br':
            markdown += '\n';
            break;
          default:
            markdown += innerMD;
            break;
        }
      }
    }
    return markdown;
  }

  function convertHtmlToMd() {
    const rawVal = txtInput.value.trim();
    if (!rawVal) {
      txtOutput.value = '';
      return;
    }
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawVal;
    txtOutput.value = htmlToMarkdown(tempDiv).replace(/\n{3,}/g, '\n\n').trim();
  }

  if (btnMdToHtml) btnMdToHtml.addEventListener('click', convertMdToHtml);
  if (btnHtmlToMd) btnHtmlToMd.addEventListener('click', convertHtmlToMd);

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
}
