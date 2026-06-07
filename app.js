/* app.js - Main Application Orchestrator (ES6 Entrypoint) */

import { initAdSenseLazyLoad } from './js/ads.js';
import { translations, updatePageLanguage } from './js/i18n.js';
import { initBase64Tool } from './js/base64.js';
import { initGlassmorphismTool } from './js/glassmorphism.js';
import { initQrCodeTool } from './js/qrcode.js';
import { initColorPaletteTool } from './js/colorPalette.js';
import { initRegexTester } from './js/regexTester.js';
import { initGitGeneratorTool } from './js/gitGenerator.js';
import { initCronGeneratorTool } from './js/cronGenerator.js';
import { initImageCompressorTool } from './js/imageCompressor.js';

// Application State (Bilingual Directory Alignment)
const htmlLang = document.documentElement.lang;
let currentLang = htmlLang === 'zh' || htmlLang === 'cn' ? 'cn' : 'en';
// Sync to localStorage for compatibility with individual tool JS files
localStorage.setItem('app-lang', currentLang);

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial State Setup
  updatePageLanguage(currentLang);
  initAdSenseLazyLoad();

  // 2. Initialize Individual Tools (if elements exist on this page)
  initBase64Tool();
  initGlassmorphismTool();
  initQrCodeTool();
  initColorPaletteTool();
  initRegexTester();
  initGitGeneratorTool();
  initCronGeneratorTool();
  initImageCompressorTool();

  // 3. Routing & Page Event Handlers
  setupDashboardRouting();
  setupLanguageHandler();

  // 4. URL query routing for AI Agents and direct links
  handleUrlRouting();
});

/**
 * Handle English/Chinese toggle button click (Redirect to parallel directories)
 */
function setupLanguageHandler() {
  const btnLang = document.getElementById('lang-btn');
  if (!btnLang) return;
  
  btnLang.addEventListener('click', () => {
    const currentUrl = window.location.href;
    let targetUrl = '';
    
    if (currentLang === 'en') {
      // English -> Chinese
      if (currentUrl.includes('/tools/')) {
        targetUrl = currentUrl.replace('/tools/', '/cn/tools/');
      } else if (currentUrl.includes('/guides/')) {
        targetUrl = currentUrl.replace('/guides/', '/cn/guides/');
      } else {
        // Root page redirection
        try {
          const urlObj = new URL(currentUrl);
          const pathname = urlObj.pathname;
          const lastSlash = pathname.lastIndexOf('/');
          const filename = pathname.substring(lastSlash + 1) || 'index.html';
          const basePath = pathname.substring(0, lastSlash);
          urlObj.pathname = basePath + '/cn/' + filename;
          targetUrl = urlObj.toString();
        } catch (e) {
          // fallback
          targetUrl = 'cn/index.html';
        }
      }
    } else {
      // Chinese -> English
      if (currentUrl.includes('/cn/tools/')) {
        targetUrl = currentUrl.replace('/cn/tools/', '/tools/');
      } else if (currentUrl.includes('/cn/guides/')) {
        targetUrl = currentUrl.replace('/cn/guides/', '/guides/');
      } else if (currentUrl.includes('/cn/')) {
        targetUrl = currentUrl.replace('/cn/', '/');
      }
    }
    
    if (targetUrl) {
      window.location.href = targetUrl;
    }
  });
}

/**
 * Set up click listeners for the main grid cards (dashboard only).
 */
function setupDashboardRouting() {
  const toolsGrid = document.getElementById('tools-grid');
  const dashboardView = document.getElementById('dashboard-view');
  const toolViewer = document.getElementById('tool-viewer');
  const btnBack = document.getElementById('back-to-grid');

  if (!toolsGrid || !dashboardView || !toolViewer || !btnBack) return;

  // Bind card clicks
  const cards = toolsGrid.querySelectorAll('.tool-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const toolName = card.dataset.tool;
      // Navigate to the standalone tool page
      const currentUrl = window.location.href;
      let pathPrefix = 'tools/';
      if (currentLang === 'cn') {
        // If already in /cn/ folder, link to cn/tools/
        pathPrefix = 'tools/';
      }
      window.location.href = pathPrefix + toolName + '.html';
    });
  });
}

