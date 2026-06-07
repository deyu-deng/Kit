/* imageCompressor.js - Client-Side WebP Image Compressor */

export function initImageCompressorTool() {
  const dropzone = document.getElementById('image-dropzone');
  const fileInput = document.getElementById('image-file-input');
  const settingsContainer = document.getElementById('image-settings-container');
  const qualityInput = document.getElementById('image-quality');
  const qualityVal = document.getElementById('image-quality-val');
  const actionGroup = document.getElementById('image-action-group');
  const compressBtn = document.getElementById('image-compress-btn');
  const resetBtn = document.getElementById('image-reset-btn');
  
  const previewColumn = document.getElementById('image-preview-column');
  const previewImg = document.getElementById('image-preview-img');
  const origSizeEl = document.getElementById('image-orig-size');
  const compSizeEl = document.getElementById('image-comp-size');
  const shrinkRatioEl = document.getElementById('image-shrink-ratio');
  const downloadBtn = document.getElementById('image-download-btn');

  if (!dropzone || !fileInput || !compressBtn || !downloadBtn) return;

  let selectedFile = null;
  let compressedBlob = null;
  let compressedUrl = null;

  // 1. Setup Quality Slider listener
  qualityInput.addEventListener('input', () => {
    qualityVal.textContent = parseFloat(qualityInput.value).toFixed(2);
  });

  // 2. Setup dropzone click to open file explorer
  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  // 3. Setup drag & drop styles
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--accent-color)';
    dropzone.style.background = 'var(--accent-light)';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--border-color)';
    dropzone.style.background = 'var(--bg-app)';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    dropzone.style.background = 'var(--bg-app)';
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  function handleFile(file) {
    // Basic file validation
    if (!file.type.match('image.*')) {
      alert('Please upload an image file (PNG, JPEG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size exceeds the 10MB limit.');
      return;
    }

    selectedFile = file;
    
    // Display file stats
    origSizeEl.textContent = formatBytes(file.size);
    compSizeEl.textContent = '...';
    shrinkRatioEl.textContent = '...';
    
    // Show settings and action buttons
    settingsContainer.style.display = 'block';
    actionGroup.style.display = 'flex';
    
    // Reset preview column state
    previewColumn.style.display = 'none';
    downloadBtn.disabled = true;
    if (compressedUrl) {
      URL.revokeObjectURL(compressedUrl);
      compressedUrl = null;
    }
  }

  // 4. Compress Image via HTML5 Canvas
  compressBtn.addEventListener('click', () => {
    if (!selectedFile) return;

    compressBtn.disabled = true;
    const oldText = compressBtn.textContent;
    const isEn = (localStorage.getItem('app-lang') || 'en') === 'en';
    compressBtn.textContent = isEn ? 'Compressing...' : '压缩中...';

    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Match original image dimensions
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0);

        // Convert canvas output to WebP format with selected quality
        const quality = parseFloat(qualityInput.value);
        canvas.toBlob((blob) => {
          if (!blob) {
            alert('Failed to compress image.');
            compressBtn.disabled = false;
            compressBtn.textContent = oldText;
            return;
          }

          compressedBlob = blob;
          if (compressedUrl) {
            URL.revokeObjectURL(compressedUrl);
          }
          compressedUrl = URL.createObjectURL(blob);

          // Update preview img src
          previewImg.src = compressedUrl;

          // Update metrics
          compSizeEl.textContent = formatBytes(blob.size);
          const ratio = ((selectedFile.size - blob.size) / selectedFile.size * 100);
          if (ratio > 0) {
            shrinkRatioEl.textContent = ratio.toFixed(0) + '%';
            shrinkRatioEl.style.color = 'var(--success-color)';
          } else {
            // Negative reduction means the compressed image is larger than original
            shrinkRatioEl.textContent = '0%';
            shrinkRatioEl.style.color = 'var(--text-muted)';
          }

          // Show preview panel and enable download
          previewColumn.style.display = 'flex';
          downloadBtn.disabled = false;

          // Restore button state
          compressBtn.disabled = false;
          compressBtn.textContent = oldText;
        }, 'image/webp', quality);
      };
      img.onerror = function() {
        alert('Error loading image.');
        compressBtn.disabled = false;
        compressBtn.textContent = oldText;
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(selectedFile);
  });

  // 5. Download Trigger
  downloadBtn.addEventListener('click', () => {
    if (!compressedUrl) return;
    
    const a = document.createElement('a');
    a.href = compressedUrl;
    // Derive original filename without extension and add .webp
    const originalName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || 'image';
    a.download = `${originalName}_compressed.webp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // 6. Reset Tool
  resetBtn.addEventListener('click', resetAll);

  function resetAll() {
    selectedFile = null;
    compressedBlob = null;
    if (compressedUrl) {
      URL.revokeObjectURL(compressedUrl);
      compressedUrl = null;
    }
    
    fileInput.value = '';
    previewImg.src = '';
    
    settingsContainer.style.display = 'none';
    actionGroup.style.display = 'none';
    previewColumn.style.display = 'none';
    downloadBtn.disabled = true;
    
    qualityInput.value = '0.75';
    qualityVal.textContent = '0.75';
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
