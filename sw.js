// SMX LiveBoard - Service Worker
const CACHE_NAME = 'smx-liveboard-v1.0.0';
const STATIC_CACHE = 'smx-static-v1.0.0';
const DYNAMIC_CACHE = 'smx-dynamic-v1.0.0';

// Arquivos para cache estático
const STATIC_FILES = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/styles/pwa-modal.css',
  '/js/app.js',
  '/js/logs.js',
  '/js/ssh.js',
  '/js/pwa-install.js',
  '/manifest.json',
  '/browserconfig.xml',
  '/assets/icon-192.svg',
  '/assets/icon-512.svg',
  '/assets/icon-144.svg',
  '/assets/icon-96.svg',
  '/assets/icon-72.svg',
  '/assets/icon-48.svg',
  '/assets/favicon.svg'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 SMX LiveBoard SW: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 SMX LiveBoard SW: Cacheando arquivos estáticos...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ SMX LiveBoard SW: Instalação concluída!');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ SMX LiveBoard SW: Erro na instalação:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 SMX LiveBoard SW: Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ SMX LiveBoard SW: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ SMX LiveBoard SW: Ativação concluída!');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições do Socket.IO e APIs
  if (url.pathname.startsWith('/socket.io/') || 
      url.pathname.startsWith('/api/') ||
      url.hostname !== location.hostname) {
    return;
  }
  
  // Estratégia: Cache First para arquivos estáticos
  if (request.destination === 'document' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'image') {
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('📦 SMX LiveBoard SW: Servindo do cache:', request.url);
            return cachedResponse;
          }
          
          // Se não estiver em cache, buscar da rede
          return fetch(request)
            .then((networkResponse) => {
              // Cachear resposta bem-sucedida
              if (networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return networkResponse;
            })
            .catch(() => {
              // Fallback para página offline
              if (request.destination === 'document') {
                return caches.match('/index.html');
              }
            });
        })
    );
  }
});

// Notificações push (para futuras funcionalidades)
self.addEventListener('push', (event) => {
  console.log('📱 SMX LiveBoard SW: Push notification recebida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do SMX LiveBoard',
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-96.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir Dashboard',
        icon: '/assets/icon-96.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/assets/icon-96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('SMX LiveBoard', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('👆 SMX LiveBoard SW: Notificação clicada');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('🔄 SMX LiveBoard SW: Sincronização em background');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aqui você pode adicionar lógica de sincronização
      Promise.resolve()
    );
  }
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('💬 SMX LiveBoard SW: Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME
    });
  }
});
