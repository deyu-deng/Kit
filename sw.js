const CACHE_NAME = 'plobi-kit-v1';
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
  '/js/imageCompressor.js'
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

// Fetch event: serve cache-first, fallback to network and update cache dynamically
self.addEventListener('fetch', (event) => {
  // Ignore AdSense and analytical third-party requests
  if (event.request.url.includes('googlesyndication') || 
      event.request.url.includes('pagead2') ||
      event.request.url.includes('doubleclick') ||
      event.request.url.includes('unpkg.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone response and cache it dynamically for subpages/tools/guides visited
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Fallback for offline if page is not in cache
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
