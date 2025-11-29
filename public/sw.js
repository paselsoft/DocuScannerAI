const CACHE_NAME = 'docuscanner-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Installazione: Cache degli asset statici critici
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Attivazione: Pulizia vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch: Strategia Network First (perché l'app dipende molto dalle API e dal DB)
// Fallback alla cache solo se offline o se la rete fallisce per asset statici
self.addEventListener('fetch', (event) => {
  // Ignora richieste non GET o verso API esterne (Supabase, Google AI)
  if (event.request.method !== 'GET' || 
      event.request.url.includes('supabase.co') || 
      event.request.url.includes('googlevideo.com') ||
      event.request.url.includes('google/genai')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se la risposta è valida, la cloniamo in cache (stale-while-revalidate logic light)
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Se siamo offline, cerchiamo nella cache
        return caches.match(event.request);
      })
  );
});