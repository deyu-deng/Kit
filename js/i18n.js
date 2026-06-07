/* i18n.js - Internationalization & Translation Dictionary */

export const translations = {
  en: {
    // Nav & General
    'logo-name': 'Plobi-kit',
    'nav-home': 'Home',
    'nav-cheatsheet': 'Cheat Sheet',
    'nav-about': 'About Us',
    'nav-guides': 'Guides',
    'back-grid': 'Back to Toolbox',
    'lang-btn': 'CN',
    'copy-success': 'Copied to clipboard!',

    // Dashboard Cards
    'card-base64-title': 'Base64 Encoder/Decoder',
    'card-base64-desc': 'Easily encode or decode text strings to and from Base64 format instantly.',
    'card-glass-title': 'Glassmorphism CSS Generator',
    'card-glass-desc': 'Generate beautiful CSS glassmorphism effects with real-time preview and copyable code.',
    'card-qr-title': 'QR Code Generator',
    'card-qr-desc': 'Generate custom QR codes for any URL or text instantly and download as PNG.',
    'card-palette-title': 'Color Palette Generator',
    'card-palette-desc': 'Create harmonious color palettes dynamically and copy Hex codes in one click.',
    'card-regex-title': 'Regex Tester',
    'card-regex-desc': 'Test your regular expressions in real-time with visual match highlighting.',
    'card-git-title': 'Git Command Generator',
    'card-git-desc': 'Interactively generate advanced Git CLI scripts for undoing, branching, and stashing.',
    'card-cron-title': 'Cron Expression Visualizer',
    'card-cron-desc': 'Build and test cron schedule expressions interactively with readable descriptions.',
    'card-image-title': 'WebP Image Compressor',
    'card-image-desc': 'Compress images locally in your browser and convert them safely to WebP format.',

    // Tool: Base64
    'b64-title': 'Base64 Encoder / Decoder',
    'b64-desc': 'Convert text strings to Base64 standard ASCII formatting or reverse decode them back.',
    'b64-mode': 'Operation Mode',
    'b64-btn-encode': 'Encode Text (编码)',
    'b64-btn-decode': 'Decode Text (解码)',
    'b64-lbl-input': 'Input Text String',
    'b64-lbl-output': 'Processed Result Output',
    'b64-input-placeholder': 'Type or paste plain text here to encode, or base64 text to decode...',
    'b64-output-placeholder': 'Result output will be computed here automatically...',
    'b64-copy': 'Copy Output',
    'b64-clear': 'Clear Input',

    // Tool: Glassmorphism
    'glass-title': 'CSS Glassmorphism Generator',
    'glass-desc': 'Tweak sliders to visual perfection and copy CSS styles to implement premium glass effects.',
    'glass-opacity': 'Background Opacity',
    'glass-blur': 'Backdrop Blur Radius',
    'glass-radius': 'Border Corner Radius',
    'glass-border': 'Border Transparency',
    'glass-color': 'Solid Base Tint',
    'glass-lbl-css': 'Generated CSS Declarations',
    'glass-copy': 'Copy CSS Styles',
    'glass-tailwind': 'Tailwind CSS Classes',
    'glass-copy-tailwind': 'Copy Tailwind Classes',
    'glass-preview-text': 'Glass Effect Preview',

    // Tool: QR Code
    'qr-title': 'QR Code Maker',
    'qr-desc': 'Enter standard URL pathways or text segments to render downloadable QR matrices.',
    'qr-lbl-input': 'Target Link / Text Segment',
    'qr-placeholder': 'https://example.com or any text segment...',
    'qr-ph-text': 'Enter text or URL above to automatically generate a QR Code.',
    'qr-download': 'Download QR Code (PNG)',
    'qr-clear': 'Clear Text',

    // Tool: Color Palette
    'palette-title': 'Harmony Color Palette Generator',
    'palette-desc': 'Generate a set of 5 matching accent colors based on algorithmic HSL color spacing.',
    'palette-generate': 'Generate New Random Palette',
    'palette-copy-all': 'Copy Palette Hex Values',
    'palette-copy-one': 'Color code copied: ',

    // Tool: Regex
    'regex-title': 'Real-time Regular Expression Tester',
    'regex-desc': 'Validate matching rules for patterns. Matched text highlights yellow instantly.',
    'regex-lbl-pattern': 'Regex Standard Pattern (without leading/trailing slashes)',
    'regex-lbl-text': 'Text Area for Testing Matches',
    'regex-placeholder': 'Enter your search string or paragraph contents here...',
    'regex-lbl-summary': 'Match Execution Log',
    'regex-no-match': 'No matches found in target text.',
    'regex-match-info': 'Found {count} match(es) in the test text.',

    // Tool: Git
    'git-title': 'Git Command Generator',
    'git-desc': 'Interactively generate advanced Git CLI scripts for undoing, branching, and stashing.',
    'git-copy': 'Copy Command',
    'git-copied': 'Command copied to clipboard!',

    // Tool: Cron
    'cron-title': 'Cron Expression Visualizer',
    'cron-desc': 'Build and test cron schedule expressions interactively with readable descriptions.',
    'cron-copy': 'Copy Cron Expression',
    'cron-copied': 'Expression copied to clipboard!',

    // Tool: Image Compressor
    'image-title': 'WebP Image Compressor',
    'image-desc': 'Compress images locally in your browser and convert them safely to WebP format.',
    'image-quality': 'Compression Quality',
    'image-dropzone-text': 'Drag & Drop Image or Click to Select',
    'image-upload-desc': 'Supports PNG, JPEG, WEBP formats up to 10MB',
    'image-compress-btn': 'Compress & Convert to WebP',
    'image-reset-btn': 'Reset',
    'image-preview-lbl': 'Compressed Image Preview',
    'image-orig-size-lbl': 'Original Size:',
    'image-comp-size-lbl': 'Compressed Size:',
    'image-ratio-lbl': 'Size Reduction:',
    'image-download-btn': 'Download WebP Image',

    // Cheatsheet Page
    'cs-title': 'Developer & Designer Reference Guides',
    'cs-desc': 'Bilingual, clean quick-reference tables summarizing syntax, shortcuts, and utility declarations.',
    'cs-md-title': 'Markdown Quick Reference Syntax',
    'cs-regex-title': 'Regular Expression Matching Patterns',
    'cs-css-title': 'CSS Grid & Flexbox Quick Alignments',
    'th-element': 'Document Element',
    'th-syntax': 'Markdown Format',
    'th-example': 'Visual Result',
    'th-regex-char': 'Special Regex Character',
    'th-regex-desc': 'Operational Matching Definition',
    'th-regex-pattern': 'Pattern Matching Example',
    'th-css-prop': 'CSS Layout Property',
    'th-css-desc': 'Structural Design Layout Role',
    'th-css-code': 'Common Values list',

    // About Page
    'about-title': 'About Plobi-kit',
    'about-desc': 'Learn more about Plobi-kit\'s development goals, tool security, and design philosophy.',

    // Guides (SEO Rich Text)
    'guide-base64': `
      <p>Base64 is a binary-to-text encoding scheme that represents binary data in an ASCII string format. It is commonly used when there is a need to encode binary data that needs to be stored and transferred over media designed to handle textual data.</p>
      <h4>Why Use Base64 Encoding?</h4>
      <ul>
        <li><strong>Data Integrity</strong>: Ensures that data remains intact without modification during transport through text-only mediums (like emails or HTML elements).</li>
        <li><strong>Embedded Assets</strong>: Allows developers to embed small images or font files directly inside CSS stylesheets or HTML documents to reduce HTTP requests.</li>
      </ul>
      <h4>Frequently Asked Questions (FAQ)</h4>
      <p><strong>Q: Why does Base64 encoding increase file size by 33%?</strong><br>A: Base64 maps every 3 bytes (24 bits) of raw binary data into 4 ASCII characters (4 bytes of 6 bits each). Because 4 bytes are used to represent 3 bytes of original data, the data size increases by exactly 33.33%.</p>
      <p><strong>Q: Is Base64 encoding secure for passwords or private data?</strong><br>A: No. Base64 is an encoding format, not an encryption method. Anyone can easily decode a Base64 string back to its original format instantly without a password. Do not use Base64 to secure sensitive credentials.</p>
      <p><strong>Q: How does Base64 handle Unicode and special characters?</strong><br>A: Standard JavaScript <code>btoa()</code> only supports binary strings (each character representing 1 byte, values 0-255). To encode Unicode characters (such as Chinese or Emojis), our tool first URI-encodes the string, converts the percent-encodings back into binary characters, and then performs Base64 conversion. This guarantees full Unicode safety.</p>
      <p><strong>Q: When should I embed Base64 assets in HTML or CSS?</strong><br>A: Embedding is ideal for very small icons or fonts (under 10KB) to eliminate the round-trip latency of additional HTTP requests. However, avoid embedding large images as they prevent parallel loading and increase style parsing times.</p>
      <h4>How Does This Tool Work?</h4>
      <p>This tool runs entirely in your web browser. No text data is sent to external web servers, guaranteeing complete privacy and offline utility capability.</p>
    `,
    'guide-glassmorphism': `
      <p>Glassmorphism is a popular user interface design trend characterized by translucent glass-like panels, vibrant background colors, and delicate outer borders.</p>
      <h4>Core CSS Attributes Explained:</h4>
      <ul>
        <li><code>backdrop-filter: blur(Xpx)</code>: This is the vital property that blurs everything behind the glass element, creating the frosted overlay illusion.</li>
        <li><code>background: rgba(r, g, b, alpha)</code>: Setting a semi-transparent background color (usually white or light grey) allows the page colors to blend with the card.</li>
        <li><code>border: 1px solid rgba(...)</code>: Adding a thin border with low opacity helps define the sharp edges of the virtual glass sheet.</li>
      </ul>
      <h4>Frequently Asked Questions (FAQ)</h4>
      <p><strong>Q: What is backdrop-filter in CSS?</strong><br>A: The <code>backdrop-filter</code> CSS property applies graphical effects (like blur or color shifting) to the area behind an element. Unlike <code>filter</code>, which blurs the element itself, backdrop-filter only blurs what lies directly behind the element's container.</p>
      <p><strong>Q: How do I implement Glassmorphism in Tailwind CSS?</strong><br>A: You can combine utility classes such as <code>bg-white/20 backdrop-blur-md border border-white/10</code>. To generate precise layouts with customized color and opacity ranges, utilize our Tailwind copy function which generates arbitrary values in brackets (e.g. <code>bg-[rgba(...)] backdrop-blur-[Xpx]</code>).</p>
      <p><strong>Q: Does backdrop-filter affect page rendering performance?</strong><br>A: Yes. Because <code>backdrop-filter</code> requires the browser to capture the layout background and apply a real-time blur effect, applying it to too many overlapping elements can reduce the frame rate (FPS) during page scrolls, especially on mobile devices. Use it sparingly on critical layout cards.</p>
      <p><strong>Q: How do I configure a graceful fallback for older browsers?</strong><br>A: To support legacy browsers that do not support <code>backdrop-filter</code>, you should define a solid fallback background color or a slightly higher opacity background, or wrap the glass styles inside a CSS media query like <code>@supports (backdrop-filter: blur(1px)) { ... }</code>.</p>
    `,
    'guide-qrcode': `
      <p>A Quick Response (QR) code is a type of matrix barcode containing embedded binary info. It is widely used for scanning links, digital payments, and document indexing.</p>
      <h4>Best Practices for QR Generation:</h4>
      <ul>
        <li><strong>Keep URLs Short</strong>: Shorter text segments create less dense QR square grids, making them significantly easier and faster for mobile cameras to scan.</li>
        <li><strong>High Contrast</strong>: Ensure your output keeps a high color contrast relative to the background paper or display panel. Black-on-white remains the gold standard.</li>
      </ul>
      <h4>Frequently Asked Questions (FAQ)</h4>
      <p><strong>Q: Are online QR generators safe?</strong><br>A: Most online generators send your text to their servers, posing privacy risks for proprietary links. Our tool generates QR codes 100% locally on your computer's HTML5 Canvas, ensuring no data ever leaves your device.</p>
      <p><strong>Q: What is QR Code error correction?</strong><br>A: Error correction allows a QR code to remain readable even if part of it is dirty, damaged, or obscured. It has four levels (L, M, Q, H), allowing recovery of up to 30% of lost data. Our tool uses Level M (15% recovery) to balance readability and scanner speed.</p>
      <p><strong>Q: What is the difference between a Static and Dynamic QR Code?</strong><br>A: Static QR codes store the actual target data directly inside the matrix (making the pattern denser with more characters). Dynamic QR codes store a short redirect link pointing to a server, which tracks analytics and allows changing the destination URL without changing the printed QR image.</p>
      <p><strong>Q: What is the maximum character limit for a static QR Code?</strong><br>A: Static QR codes can support up to 4,296 alphanumeric characters. However, scanning readability degrades heavily beyond 150-200 characters on standard phone cameras. Keep text segments brief for optimal user access.</p>
    `,
    'guide-colorpalette': `
      <p>Color theory suggests that harmonious color schemes create visual stability. This tool uses algorithmic HSL spacing to generate consistent 5-color palettes.</p>
      <h4>How Palettes are Structured:</h4>
      <p>When you click generate, the algorithm picks a random base hue, and computes adjacent colors using complementary, triadic, or split-analogous offsets. This yields UI-ready accent arrays with uniform saturation and lightness profiles.</p>
      <h4>Frequently Asked Questions (FAQ)</h4>
      <p><strong>Q: What is the 60-30-10 rule in UI design?</strong><br>A: It is a classic design rule stating that 60% of your interface should be a dominant color (usually background/white), 30% a secondary structure color (text/cards), and 10% an accent color (buttons/links) to guide user focus.</p>
      <p><strong>Q: Why use HSL color codes instead of HEX for generating palettes?</strong><br>A: HSL (Hue, Saturation, Lightness) represents color in a circular format (0-360 degrees). This makes mathematical color spacing (such as finding a complementary color 180 degrees opposite) extremely clean compared to hexadecimal manipulations.</p>
      <p><strong>Q: How do I ensure my generated color palette is WCAG accessible?</strong><br>A: Always verify that the contrast ratio between text elements and backgrounds meets the Web Content Accessibility Guidelines (WCAG). Aim for at least 4.5:1 for body copy and 3:1 for large headers or UI buttons.</p>
      <p><strong>Q: What is the difference between analogous and complementary color schemes?</strong><br>A: Analogous schemes use colors adjacent on the 360-degree color wheel (e.g. offsets of 30°), producing smooth, low-contrast palettes. Complementary schemes use colors opposite on the wheel (180° offsets), providing high visual contrast and vibrant accents.</p>
    `,
    'guide-regex': `
      <p>Regular expressions (often shortened to Regex) are text patterns used to perform advanced search, replace, and validation routines inside large document strings.</p>
      <h4>Regex Flag Properties:</h4>
      <ul>
        <li><code>g</code> (global): Finds all matches throughout the text, rather than stopping after the first instance.</li>
        <li><code>i</code> (case-insensitive): Ignores case differences (matches both "A" and "a" for a pattern).</li>
        <li><code>m</code> (multi-line): Matches patterns at the start and end of individual lines, not just the entire file string.</li>
      </ul>
      <h4>Frequently Asked Questions (FAQ)</h4>
      <p><strong>Q: How do I test Regex for emails?</strong><br>A: A standard regex pattern for basic email validation is <code>^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$</code>, which matches username patterns, domain structures, and valid top-level domain extensions.</p>
      <p><strong>Q: What is the difference between global and non-global Regex matching?</strong><br>A: A non-global match stops executing after finding the first instance of a matching pattern. A global match (using the <code>g</code> flag) continues scanning and highlights all matching patterns throughout the entire text payload.</p>
      <p><strong>Q: What are lookaround assertions in Regex?</strong><br>A: Lookaround assertions (lookahead <code>(?=...)</code> and lookbehind <code>(?<=...)</code>) let you match patterns only when they are followed or preceded by another pattern without including that surrounding text in the actual matched match group.</p>
      <p><strong>Q: What is a ReDoS (Regular Expression Denial of Service) attack?</strong><br>A: When a regex contains overlapping nested quantifiers (e.g. <code>(a+)+</code>), evaluating it against matching strings can cause exponential backtracking, freezing the rendering thread. Because our tool runs 100% locally in your browser, any script freeze is contained within your own sandbox, keeping our static hosting server fully secure.</p>
    `,
    'guide-git': `
      <p>Git is a distributed version control system. This interactive helper lets you generate common Git commands without memorizing complex syntax.</p>
      <h4>Git Best Practices</h4>
      <ul>
        <li><strong>Commit Often</strong>: Make small, single-purpose commits to keep your project history clean.</li>
        <li><strong>Never Commit Secrets</strong>: Avoid staging API keys or configuration passwords. Use environment variables.</li>
      </ul>
      <h4>Frequently Asked Questions (FAQ)</h4>
      <p><strong>Q: What is the difference between soft and hard reset?</strong><br>A: A soft reset (<code>git reset --soft HEAD~1</code>) undoes the commit but keeps your file changes staged in the working directory. A hard reset (<code>git reset --hard HEAD~1</code>) discards the commit AND permanently deletes all changes in your files.</p>
      <p><strong>Q: How do I recover a deleted branch?</strong><br>A: You can use <code>git reflog</code> to find the commit hash where the branch was, then run <code>git checkout -b branch-name commit-hash</code> to restore it.</p>
    `,
    'guide-cron': `
      <p>Cron expressions are string templates representing time intervals used to schedule recurring jobs in Linux and Unix environments.</p>
      <h4>Cron Syntax Breakdown</h4>
      <p>A standard cron expression consists of 5 fields: minute, hour, day-of-month, month, and day-of-week. Special characters like <code>*</code> (all values), <code>/</code> (intervals), and <code>-</code> (ranges) add flexibility.</p>
      <h4>Frequently Asked Questions (FAQ)</h4>
      <p><strong>Q: What does */5 in the minute field mean?</strong><br>A: It means "every 5 minutes". It runs the job whenever the current minute value is divisible by 5 (e.g., 0, 5, 10, etc.).</p>
      <p><strong>Q: How do I schedule a job to run only on weekdays?</strong><br>A: In the day-of-week (fifth) field, set it to <code>1-5</code> (Monday through Friday).</p>
    `,
    'guide-image': `
      <p>This image compressor uses the HTML5 Canvas API in your browser. All compression is performed entirely on your computer, meaning your design assets never touch a server.</p>
      <h4>Why Convert to WebP?</h4>
      <ul>
        <li><strong>Superior Compression</strong>: WebP images are typically 25-35% smaller in file size compared to PNG or JPEG at similar quality.</li>
        <li><strong>Transparency Support</strong>: Like PNG, WebP supports alpha channel transparency, making it ideal for web UI designs.</li>
      </ul>
      <h4>Frequently Asked Questions (FAQ)</h4>
      <p><strong>Q: Is my uploaded image private?</strong><br>A: Yes. Because this tool runs 100% client-side via JavaScript, your original image is read into browser memory and processed locally. No data is uploaded to any server.</p>
      <p><strong>Q: What compression quality should I choose?</strong><br>A: A quality value of <code>0.75</code> to <code>0.80</code> is generally the sweet spot for web usage, offering significant file size reductions (often over 70%) with virtually no human-visible quality loss.</p>
    `,
    'b64-error-encode': 'Error encoding text.',
    'b64-error-decode': 'Error decoding text. Invalid Base64 format.',
    'palette-copied-single': 'Color {color} copied!',
    'palette-copied-all': 'All Hex codes copied: {colors}',
    'regex-no-pattern': 'No pattern or text entered.',
    'regex-matches-found': '<strong>Success:</strong> Found {count} match(es).',
    'regex-no-matches': 'No matches found.',
    'regex-error': '<strong>Regex Error:</strong> {message}',
    'qr-cdn-failed-title': 'CDN load failed.',
    'qr-cdn-failed-sub': 'Please check internet connection.',
    'glass-copied-css': 'CSS copied to clipboard!',
    'glass-copied-tailwind': 'Tailwind classes copied!'
  },
  cn: {
    // Nav & General
    'logo-name': 'Plobi-kit',
    'nav-home': '工具首页',
    'nav-cheatsheet': '开发速查表',
    'nav-about': '关于我们',
    'nav-guides': '技术教程',
    'back-grid': '返回工具列表',
    'lang-btn': 'EN',
    'copy-success': '已成功复制到剪贴板！',

    // Dashboard Cards
    'card-base64-title': 'Base64 编码/解码器',
    'card-base64-desc': '即时地将普通文本编码为 Base64，或反向解码为常规字符串。',
    'card-glass-title': 'CSS 毛玻璃效果生成器',
    'card-glass-desc': '在线调整毛玻璃参数，实时预览并快速获取跨浏览器兼容的 CSS 代码。',
    'card-qr-title': '二维码在线生成器',
    'card-qr-desc': '输入任意网址或文本，瞬间生成专属二维码，支持高清 PNG 格式下载。',
    'card-palette-title': '随机配色方案生成器',
    'card-palette-desc': '基于 HSL 色彩空间算法，一键生成和谐一致的前端与 UI 设计配色卡。',
    'card-regex-title': '正则表达式测试器',
    'card-regex-desc': '在浏览器中实时测试您的正则表达式，高亮匹配结果，展示匹配日志。',
    'card-git-title': 'Git 常用命令交互生成器',
    'card-git-desc': '通过操作交互，自动拼装输出诸如“撤销提交”、“分支管理”等常见 Git CLI 脚本。',
    'card-cron-title': 'Cron 定时表达式生成器',
    'card-cron-desc': '在线配置 Cron 表达式并实时校验，翻译为直观的中文运行计划描述。',
    'card-image-title': 'WebP 图片本地压缩器',
    'card-image-desc': '纯本地浏览器端处理，无需上传服务器，高效压缩图片并转换为 WebP 格式。',

    // Tool: Base64
    'b64-title': 'Base64 编码 / 解码器',
    'b64-desc': '将任意字符串安全地转换为符合 Base64 规范的 ASCII 编码，或进行反向恢复。',
    'b64-mode': '运行模式',
    'b64-btn-encode': '进行编码 (Encode)',
    'b64-btn-decode': '进行解码 (Decode)',
    'b64-lbl-input': '输入文本内容',
    'b64-lbl-output': '转换结果输出',
    'b64-input-placeholder': '在这里输入或粘贴你想转换的内容（编码输入普通文本，解码输入Base64）...',
    'b64-output-placeholder': '转换后的结果将会实时在此处计算展示...',
    'b64-copy': '复制输出结果',
    'b64-clear': '清空输入',

    // Tool: Glassmorphism
    'glass-title': 'CSS 毛玻璃生成器',
    'glass-desc': '拖动滑块调校出理想的磨砂玻璃视觉体验，并一键获取标准化 CSS 声明代码。',
    'glass-opacity': '背景透明度',
    'glass-blur': '背景模糊半径 (Blur)',
    'glass-radius': '圆角半径 (Radius)',
    'glass-border': '边框不透明度',
    'glass-color': '底层混色色卡',
    'glass-lbl-css': '生成的目标 CSS 样式代码',
    'glass-copy': '复制代码样式',
    'glass-tailwind': 'Tailwind CSS 实用类名',
    'glass-copy-tailwind': '复制 Tailwind 类名',
    'glass-preview-text': '毛玻璃实感预览',

    // Tool: QR Code
    'qr-title': '二维码生成器',
    'qr-desc': '输入网址链接、邮件地址或简单文本段落，自动渲染出高精度的二维码图像。',
    'qr-lbl-input': '二维码目标网址/文本',
    'qr-placeholder': '请输入例如 https://example.com 或其他任意文本内容...',
    'qr-ph-text': '在上方输入文本或 URL 后，系统将在此处为您自动生成二维码。',
    'qr-download': '下载二维码 (PNG)',
    'qr-clear': '清空文本',

    // Tool: Color Palette
    'palette-title': '和谐配色方案生成器',
    'palette-desc': '通过算法计算互补色和邻近色，一键生成极具艺术美感的 5 色 UI 调色板。',
    'palette-generate': '生成全新配色卡',
    'palette-copy-all': '复制整组 Hex 颜色码',
    'palette-copy-one': '已复制单色：',

    // Tool: Regex
    'regex-title': '正则表达式实时测试',
    'regex-desc': '在线对正则规则进行匹配校验。匹配成功的文本将在输入区实时黄色高亮。',
    'regex-lbl-pattern': '正则表达式规则 (无需输入前后的斜杠)',
    'regex-lbl-text': '待测试的匹配文本段落',
    'regex-placeholder': '在此处输入您想要搜索、匹配或过滤的测试文本内容...',
    'regex-lbl-summary': '正则运行匹配日志',
    'regex-no-match': '在目标文本中未找到符合规则的匹配项。',
    'regex-match-info': '在测试文本中共成功匹配出 {count} 个结果。',

    // Tool: Git
    'git-title': 'Git 常用命令交互生成器',
    'git-desc': '通过操作交互，自动拼装输出诸如“撤销提交”、“分支管理”等常见 Git CLI 脚本。',
    'git-copy': '复制 Git 命令',
    'git-copied': '命令已成功复制到剪贴板！',

    // Tool: Cron
    'cron-title': 'Cron 定时表达式生成器',
    'cron-desc': '在线配置 Cron 表达式并实时校验，翻译为直观的中文运行计划描述。',
    'cron-copy': '复制 Cron 表达式',
    'cron-copied': '表达式已成功复制到剪贴板！',

    // Tool: Image Compressor
    'image-title': 'WebP 图片本地压缩/转换器',
    'image-desc': '纯本地浏览器端处理，无需上传服务器，高效压缩图片并转换为 WebP 格式。',
    'image-quality': '压缩质量 (Quality)',
    'image-dropzone-text': '将图片拖放到此处或点击选择文件',
    'image-upload-desc': '支持 PNG, JPEG, WEBP 格式，最大 10MB',
    'image-compress-btn': '开始压缩并转换为 WebP',
    'image-reset-btn': '重置',
    'image-preview-lbl': '压缩后图片预览',
    'image-orig-size-lbl': '原始文件大小:',
    'image-comp-size-lbl': '压缩后大小:',
    'image-ratio-lbl': '体积减少比例:',
    'image-download-btn': '下载 WebP 图片',

    // Cheatsheet Page
    'cs-title': '开发者与设计师速查表',
    'cs-desc': '中英双语的快速开发参考卡，包含 Markdown 标准语法、常用正则表达式以及 CSS 布局属性速查。',
    'cs-md-title': 'Markdown 常用语法速查',
    'cs-regex-title': '正则表达式常用匹配元字符',
    'cs-css-title': 'CSS Grid 和 Flexbox 属性对照',
    'th-element': '文档元素',
    'th-syntax': 'Markdown 语法书写',
    'th-example': '视觉展示效果',
    'th-regex-char': '正则元字符',
    'th-regex-desc': '匹配功能与含义定义',
    'th-regex-pattern': '匹配实例参考',
    'th-css-prop': 'CSS 布局属性名',
    'th-css-desc': '布局模型中的功能描述',
    'th-css-code': '常用可选属性取值',

    // About Page
    'about-title': '关于 Plobi-kit',
    'about-desc': '了解 Plobi-kit 工具箱在数据隐私、SEO 优化和广告合规等方面的设计初衷。',

    // Guides (SEO Rich Text)
    'guide-base64': `
      <p>Base64 是一种将二进制数据转换为 ASCII 字符集的编码方案。它通常被用于在不支持处理二进制数据的纯文本媒介（如 HTML、XML、电子邮件等）上传输媒体数据。</p>
      <h4>为什么要使用 Base64 编码？</h4>
      <ul>
        <li><strong>保障数据完整性</strong>: 避免二进制媒体文件在经过文本协议传输时因编码转义导致数据损坏。</li>
        <li><strong>内嵌媒体资源</strong>: 网页开发者经常将较小的图标或小字体文件转换为 Base64 直接写进 CSS 代码中，借此减少页面的 HTTP 连接请求次数。</li>
      </ul>
      <h4>常见问题解答 (FAQ)</h4>
      <p><strong>问：为什么 Base64 编码后文件体积会增加 33%？</strong><br>答：Base64 编码将每 3 个字节（24 位）的原始二进制数据拆分为 4 个 6 位的字符组，然后查表映射为 4 个 ASCII 字符（4 字节）。因为用了 4 个字节来表示原先的 3 个字节，所以最终数据体积会精确膨胀 33.33%。</p>
      <p><strong>问：Base64 编码可以用于密码等敏感数据加密吗？</strong><br>答：<strong>绝对不能。</strong> Base64 只是公开的二进制转文本编码机制，不具备任何密钥约束，任何人都可以瞬间将其反向解码。它只是一种传输协议，不具备任何安全保密性质。</p>
      <p><strong>问：该工具如何保证中文字符等多字节 Unicode 的安全编码？</strong><br>答：原生 JavaScript 提供的 <code>btoa()</code> 仅支持二进制字符串（即每个字符的值为 0-255，占 1 个字节）。为了防止在编码中文、日文或 Emoji 时产生报错或乱码，本工具会先通过 <code>encodeURIComponent</code> 进行统一的 UTF-8 转义，将其转换为安全的 ASCII 序列后再执行编码，确保 100% 字符兼容。</p>
      <p><strong>问：什么时候最适合将图片资源转换为 Base64 嵌入网页？</strong><br>答：当图片或字体体积非常小（建议 10KB 以下，如细小的 SVG 图标、占位图）时，内嵌能够省去一次浏览器 HTTP 请求。对于大体积图片，内嵌会导致 HTML 膨胀，影响页面首屏并行加载和样式渲染效率。</p>
      <h4>隐私保护保障：</h4>
      <p>本工具所有编码与解码计算完全在您的客户端浏览器中运行。绝不会将任何文本数据上传至外部服务器，完全保障您的输入隐私，并支持离线使用。</p>
    `,
    'guide-glassmorphism': `
      <p>毛玻璃（Glassmorphism）是近年来极为流行的 UI 视觉风格，它模拟了半透明玻璃在有彩背景上的磨砂半透和高光边界，营造出强烈的界面空间感和高级质感。</p>
      <h4>核心 CSS 属性解析：</h4>
      <ul>
        <li><code>backdrop-filter: blur(Xpx)</code>: 磨砂玻璃效果的灵魂属性。它负责对当前元素背后的背景图层实施高斯模糊。</li>
        <li><code>background: rgba(r, g, b, alpha)</code>: 设置低饱和半透明背景（如低透明白），让后面的底色能稍微渗透，呈现融合感。</li>
        <li><code>border: 1px solid rgba(...)</code>: 给卡片添加边缘高光细线，让模拟出来的玻璃卡片边缘清晰、具有三维立体感。</li>
      </ul>
      <h4>常见问题解答 (FAQ)</h4>
      <p><strong>问：CSS 中的 backdrop-filter 与 filter 有什么区别？</strong><br>答：<code>filter</code> 作用于元素本身及所有子元素（会导致内容和文字被连带模糊）；而 <code>backdrop-filter</code> 只作用于当前元素容器背后的背景层，卡片之上的文字、图标和交互按钮能够始终保持清晰可见。</p>
      <p><strong>问：如何在 Tailwind CSS 中编写毛玻璃效果？</strong><br>答：您可以组合使用 Tailwind 提供的实用类，例如 <code>bg-white/20 backdrop-blur-md border border-white/10</code>。如果您需要根据色轮动态调配非常精准的颜色与透明度，可以使用本工具的一键复制 Tailwind 功能，我们将输出使用方括号封装的任意值语法（如 <code>bg-[rgba(...)] backdrop-blur-[Xpx]</code>）。</p>
      <p><strong>问：过多使用 backdrop-filter 会影响网站运行性能吗？</strong><br>答：是的。因为磨砂模糊需要浏览器 GPU 在重绘时实时抓取背后图层像素并运行高斯模糊算法，如果在页面中同时堆叠大量毛玻璃卡片，特别是在手机等移动端设备上滑动，可能会导致帧率（FPS）下降。建议在主要的容器卡片上克制、零星地使用。</p>
      <p><strong>问：如何为不支持 backdrop-filter 的老旧浏览器进行优雅降级？</strong><br>答：可以在 CSS 中通过媒体查询 <code>@supports not (backdrop-filter: blur(1px))</code> 进行优雅降级，当检测到浏览器不支持此属性时，自动应用不透明度稍高（如 0.85）的纯色背景色，避免边框和背景彻底融为一体。</p>
    `,
    'guide-qrcode': `
      <p>二维码（Quick Response Code）是一种矩阵式的条形码。它使用特定的二维几何图形记录数据符号，被广泛应用于网址跳转、数字支付和应用分发。</p>
      <h4>高效二维码生成要点：</h4>
      <ul>
        <li><strong>尽量精简网址</strong>: 输入的字符越少，二维码生成的黑白矩阵越稀疏，手机相机的识别与对焦速度就越快。</li>
        <li><strong>色彩高对比度</strong>: 确保二维码的前景（通常是黑色）与背景（白色）有足够鲜明的明暗差距。</li>
      </ul>
      <h4>常见问题解答 (FAQ)</h4>
      <p><strong>问：在线二维码生成器是否安全？网上的免费生成器会泄漏我的链接吗？</strong><br>答：大多数公共二维码生成器会将您输入的文本/网址先传输到他们后端的云服务器进行渲染，从而产生内部敏感测试链接或敏感信息外泄的安全隐患。而本站的生成器采用 100% 浏览器本地端 Canvas 实时渲染，没有任何向外的数据请求，确保绝对的隐私安全。</p>
      <p><strong>问：什么是二维码的容错率（Error Correction）？</strong><br>答：容错率允许二维码即使在污损、部分缺失或光照反射被遮挡 7% 至 30% 时依然能够被相机完美识别。它分为 L (7%)、M (15%)、Q (25%)、H (30%) 四个级别。本站采用 M 级别，兼顾了精简的网格密度与扫码设备识别成功率。</p>
      <p><strong>问：静态二维码和动态二维码有何区别？</strong><br>答：静态二维码直接将输入的数据本身进行二进制编码并锁定在点阵中（字数越多，二维码网格越密集难扫）；动态二维码则是将一个指向服务器中转的短链接（Short URL）编码进二维码中，不仅二维码十分稀疏易扫，而且可以随时在后台修改跳转网址并追踪扫码统计。</p>
      <p><strong>问：静态二维码能容纳的最长文本限制是多少？</strong><br>答：静态二维码最大支持 4296 个字符或 7089 个纯数字。但是在实际操作中，当字符超过 150-200 个时，图案点阵会变得异常密集，主流的手机摄像头极其容易因为分辨率不足而扫码失败。因此建议尽量缩短输入文本。</p>
    `,
    'guide-colorpalette': `
      <p>色彩心理学和设计原则表明，和谐的调色板能奠定网站的高端质感。本工具利用数学算法在 HSL 色环上做等角取样，为您创建自然且富有节奏感的色卡。</p>
      <h4>色彩生成原理：</h4>
      <p>当您点击生成时，代码通过随机选取起始色相（Hue），并锁定舒适的饱和度（Saturation）与亮度（Lightness），再根据互补、邻近或三分色原理推算相邻色卡，从而得到能够完美搭配的主色与辅助色。</p>
      <h4>常见问题解答 (FAQ)</h4>
      <p><strong>问：什么是界面 UI 设计中的 60-30-10 配色法则？</strong><br>答：这是一条经典的经典设计比例规律：将 60% 的面积（如底板、大背景）设为低饱和主底色（多为白色或浅灰），30% 的面积（如文字、边框、结构性组件）设为深灰色调，剩下的 10% 的面积（如点击按钮、焦点引导、高亮）则从生成的和谐调色板中挑选一个亮色作为点缀，极利于引导用户视觉焦点。</p>
      <p><strong>问：为什么网页配色通常用 HSL，而不是常用的 HEX 十六进制代码来做算法计算？</strong><br>答：HEX 十六进制将三原色（红绿蓝）杂糅在一起，难以通过数学运算直观控制颜色关系。而 HSL 是圆柱色彩空间模型（色相、饱和度、亮度），色相（Hue）呈 0-360 度圆环排列。我们要找它的对比色，只需要简单加减 180 度即可得到，这使得配色方案的推导算法变得极为精准和高效率。</p>
      <p><strong>问：如何保障配色方案符合无障碍访问规范（WCAG）？</strong><br>答：为保证视力障碍人群能清晰阅读，网页文字与背景的对比度需满足 WCAG 标准。普通正文字体与背景的对比比率（Contrast Ratio）应至少达到 4.5:1，大号字或按钮文本应至少达到 3:1。请尽量避免在白色背景上放置亮黄、浅绿等文字。</p>
      <p><strong>问：互补色配色与邻近色配色在视觉传达上有什么不同？</strong><br>答：邻近色（色环相距 30°~60°）配色和谐、柔和，能带来极佳的秩序感与宁静感；互补色（色相相距 180°）对比强烈、视觉冲击力巨大，能带来极高的关注度与动感，常用于核心呼吁行动（CTA）按钮。</p>
    `,
    'guide-regex': `
      <p>正则表达式（Regular Expression，简称 Regex）是一种用于在长文本段落中进行精确搜索、校验和替换文本内容的强大语法工具。</p>
      <h4>常用正则修饰符 (Flags) 说明：</h4>
      <ul>
        <li><code>g</code> (全局匹配): 寻找整篇文档中的所有匹配项，不至于在找到第一个匹配后就立即退出。</li>
        <li><code>i</code> (不区分大小写): 忽略字母的大小写差异（例如正则表达式 <code>[a-z]</code> 可以匹配大写 <code>A</code>）。</li>
        <li><code>m</code> (多行匹配): 配合 <code>^</code> 或 <code>$</code> 来对段落中的每一行开头 and 结尾进行判定，而非仅匹配整篇文本首尾。</li>
      </ul>
      <h4>常见问题解答 (FAQ)</h4>
      <p><strong>问：邮箱校验常用的正则表达式应该怎么写？</strong><br>答：最常用且兼容大部分 RFC 标准的电子邮箱正则匹配规则是：<code>^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$</code>。它主要校验了用户名包含合规特殊字符、存在 @ 符号、域名后缀合法且长度在 2 位以上等核心约束。</p>
      <p><strong>问：全局匹配修饰符 g 对结果校验有何影响？</strong><br>答：如果未加全局修饰符 <code>g</code>，正则引擎会在文本中捕获到第一个符合的实例后立即停滞并返回匹配成功。加上修饰符 <code>g</code> 后，引擎会继续扫描全部文本，直到字符串结束，这在本工具中是实现多处匹配同时高亮的根基。</p>
      <p><strong>问：正则表达式中的“断言（Lookaround）”是什么意思？</strong><br>答：断言包括正向先行断言 <code>(?=...)</code> 和反向后行断言 <code>(?<=...)</code>，它用于校验目标匹配前面或后面是否符合特定文本规则，但在匹配出的结果集本身中<strong>不包含</strong>断言条件内的字符，用于精细过滤。</p>
      <p><strong>问：什么是 ReDoS（正则拒绝服务攻击）？本工具会有此风险吗？</strong><br>答：如果正则表达式编写不当（例如含有嵌套重复的模糊量词如 <code>(a+)+</code>），在解析某些精心构建的恶意字符串时，引擎会陷入指数级回溯，导致 CPU 占用率瞬间飙升至 100% 引起服务瘫痪。因为本工具是 100% 浏览器客户端本地运行，假若发生卡死只会影响用户本地标签页，不会对我们的服务器产生任何伤害，天然免疫此类服务器攻击危害。</p>
    `,
    'guide-git': `
      <p>Git 是目前最流行的分布式版本控制系统。本交互式生成器能帮助您快速组装常用的 Git 终端指令，无需死记硬背复杂的参数搭配。</p>
      <h4>Git 团队协作最佳实践</h4>
      <ul>
        <li><strong>小步快跑，频繁提交</strong>：每次提交只解决一个单一问题或功能，保持提交历史清晰可读。</li>
        <li><strong>切勿提交敏感凭证</strong>：切勿将 API 密钥、数据库密码等明文提交到代码库。应使用环境变量或配置文件进行隔离。</li>
      </ul>
      <h4>常见问题解答 (FAQ)</h4>
      <p><strong>问：git reset 中的 --soft 和 --hard 模式有什么区别？</strong><br>答：<code>--soft</code> 模式（如 <code>git reset --soft HEAD~1</code>）只撤销最近一次的 Commit 动作，但会将您编写的文件改动完整地保留在暂存区（Staging Area）中；而 <code>--hard</code> 模式则会彻底丢弃最近一次 Commit 动作以及该提交之后所有未保存的本地修改，请谨慎使用。</p>
      <p><strong>问：如果不小心删除了本地分支，还能找回吗？</strong><br>答：可以。只要未进行垃圾回收，您可以运行 <code>git reflog</code> 查看本地操作日志，找到该分支被删除前的 commit 哈希值，然后执行 <code>git checkout -b <分支名> <commit哈希></code> 即可完美恢复。</p>
    `,
    'guide-cron': `
      <p>Cron 表达式是一种在 Linux/Unix 系统及现代化服务器架构中，用来配置定时循环任务（Cron Job）的时间规范字符串。</p>
      <h4>Cron 语法格式解析</h4>
      <p>标准的 Cron 表达式由五个以空格分隔的字段构成，从左到右依次代表：分钟、小时、日期、月份、星期。可以通过 <code>*</code>（任意值）、<code>/</code>（时间间隔）和 <code>-</code>（时间范围）等特殊符号配置复杂的周期任务。</p>
      <h4>常见问题解答 (FAQ)</h4>
      <p><strong>问：分钟字段中的 */5 代表什么意思？</strong><br>答：代表“每隔 5 分钟”。系统会在分钟数为 5 的整数倍时（如 0分、5分、10分、15分 等）触发该定时任务。</p>
      <p><strong>问：如何设置定时任务仅在周一至周五的周内工作日运行？</strong><br>答：您只需要将第五个字段（星期字段）的取值配置为 <code>1-5</code>（代表周一至周五），其他日期和月份字段保持默认的 <code>*</code> 即可。</p>
    `,
    'guide-image': `
      <p>本图片压缩器完全基于您本地浏览器中的 HTML5 Canvas API 技术。所有图片压缩与格式转换工作都在您的电脑上完成，确保您的设计资产和隐私数据绝不上传服务器。</p>
      <h4>为什么要将图片转换为 WebP 格式？</h4>
      <ul>
        <li><strong>极高的压缩率</strong>：在保持几乎肉眼无法分辨的画质前提下，WebP 格式生成的图片体积通常比普通的 PNG 或 JPEG 格式要小 25% ~ 35%。</li>
        <li><strong>完美支持透明度</strong>：与 JPEG 不同，WebP 完美继承了类似 PNG 的 Alpha 透明通道特性，非常适合网页 UI 和图标素材的无缝展示。</li>
      </ul>
      <h4>常见问题解答 (FAQ)</h4>
      <p><strong>问：上传压缩的图片会被网站服务器保存吗？</strong><br>答：<strong>绝对不会。</strong> 本压缩工具基于 100% 浏览器前端 JavaScript 开发，图片会被读入本地浏览器内存，并在本地生成 WebP 导出，整个过程不需要任何网络连接，绝对保障您的商业设计隐私。</p>
      <p><strong>问：我应该选择多少的压缩质量（Quality）？</strong><br>答：对于普通网页展示，选择 <code>0.75</code> 至 <code>0.80</code> 是最理想的黄金比例，能在文件体积缩减 70% 以上的同时，保证图像画质无明显受损。</p>
    `,
    'b64-error-encode': '编码文本出错。',
    'b64-error-decode': '解码文本出错。无效的 Base64 格式。',
    'palette-copied-single': '颜色 {color} 已复制到剪贴板！',
    'palette-copied-all': '已复制整组颜色代码：{colors}',
    'regex-no-pattern': '未输入正则表达式或测试文本。',
    'regex-matches-found': '<strong>匹配成功:</strong> 共找到 {count} 处匹配。',
    'regex-no-matches': '未找到匹配项。',
    'regex-error': '<strong>正则错误:</strong> {message}',
    'qr-cdn-failed-title': 'CDN 加载失败。',
    'qr-cdn-failed-sub': '请检查网络连接。',
    'glass-copied-css': 'CSS 样式代码已复制到剪贴板！',
    'glass-copied-tailwind': 'Tailwind 实用类名已复制到剪贴板！'
  }
};

