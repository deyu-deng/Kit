const CACHE_NAME = 'plobi-kit-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/cheatsheet.html',
  '/about.html',
  '/privacy.html',
  '/terms.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icon-512.png',
  '/css/base.css',
  '/css/components.css',
  '/css/layout.css',
  '/css/tools.css',
  '/js/ads.js',
  '/js/base64.js',
  '/js/colorPalette.js',
  '/js/cronGenerator.js',
  '/js/gitGenerator.js',
  '/js/glassmorphism.js',
  '/js/i18n.js',
  '/js/qrcode.js',
  '/js/regexTester.js',
  '/js/imageCompressor.js',
  '/js/jsonFormatter.js',
  '/js/jwtDecoder.js',
  '/js/urlEncoder.js',
  '/js/markdownConverter.js',
  '/js/flexgridBuilder.js',
  '/js/svgOptimizer.js',
  '/js/metatagsGenerator.js',
  '/js/promptHelper.js',
  '/js/codeToImage.js'
];

// Install event: cache all core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: serve network-first to ensure live updates, fallback to cache if offline
self.addEventListener('fetch', (event) => {
  // Ignore AdSense and analytical third-party requests
  if (event.request.url.includes('googlesyndication') || 
      event.request.url.includes('pagead2') ||
      event.request.url.includes('doubleclick') ||
      event.request.url.includes('unpkg.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if we received a valid response to cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
