/* app.js - Main Application Orchestrator (ES6 Entrypoint) */

import { initAdSenseLazyLoad } from './js/ads.js';
import { translations, updatePageLanguage } from './js/i18n.js';
import { initBase64Tool } from './js/base64.js';
import { initGlassmorphismTool } from './js/glassmorphism.js';
import { initQrCodeTool } from './js/qrcode.js';
import { initColorPaletteTool } from './js/colorPalette.js';
import { initRegexTester } from './js/regexTester.js';

// Application State
let currentLang = localStorage.getItem('app-lang') || 'en';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial State Setup
  applyLanguage(currentLang);
  initAdSenseLazyLoad();

  // 2. Initialize Individual Tools (if elements exist on this page)
  initBase64Tool();
  initGlassmorphismTool();
  initQrCodeTool();
  initColorPaletteTool();
  initRegexTester();

  // 3. Routing & Page Event Handlers
  setupDashboardRouting();
  setupLanguageHandler();
});

/**
 * Switch translation systems
 * @param {string} lang 'en' or 'cn'
 */
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('app-lang', lang);
  
  // Update translation text nodes
  updatePageLanguage(lang);
  
  // Toggle button label
  const btnLang = document.getElementById('lang-btn');
  if (btnLang) {
    btnLang.textContent = lang === 'en' ? 'CN' : 'EN';
  }

  // Update active tool translations if a tool is currently open
  const activePanel = document.querySelector('.tool-panel[style*="display: block"]');
  if (activePanel) {
    const toolName = activePanel.id.replace('panel-', '');
    updateActiveToolHeadings(toolName, lang);
  }
}

/**
 * Handle English/Chinese toggle button click
 */
function setupLanguageHandler() {
  const btnLang = document.getElementById('lang-btn');
  if (!btnLang) return;
  
  btnLang.addEventListener('click', () => {
    const targetLang = currentLang === 'en' ? 'cn' : 'en';
    applyLanguage(targetLang);
  });
}

/**
 * Set up click listeners for the main grid cards and back navigation.
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
      openToolViewer(toolName);
    });
  });

  // Bind back navigation
  btnBack.addEventListener('click', () => {
    // Hide viewer, show dashboard grid
    toolViewer.classList.remove('active');
    dashboardView.style.display = 'block';
    
    // Hide all tool panels
    document.querySelectorAll('.tool-panel').forEach(panel => {
      panel.style.display = 'none';
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