/**
 * Update elements marked with specific data attributes to target translations
 * @param {string} lang 'en' or 'cn'
 */
export function updatePageLanguage(lang) {
  const dictionary = translations[lang] || translations.en;
  
  // Set elements by ID
  const mappings = {
    'txt-logo-name': 'logo-name',
    'nav-home': 'nav-home',
    'nav-cheatsheet': 'nav-cheatsheet',
    'nav-about': 'nav-about',
    'nav-guides': 'nav-guides',
    'nav-footer-guides': 'nav-guides',
    'lang-btn': 'lang-btn',
    'back-grid': 'back-grid',
    
    // Tools Titles & Descs
    't-card-base64-title': 'card-base64-title',
    't-card-base64-desc': 'card-base64-desc',
    't-card-glass-title': 'card-glass-title',
    't-card-glass-desc': 'card-glass-desc',
    't-card-qr-title': 'card-qr-title',
    't-card-qr-desc': 'card-qr-desc',
    't-card-palette-title': 'card-palette-title',
    't-card-palette-desc': 'card-palette-desc',
    't-card-regex-title': 'card-regex-title',
    't-card-regex-desc': 'card-regex-desc',
    't-card-git-title': 'card-git-title',
    't-card-git-desc': 'card-git-desc',
    't-card-cron-title': 'card-cron-title',
    't-card-cron-desc': 'card-cron-desc',
    't-card-image-title': 'card-image-title',
    't-card-image-desc': 'card-image-desc',
    
    // Base64 tool inputs
    'lbl-b64-mode': 'b64-mode',
    'b64-mode-encode': 'b64-btn-encode',
    'b64-mode-decode': 'b64-btn-decode',
    'lbl-b64-input': 'b64-lbl-input',
    'lbl-b64-output': 'b64-lbl-output',
    'b64-copy-btn': 'b64-copy',
    'b64-clear-btn': 'b64-clear',
    
    // Glassmorphism tool inputs
    'lbl-glass-opacity': 'glass-opacity',
    'lbl-glass-blur': 'glass-blur',
    'lbl-glass-radius': 'glass-radius',
    'lbl-glass-border': 'glass-border',
    'lbl-glass-color': 'glass-color',
    'lbl-glass-css': 'glass-lbl-css',
    'glass-copy-btn': 'glass-copy',
    'lbl-glass-tailwind': 'glass-tailwind',
    'glass-copy-tailwind-btn': 'glass-copy-tailwind',
    
    // QR Code inputs
    'lbl-qr-input': 'qr-lbl-input',
    'qr-download-btn': 'qr-download',
    'qr-clear-btn': 'qr-clear',
    
    // Color Palette
    'palette-generate-btn': 'palette-generate',
    'palette-copy-all-btn': 'palette-copy-all',
    
    // Regex
    'lbl-regex-pattern': 'regex-lbl-pattern',
    'lbl-regex-text': 'regex-lbl-text',
    'lbl-regex-summary': 'regex-lbl-summary',

    // Git
    'git-copy-btn': 'git-copy',

    // Cron
    'cron-copy-btn': 'cron-copy',

    // Image Compressor
    'lbl-image-input': 'image-dropzone-text',
    'txt-image-upload-desc': 'image-upload-desc',
    'image-compress-btn': 'image-compress-btn',
    'image-reset-btn': 'image-reset-btn',
    'lbl-image-preview': 'image-preview-lbl',
    'lbl-image-orig-size': 'image-orig-size-lbl',
    'lbl-image-comp-size': 'image-comp-size-lbl',
    'lbl-image-ratio': 'image-ratio-lbl',
    'image-download-btn': 'image-download-btn',

    // Cheatsheet Elements
    'cs-title': 'cs-title',
    'cs-desc': 'cs-desc',
    'cs-md-title': 'cs-md-title',
    'cs-regex-title': 'cs-regex-title',
    'cs-css-title': 'cs-css-title',
    'th-element': 'th-element',
    'th-syntax': 'th-syntax',
    'th-example': 'th-example',
    'th-regex-char': 'th-regex-char',
    'th-regex-desc': 'th-regex-desc',
    'th-regex-pattern': 'th-regex-pattern',
    'th-css-prop': 'th-css-prop',
    'th-css-desc': 'th-css-desc',
    'th-css-code': 'th-css-code',
    
    // Compliance pages
    'about-title': 'about-title',
    'about-desc': 'about-desc',
    'nav-footer-privacy': 'nav-footer-privacy',
    'nav-footer-terms': 'nav-footer-terms',
    'nav-footer-about': 'nav-footer-about',
    
    // Dynamic Alerts Mappings
    'b64-alert': 'copy-success',
    'glass-alert': 'glass-copied-css',
    'palette-alert': 'copy-success',
    'git-alert': 'git-copied',
    'cron-alert': 'cron-copied'
  };

  for (const [id, dictKey] of Object.entries(mappings)) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = dictionary[dictKey];
    }
  }

  // Update inputs placeholders
  const elB64Input = document.getElementById('b64-input');
  if (elB64Input) elB64Input.placeholder = dictionary['b64-input-placeholder'];
  
  const elB64Output = document.getElementById('b64-output');
  if (elB64Output) elB64Output.placeholder = dictionary['b64-output-placeholder'];
  
  const elQrInput = document.getElementById('qr-input');
  if (elQrInput) elQrInput.placeholder = dictionary['qr-placeholder'];

  const elRegexText = document.getElementById('regex-text');
  if (elRegexText) elRegexText.placeholder = dictionary['regex-placeholder'];
}
