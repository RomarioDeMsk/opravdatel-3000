// Service Worker для PWA
// Версия обновляется вручную при каждом деплое
// Для автоматического обновления кэша измените версию ниже
const APP_VERSION = '3.3.0';
const CACHE_NAME = `opravdatel3000-${APP_VERSION}`;
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
    // НЕ используем skipWaiting - это предотвращает постоянные перезагрузки страницы
    // Service Worker активируется естественным образом при следующем визите
});

// Активация Service Worker (без агрессивных действий)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            // Удаляем только старые кэши, не текущий
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Удаление старого кэша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Активируем новый Service Worker без принудительного claim
            return self.clients.claim();
        })
    );
    // НЕ используем skipWaiting - пусть Service Worker активируется естественным образом
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

