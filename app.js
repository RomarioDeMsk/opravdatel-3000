// Главный файл приложения
import { ExcuseGenerator } from './modules/generator.js';
import { Storage } from './modules/storage.js';
import { UI } from './modules/ui.js';

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
        const generator = new ExcuseGenerator(excusesData, templatesData);
        const storage = new Storage();
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