/**
 * Hide dashboard and open specific tool container
 * @param {string} toolName 
 */
function openToolViewer(toolName) {
  const dashboardView = document.getElementById('dashboard-view');
  const toolViewer = document.getElementById('tool-viewer');
  
  if (!dashboardView || !toolViewer) return;

  // Hide dashboard, show viewer container
  dashboardView.style.display = 'none';
  toolViewer.classList.add('active');

  // Hide all panels and show only target tool panel
  document.querySelectorAll('.tool-panel').forEach(panel => {
    panel.style.display = 'none';
  });
  
  const targetPanel = document.getElementById(`panel-${toolName}`);
  if (targetPanel) {
    targetPanel.style.display = 'block';
  }

  // Update dynamic headings & guides
  updateActiveToolHeadings(toolName, currentLang);
}

/**
 * Load headers, text, and guide HTML for active tool based on selected lang
 */
function updateActiveToolHeadings(toolName, lang) {
  const elTitle = document.getElementById('active-tool-title');
  const elDesc = document.getElementById('active-tool-desc');
  const elGuideContent = document.getElementById('guide-sec-content');
  
  const dict = translations[lang] || translations.en;
  
  if (elTitle) elTitle.textContent = dict[`${toolName}-title`] || '';
  if (elDesc) elDesc.textContent = dict[`${toolName}-desc`] || '';
  if (elGuideContent) elGuideContent.innerHTML = dict[`guide-${toolName}`] || '';
}

/**
 * Route and auto-populate tools using URL query parameters for AI agent optimization.
 */
