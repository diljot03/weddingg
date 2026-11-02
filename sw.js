// Wedding Guest App service worker. Works from any sub-path (e.g. GitHub Pages).
// Pages: network first, cached copy when the venue Wi-Fi drops.
// Build assets, fonts and icons: cache first. Supabase is never cached.
const VERSION = 'wedding-v2';
const SCOPE = self.registration.scope; // e.g. https://user.github.io/repo/
const PRECACHE = ['', 'manifest.json', 'couple.svg', 'icons/icon-192.png', 'icons/icon-512.png'].map((p) => new URL(p, SCOPE).href);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co') || url.hostname === 'itunes.apple.com') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(SCOPE, copy));
          return res;
        })
        .catch(() => caches.match(SCOPE)),
    );
    return;
  }

  const sameOrigin = url.origin === self.location.origin;
  const cacheFirst =
    (sameOrigin && (url.pathname.includes('/_next/static/') || url.pathname.includes('/icons/'))) ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'cdn.jsdelivr.net';

  if (cacheFirst) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok || res.type === 'opaque') {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
