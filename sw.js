// Service Worker для PWA
const CACHE_NAME = 'opravdatel3000-v2';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './modules/generator.js',
    './modules/storage.js',
    './modules/ui.js',
    './data/excuses.json',
    './data/templates.json',
    './manifest.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Cache addAll failed:', error);
            })
    );
    self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Удаляем ВСЕ старые кэши, включая v1
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Принудительно активируем новый Service Worker
            return self.clients.claim();
        })
    );
    // Немедленно активируем новый Service Worker
    self.skipWaiting();
});

// Перехват запросов (оптимизированная стратегия Cache First с Network Fallback)
self.addEventListener('fetch', (event) => {
    // Пропускаем не-GET запросы и внешние ресурсы
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Стратегия: Cache First для статических ресурсов
                if (cachedResponse) {
                    // Обновляем кэш в фоне (stale-while-revalidate)
                    fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        }
                    }).catch(() => {
                        // Игнорируем ошибки фонового обновления
                    });
                    
                    return cachedResponse;
                }
                
                // Если нет в кэше, загружаем из сети
                return fetch(event.request).then((response) => {
                    // Проверяем валидность ответа
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Клонируем ответ для кэширования
                    const responseToCache = response.clone();
                    
                    // Кэшируем только успешные ответы
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return response;
                }).catch(() => {
                    // Если сеть недоступна и нет в кэше, возвращаем оффлайн страницу
                    if (event.request.destination === 'document') {
                        return caches.match('./index.html');
                    }
                    // Для других ресурсов возвращаем пустой ответ
                    return new Response('', { status: 408, statusText: 'Request Timeout' });
                });
            })
    );
});