function handleUrlRouting() {
  const params = new URLSearchParams(window.location.search);
  
  // Resolve tool name either from parameter or active panel on standalone page
  let toolName = params.get('tool');
  if (!toolName) {
    const visiblePanel = document.querySelector('.tool-panel');
    if (visiblePanel && window.getComputedStyle(visiblePanel).display !== 'none') {
      toolName = visiblePanel.id.replace('panel-', '');
    }
  }
  
  if (!toolName) return;

  // Wait a small tick to ensure DOM setup is complete and tools are initialized
  setTimeout(() => {
    // Open the tool viewer if we are on dashboard page
    const dashboardView = document.getElementById('dashboard-view');
    if (dashboardView) {
      openToolViewer(toolName);
    }

    // Populate inputs depending on the tool
    if (toolName === 'base64') {
      const input = params.get('input');
      const mode = params.get('mode'); // 'encode' or 'decode'
      
      if (mode === 'decode') {
        const btnDecode = document.getElementById('b64-mode-decode');
        if (btnDecode) btnDecode.click();
      } else {
        const btnEncode = document.getElementById('b64-mode-encode');
        if (btnEncode) btnEncode.click();
      }
      
      if (input) {
        const inputEl = document.getElementById('b64-input');
        if (inputEl) {
          inputEl.value = input;
          inputEl.dispatchEvent(new Event('input')); // trigger conversion
        }
      }
    } else if (toolName === 'glassmorphism') {
      const opacity = params.get('opacity');
      const blur = params.get('blur');
      const radius = params.get('radius');
      const border = params.get('border');
      const color = params.get('color');

      if (opacity !== null) {
        const el = document.getElementById('glass-opacity');
        if (el) { el.value = opacity; el.dispatchEvent(new Event('input')); }
      }
      if (blur !== null) {
        const el = document.getElementById('glass-blur');
        if (el) { el.value = blur; el.dispatchEvent(new Event('input')); }
      }
      if (radius !== null) {
        const el = document.getElementById('glass-radius');
        if (el) { el.value = radius; el.dispatchEvent(new Event('input')); }
      }
      if (border !== null) {
        const el = document.getElementById('glass-border');
        if (el) { el.value = border; el.dispatchEvent(new Event('input')); }
      }
      if (color !== null) {
        const el = document.getElementById('glass-color');
        if (el) { el.value = '#' + color.replace('#', ''); el.dispatchEvent(new Event('input')); }
      }
    } else if (toolName === 'qrcode') {
      const input = params.get('input');
      if (input) {
        const inputEl = document.getElementById('qr-input');
        if (inputEl) {
          inputEl.value = input;
          inputEl.dispatchEvent(new Event('input')); // trigger QR generation
        }
      }
    } else if (toolName === 'regex') {
      const pattern = params.get('pattern');
      const flags = params.get('flags');
      const text = params.get('text');

      if (pattern !== null) {
        const el = document.getElementById('regex-pattern');
        if (el) el.value = pattern;
      }
      if (flags !== null) {
        const el = document.getElementById('regex-flags');
        if (el) el.value = flags;
      }
      if (text !== null) {
        const el = document.getElementById('regex-text');
        if (el) el.value = text;
      }
      
      // Trigger update
      const elRegexPattern = document.getElementById('regex-pattern');
      if (elRegexPattern) elRegexPattern.dispatchEvent(new Event('input'));
    } else if (toolName === 'git') {
      const category = params.get('category');
      const action = params.get('action');
      const value = params.get('value');

      const selectCategory = document.getElementById('git-action-category');
      if (selectCategory && category) {
        selectCategory.value = category;
        selectCategory.dispatchEvent(new Event('change'));
        
        // wait for options to render, then select sub-options
        setTimeout(() => {
          if (category === 'undo-commit') {
            const selectUndo = document.getElementById('git-undo-select');
            if (selectUndo && action) {
              selectUndo.value = action;
              selectUndo.dispatchEvent(new Event('change'));
            }
            const inputUndo = document.getElementById('git-undo-input');
            if (inputUndo && value !== null) {
              inputUndo.value = value;
              inputUndo.dispatchEvent(new Event('input'));
            }
          } else if (category === 'discard-changes') {
            const selectDiscard = document.getElementById('git-discard-select');
            if (selectDiscard && action) {
              selectDiscard.value = action;
              selectDiscard.dispatchEvent(new Event('change'));
            }
            const inputDiscard = document.getElementById('git-discard-input');
            if (inputDiscard && value !== null) {
              inputDiscard.value = value;
              inputDiscard.dispatchEvent(new Event('input'));
            }
          } else if (category === 'branches') {
            const selectBranch = document.getElementById('git-branch-select');
            if (selectBranch && action) {
              selectBranch.value = action;
              selectBranch.dispatchEvent(new Event('change'));
            }
            const inputBranch = document.getElementById('git-branch-input');
            if (inputBranch && value !== null) {
              inputBranch.value = value;
              inputBranch.dispatchEvent(new Event('input'));
            }
          } else if (category === 'stash') {
            const selectStash = document.getElementById('git-stash-select');
            if (selectStash && action) {
              selectStash.value = action;
              selectStash.dispatchEvent(new Event('change'));
            }
            const inputStash = document.getElementById('git-stash-input');
            if (inputStash && value !== null) {
              inputStash.value = value;
              inputStash.dispatchEvent(new Event('input'));
            }
          }
        }, 100);
      }
    } else if (toolName === 'cron') {
      const expression = params.get('expression');
      if (expression) {
        const parts = expression.split(' ');
        if (parts.length >= 5) {
          const minEl = document.getElementById('cron-min');
          const hourEl = document.getElementById('cron-hour');
          const dayEl = document.getElementById('cron-day');
          const monthEl = document.getElementById('cron-month');
          const weekEl = document.getElementById('cron-week');
          
          if (minEl) minEl.value = parts[0];
          if (hourEl) hourEl.value = parts[1];
          if (dayEl) dayEl.value = parts[2];
          if (monthEl) monthEl.value = parts[3];
          if (weekEl) weekEl.value = parts[4];
          
          if (minEl) minEl.dispatchEvent(new Event('input'));
        }
      }
    }
  }, 100);
}
