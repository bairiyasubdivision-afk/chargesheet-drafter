/* Service worker — makes the app installable and usable offline.
   Only same-origin GET requests are touched; Drive and Google sign-in pass straight through. */
const CACHE = 'csd-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req)
      .then(r => { const c = r.clone(); caches.open(CACHE).then(cc => cc.put(req, c)); return r; })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit ||
    fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(cc => cc.put(req, c)); return r; })));
});
