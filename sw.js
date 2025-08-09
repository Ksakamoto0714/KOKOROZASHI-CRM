// sw.js
const CACHE_VERSION = 'v1.0.0-sonoto';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// インストール：アプリ殻をキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// 有効化：古いキャッシュを掃除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_VERSION ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// フェッチ：キャッシュ優先（なければネット→成功したら更新）
self.addEventListener('fetch', (event) => {
  const req = event.request;
  // 例外：拡張機能やchrome拡張などは無視
  if (req.url.startsWith('chrome-extension')) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          // 成功レスポンスだけ保存
          if (res && res.status === 200 && res.type === 'basic') {
            const resClone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => cached); // ネット失敗時はキャッシュ頼み
      return cached || fetchPromise;
    })
  );
});
