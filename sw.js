const CACHE = 'grind-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/progress-tracker-icon-192.png',
  '/progress-tracker-icon-512.png',
  'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.all(
        ASSETS.map(url => {
          return fetch(url, { cache: 'reload' })
            .then(res => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => cache.add(url).catch(() => {}));
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = e.request.url;

  // Never intercept or cache Firebase, Firestore, Google Auth, or Google APIs
  if (url.includes('firebase') || url.includes('google') || url.includes('googleapis') || url.includes('gstatic')) {
    if (!url.includes('fonts.googleapis.com') && !url.includes('fonts.gstatic.com')) {
      return;
    }
  }

  // Navigation requests (HTML document): Network-First, fall back to cached index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then(cached => cached || caches.match('/index.html') || caches.match('/')))
    );
    return;
  }

  // Same-origin static assets (CSS, JS, images, manifest): Network-First, fall back to cache
  if (url.startsWith(self.location.origin)) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // External static assets (e.g. Fonts): Cache-First, fall back to network
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
