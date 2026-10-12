const CACHE_NAME = 'balance-pwa-v1';
const APP_SHELL = ['/manifest.webmanifest', '/pwa-icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const appResponse = await fetch('/');
      if (!appResponse.ok) throw new Error(`No se pudo almacenar la app para usarla sin conexión (${appResponse.status}).`);

      const html = await appResponse.clone().text();
      const appAssets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
        .map(([, assetPath]) => assetPath)
        .filter((assetPath) => assetPath.startsWith('/'));

      await cache.put('/', appResponse);
      await cache.addAll([...APP_SHELL, ...appAssets]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('balance-pwa-') && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return caches.open(CACHE_NAME)
            .then((cache) => cache.put('/', response.clone()))
            .then(() => response);
        })
        .catch(async () => (
          (await caches.match(request))
          || (await caches.match('/'))
          || new Response('Sin conexión. Abre Balance cuando vuelva a haber internet.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        )),
    );
    return;
  }

  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then((response) => {
          if (response.ok) {
            return caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, response.clone()))
              .then(() => response);
          }
          return response;
        });
      }),
    );
  }
});
