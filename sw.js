// Service Worker для PWA
const CACHE_NAME = 'opravdatel3000-v1';
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
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Возвращаем из кэша, если есть
                if (response) {
                    return response;
                }
                
                // Иначе загружаем из сети
                return fetch(event.request).then((response) => {
                    // Проверяем валидность ответа
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Клонируем ответ для кэширования
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return response;
                }).catch(() => {
                    // Если сеть недоступна и нет в кэше, возвращаем оффлайн страницу
                    if (event.request.destination === 'document') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

