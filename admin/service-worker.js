// Nom du cache pour la PWA Admin
const CACHE_NAME = 'chapchap-admin-v1';

// Ressources à mettre en cache initialement
const ASSETS = [
  '/admin/',
  '/admin/index.html',
  '/admin/login.html',
  '/admin/styles.css',
  '/admin/app_fixed.js',
  '/admin/manifest.json',
  '/admin/icons/icon-192x192.png',
  '/admin/icons/icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation');
  
  // Forcer l'activation immédiate du nouveau service worker
  self.skipWaiting();
  
  // Attendre que le cache soit prêt et y ajouter les ressources
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Mise en cache des ressources');
        return Promise.all(
          ASSETS.map(url => {
            return fetch(url)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch ${url}`);
                }
                return cache.put(url, response);
              })
              .catch(error => {
                console.error(`Failed to cache ${url}:`, error);
              });
          })
        );
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation');
  
  // Nettoyer les anciens caches
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Suppression de l\'ancien cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Prendre le contrôle immédiatement
        return self.clients.claim();
      })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  // Ne pas mettre en cache les requêtes d'API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Retourner la ressource du cache si disponible
        if (cachedResponse) {
          return cachedResponse;
        }

        // Sinon, faire la requête réseau
        return fetch(event.request)
          .then((response) => {
            // Vérifier que la réponse est valide
            if (!response || response.status !== 200) {
              return response;
            }

            // Cloner la réponse car elle ne peut être utilisée qu'une fois
            const responseToCache = response.clone();

            // Mettre en cache la nouvelle ressource
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // En cas d'erreur réseau, essayer de servir la page hors-ligne
            if (event.request.mode === 'navigate') {
              return caches.match('/admin/offline.html');
            }
            return new Response('Contenu non disponible hors-ligne', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});
