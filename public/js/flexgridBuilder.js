/* flexgridBuilder.js - Flexbox and CSS Grid Visual Builder Playground */

export function initFlexgridBuilderTool() {
  const selectDisplay = document.getElementById('fg-display');
  const selectDirection = document.getElementById('fg-direction');
  const selectJustify = document.getElementById('fg-justify');
  const selectAlign = document.getElementById('fg-align');
  const sliderGap = document.getElementById('fg-gap');
  const selectCols = document.getElementById('fg-cols');

  const container = document.getElementById('fg-container-preview');
  const txtCssCode = document.getElementById('fg-css-code');
  const btnCopy = document.getElementById('fg-copy-btn');
  const elAlert = document.getElementById('fg-alert');
  const groupFlex = document.getElementById('fg-flex-options');
  const groupGrid = document.getElementById('fg-grid-options');

  if (!container || !txtCssCode) return;

  function updateLayout() {
    const display = selectDisplay ? selectDisplay.value : 'flex';
    const gap = sliderGap ? sliderGap.value + 'px' : '16px';
    const direction = selectDirection ? selectDirection.value : 'row';
    const justify = selectJustify ? selectJustify.value : 'flex-start';
    const align = selectAlign ? selectAlign.value : 'stretch';
    const cols = selectCols ? selectCols.value : '3';

    let css = '';

    // Apply styles to container
    container.style.display = display;
    container.style.gap = gap;

    if (display === 'flex') {
      if (groupFlex) groupFlex.style.display = 'block';
      if (groupGrid) groupGrid.style.display = 'none';

      container.style.flexDirection = direction;
      container.style.justifyContent = justify;
      container.style.alignItems = align;

      css = `.container {
  display: flex;
  flex-direction: ${direction};
  justify-content: ${justify};
  align-items: ${align};
  gap: ${gap};
}`;
    } else {
      if (groupFlex) groupFlex.style.display = 'none';
      if (groupGrid) groupGrid.style.display = 'block';

      container.style.flexDirection = '';
      container.style.justifyContent = '';
      container.style.alignItems = '';
      container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

      css = `.container {
  display: grid;
  grid-template-columns: repeat(${cols}, 1fr);
  gap: ${gap};
}`;
    }

    txtCssCode.value = css;
    
    // Update gap text label
    const elGapVal = document.getElementById('fg-gap-val');
    if (elGapVal) elGapVal.textContent = gap;
  }

  // Bind change events
  const controls = [selectDisplay, selectDirection, selectJustify, selectAlign, sliderGap, selectCols];
  controls.forEach(ctrl => {
    if (ctrl) ctrl.addEventListener('input', updateLayout);
  });

  // Initialize
  updateLayout();

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const textToCopy = txtCssCode.value;
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
