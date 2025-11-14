// TruckFixGo Service Worker v1.0.0
const CACHE_NAME = 'truckfixgo-v1';
const DYNAMIC_CACHE_NAME = 'truckfixgo-dynamic-v1';
const OFFLINE_URL = '/offline.html';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Critical pages to cache for offline access
const CRITICAL_PAGES = [
  '/emergency',
  '/fleet',
  '/track',
];

// API endpoints that should be cached with network-first strategy
const API_CACHE_PATTERNS = [
  /\/api\/jobs\//,
  /\/api\/contractors\//,
  /\/api\/fleet\//,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[Service Worker] Skip waiting');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API calls with network-first strategy
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle image requests with stale-while-revalidate
  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Default to network-first for everything else
  event.respondWith(networkFirst(request));
});

// Cache-first strategy
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache-first fetch failed:', error);
    return new Response('Network error occurred', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Network-first strategy
async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network request failed, trying cache:', request.url);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    return new Response('Network error occurred', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.log('[Service Worker] Revalidation failed:', error);
    return cachedResponse;
  });

  return cachedResponse || fetchPromise;
}

// Check if request is for static asset
function isStaticAsset(pathname) {
  return pathname.match(/\.(js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/);
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-jobs') {
    event.waitUntil(syncJobs());
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Sync failed job updates
async function syncJobs() {
  try {
    const cache = await caches.open('pending-requests');
    const requests = await cache.keys();
    
    const jobRequests = requests.filter(req => req.url.includes('/api/jobs'));
    
    for (const request of jobRequests) {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.log('[Service Worker] Failed to sync job:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync jobs failed:', error);
  }
}

// Sync failed chat messages
async function syncMessages() {
  try {
    const cache = await caches.open('pending-messages');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.log('[Service Worker] Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync messages failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
      data = { title: 'TruckFixGo Update', body: event.data.text() };
    }
  }

  const options = {
    title: data.title || 'TruckFixGo Update',
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-96x96.png',
    tag: data.tag || `notification-${Date.now()}`,
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    data: {
      ...data.data,
      dateOfArrival: Date.now(),
      notificationId: data.notificationId,
      type: data.data?.type || 'general',
      userId: data.data?.userId,
      url: data.data?.url || '/'
    },
    actions: data.actions || []
  };

  // Cache notification data for offline viewing
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(options.title, options),
      cacheNotificationData(data),
      trackNotificationDelivery(data.notificationId)
    ])
  );
});

// Enhanced notification click handling with action support
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event.action);
  
  event.notification.close();

  const notificationData = event.notification.data;
  const action = event.action;

  event.waitUntil(
    (async () => {
      // Track notification click
      if (notificationData.notificationId) {
        await trackNotificationClick(notificationData.notificationId);
      }

      // Handle different actions
      let urlToOpen = notificationData.url || '/';
      
      switch (action) {
        case 'track':
          urlToOpen = `/tracking?jobId=${notificationData.jobId}`;
          break;
        case 'message':
          urlToOpen = `/jobs/${notificationData.jobId}#messages`;
          break;
        case 'view':
          urlToOpen = `/jobs/${notificationData.jobId}`;
          break;
        case 'navigate':
          urlToOpen = `/contractor/active-job?id=${notificationData.jobId}`;
          break;
        case 'call':
          // Handle call action
          urlToOpen = `tel:${notificationData.phone}`;
          break;
        case 'review':
          urlToOpen = `/jobs/${notificationData.jobId}#review`;
          break;
        case 'invoice':
          urlToOpen = `/jobs/${notificationData.jobId}#invoice`;
          break;
        case 'rebook':
          urlToOpen = `/emergency`;
          break;
        case 'close':
          // Just close the notification, no navigation
          return;
        default:
          // Use the default URL or action URL if provided
          if (notificationData.actions && notificationData.actions[action]) {
            urlToOpen = notificationData.actions[action].url || urlToOpen;
          }
      }

      // Handle special URL types
      if (urlToOpen.startsWith('tel:')) {
        // For phone calls, we can't open in the same way
        return clients.openWindow(urlToOpen);
      }

      // Find or open window
      const windowClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      // Check if there is already a window/tab open
      for (let client of windowClients) {
        if ('focus' in client) {
          await client.focus();
          // Navigate the focused client to the URL
          if ('navigate' in client) {
            return client.navigate(urlToOpen);
          }
          // Fallback: post message to client to navigate
          client.postMessage({
            type: 'NAVIGATE',
            url: urlToOpen
          });
          return;
        }
      }

      // If not, open a new window/tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })()
  );
});

// Cache notification data for offline viewing
async function cacheNotificationData(data) {
  try {
    const cache = await caches.open('notifications-cache');
    const request = new Request(`/api/notifications/${data.notificationId || Date.now()}`, {
      method: 'GET'
    });
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(request, response);
  } catch (error) {
    console.error('[Service Worker] Failed to cache notification:', error);
  }
}

// Track notification delivery
async function trackNotificationDelivery(notificationId) {
  if (!notificationId) return;
  
  try {
    await fetch(`/api/push/delivered/${notificationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Service Worker] Failed to track delivery:', error);
    // Queue for later sync
    await queueTrackingEvent('delivery', notificationId);
  }
}

// Track notification click
async function trackNotificationClick(notificationId) {
  if (!notificationId) return;
  
  try {
    await fetch(`/api/push/clicked/${notificationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Service Worker] Failed to track click:', error);
    // Queue for later sync
    await queueTrackingEvent('click', notificationId);
  }
}

// Queue tracking events for background sync
async function queueTrackingEvent(type, notificationId) {
  try {
    const cache = await caches.open('tracking-queue');
    const request = new Request(`/api/push/${type}/${notificationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(request, new Response('queued'));
    
    // Register sync event
    if ('sync' in self.registration) {
      await self.registration.sync.register('sync-tracking');
    }
  } catch (error) {
    console.error('[Service Worker] Failed to queue tracking:', error);
  }
}

// Sync queued tracking events
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-tracking') {
    event.waitUntil(syncTrackingEvents());
  }
});

async function syncTrackingEvents() {
  try {
    const cache = await caches.open('tracking-queue');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.log('[Service Worker] Failed to sync tracking:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync tracking failed:', error);
  }
}

// Message handling from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then(cache => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Pre-cache critical pages when online
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRECACHE_CRITICAL') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return Promise.all(
          CRITICAL_PAGES.map(page => {
            return fetch(page).then(response => {
              if (response.ok) {
                return cache.put(page, response);
              }
            }).catch(error => {
              console.log('[Service Worker] Failed to precache:', page, error);
            });
          })
        );
      })
    );
  }
});