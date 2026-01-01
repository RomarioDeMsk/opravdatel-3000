// Главный файл приложения
import { ExcuseGenerator } from './modules/generator.js';
import { Storage } from './modules/storage.js';
import { UI } from './modules/ui.js';
import { APP_VERSION } from './version.js';

// Сохраняем версию глобально
window.APP_VERSION = APP_VERSION;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Загружаем данные
        const [excusesResponse, templatesResponse] = await Promise.all([
            fetch('./data/excuses.json'),
            fetch('./data/templates.json')
        ]);

        if (!excusesResponse.ok || !templatesResponse.ok) {
            throw new Error('Failed to load data');
        }

        const excusesData = await excusesResponse.json();
        const templatesData = await templatesResponse.json();

        // Создаем экземпляры классов
        const storage = new Storage();
        const generator = new ExcuseGenerator(excusesData, templatesData, storage);
        const ui = new UI(generator, storage);

        // Делаем UI доступным глобально для обработчиков в HTML
        window.ui = ui;

        console.log('Оправдатель 3000 загружен!');
    } catch (error) {
        console.error('Ошибка загрузки приложения:', error);
        
        // Показываем сообщение об ошибке пользователю
        const terminal = document.getElementById('terminal-content');
        if (terminal) {
            terminal.textContent = 'Ошибка загрузки данных. Пожалуйста, обновите страницу.';
            terminal.style.color = '#ff0000';
        }
    }
});

// Обработка ошибок загрузки модулей
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Оптимизированная регистрация Service Worker с принудительным обновлением
if ('serviceWorker' in navigator) {
    // Принудительное обновление Service Worker при загрузке
    window.addEventListener('load', () => {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            // Удаляем все старые регистрации для принудительного обновления
            Promise.all(registrations.map(reg => reg.unregister())).then(() => {
                console.log('Старые Service Worker удалены');
                
                // Регистрируем новый Service Worker
                return navigator.serviceWorker.register('./sw.js', {
                    updateViaCache: 'none' // Всегда проверяем обновления
                });
            }).then((reg) => {
                console.log('Service Worker зарегистрирован:', reg.scope);
                
                // Принудительно обновляем
                reg.update();
                
                // Очищаем все кэши
                if ('caches' in window) {
                    caches.keys().then((cacheNames) => {
                        return Promise.all(
                            cacheNames.map((cacheName) => {
                                console.log('Удаление кэша:', cacheName);
                                return caches.delete(cacheName);
                            })
                        );
                    }).then(() => {
                        console.log('Все кэши очищены');
                        // Перезагружаем страницу для применения изменений
                        window.location.reload();
                    });
                }
            }).catch((err) => {
                console.error('Ошибка регистрации Service Worker:', err);
            });
        });
    });
}

