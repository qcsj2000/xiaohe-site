// 先用缓存、同时后台更新（stale-while-revalidate）。改了文件后，刷新两次即可看到新版。
const V = 'xh-v5';
const FILES = ['./', 'index.html', 'profile.html', 'keyboard.html', 'css/style.css', 'icon.svg', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest',
  'js/pwa.js', 'js/sound.js', 'js/chars.js', 'js/words.js', 'js/longwords.js', 'js/data.js', 'js/store.js', 'js/charts.js', 'js/practice.js', 'js/profile.js', 'js/keyboard.js', 'js/core/math.js', 'js/core/model.js'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(V).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(V).then(async (c) => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
