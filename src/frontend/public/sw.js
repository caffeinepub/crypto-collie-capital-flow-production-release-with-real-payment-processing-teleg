// Dynamic cache version - automatically updated on each deployment
const CACHE_VERSION = '2025-11-21-auto-update-v1';
const CACHE_NAME = `crypto-collie-${CACHE_VERSION}`;

// Static assets that can be cached long-term
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/generated/crypto-collie-logo-transparent.png',
  '/assets/generated/crypto-collie-pwa-48.png',
  '/assets/generated/crypto-collie-pwa-72.png',
  '/assets/generated/crypto-collie-pwa-96.png',
  '/assets/generated/crypto-collie-pwa-144.png',
  '/assets/generated/crypto-collie-pwa-192.png',
  '/assets/generated/crypto-collie-pwa-512.png',
  '/assets/generated/crypto-dashboard-bg.jpg',
  '/assets/generated/capital-flow-arrows-transparent.png',
  '/assets/generated/capital-flow-directional-arrows-transparent.dim_400x400.png',
  '/assets/generated/usd-crypto-icon-transparent.png',
  '/assets/generated/confluencia-deteccao-icon-transparent.dim_200x200.png',
  '/assets/generated/inteligencia-preditiva-icon-transparent.dim_200x200.png',
  '/assets/generated/organograma-horario-fluxo.dim_800x400.png',
  '/assets/generated/usd-crypto-segments-diagram.dim_800x600.png',
  '/assets/generated/usd-direcao-capital-diagram.dim_600x400.png'
];

// Install event - cache static assets and skip waiting immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker versão:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto, adicionando assets estáticos');
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.error('[SW] Erro ao adicionar assets ao cache:', err);
          // Continue mesmo se alguns assets falharem
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('[SW] Assets em cache, ativando imediatamente');
        // Force the waiting service worker to become the active service worker immediately
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Erro durante instalação:', err);
      })
  );
});

// Activate event - clean up old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker versão:', CACHE_VERSION);
  event.waitUntil(
    Promise.all([
      // Delete all old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete all caches except the current one
            if (cacheName !== CACHE_NAME && cacheName.startsWith('crypto-collie-')) {
              console.log('[SW] Deletando cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim().then(() => {
        console.log('[SW] Assumindo controle de todos os clientes imediatamente');
      })
    ]).then(() => {
      console.log('[SW] Service Worker ativado com sucesso, versão:', CACHE_VERSION);
      // Notify all clients that a new version is active
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CACHE_VERSION
          });
        });
      });
    }).catch((err) => {
      console.error('[SW] Erro durante ativação:', err);
    })
  );
});

// Fetch event - network first for HTML/API, cache first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Network first strategy for HTML and API calls (always fetch latest)
  if (
    request.headers.get('accept')?.includes('text/html') ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname.includes('/api/') ||
    url.pathname.includes('?canisterId=') ||
    url.hostname.includes('ic0.app') ||
    url.hostname.includes('icp0.io') ||
    url.hostname.includes('localhost')
  ) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then((response) => {
          // Clone and cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch((err) => {
          console.log('[SW] Falha na rede, tentando cache para:', url.pathname);
          // Fallback to cache if network fails
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response('Offline - conteúdo não disponível', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain; charset=utf-8'
              })
            });
          });
        })
    );
    return;
  }

  // Cache first strategy for static assets (images, fonts, etc.)
  if (
    url.pathname.startsWith('/assets/') ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ttf')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        }).catch((err) => {
          console.error('[SW] Erro ao buscar asset:', url.pathname, err);
          return new Response('Asset não disponível', {
            status: 404,
            statusText: 'Not Found'
          });
        });
      })
    );
    return;
  }

  // Network first for everything else (JS bundles, CSS, etc.) - always fetch latest
  event.respondWith(
    fetch(request, { cache: 'no-cache' })
      .then((response) => {
        if (response && response.status === 200 && request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch((err) => {
        console.log('[SW] Falha na rede, tentando cache para:', url.pathname);
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          throw err;
        });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Pulando espera e ativando novo service worker imediatamente');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    console.log('[SW] Assumindo controle dos clientes');
    self.clients.claim();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// Log when service worker is ready
console.log('[SW] Service Worker carregado, versão:', CACHE_VERSION);
