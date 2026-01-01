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

// Оптимизированная регистрация Service Worker с проверкой версии
if ('serviceWorker' in navigator) {
    const currentVersion = window.APP_VERSION || '3.3.0';
    const versionKey = 'opravdatel3000_version';
    
    // Проверяем, изменилась ли версия
    const storedVersion = localStorage.getItem(versionKey);
    
    window.addEventListener('load', () => {
        // Если версия изменилась - обновляем кэш
        if (storedVersion !== currentVersion) {
            console.log(`Обнаружена новая версия: ${currentVersion} (было: ${storedVersion || 'нет'})`);
            
            // Очищаем старые кэши только при смене версии
            if ('caches' in window) {
                caches.keys().then((cacheNames) => {
                    return Promise.all(
                        cacheNames.map((cacheName) => {
                            if (!cacheName.includes(currentVersion)) {
                                console.log('Удаление старого кэша:', cacheName);
                                return caches.delete(cacheName);
                            }
                        })
                    );
                }).then(() => {
                    // Сохраняем новую версию
                    localStorage.setItem(versionKey, currentVersion);
                    console.log('Кэш обновлен для версии:', currentVersion);
                });
            }
        }
        
        // Регистрируем/обновляем Service Worker (всегда, независимо от версии)
        navigator.serviceWorker.register('./sw.js', {
            updateViaCache: 'none'
        }).then((reg) => {
            console.log(`Service Worker v${currentVersion} активен`);
            
            // Проверяем обновления в фоне
            reg.update();
            
            // Слушаем обновления Service Worker
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Новый Service Worker установлен, но не активирован
                            console.log('Доступна новая версия Service Worker');
                            // НЕ перезагружаем автоматически - пользователь может сделать это сам
                        }
                    });
                }
            });
        }).catch((err) => {
            console.error('Ошибка регистрации Service Worker:', err);
        });
    });
}

