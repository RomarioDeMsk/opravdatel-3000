// Модуль работы с локальным хранилищем
export class Storage {
    constructor() {
        this.storageKey = 'opravdatel3000_collection';
        this.historyKey = 'opravdatel3000_history';
    }

    // Сохранить в избранное
    saveToCollection(excuse) {
        const collection = this.getCollection();
        
        // Проверяем, нет ли уже такой отговорки
        const exists = collection.some(item => item.text === excuse.text);
        if (exists) {
            return false; // Уже есть в коллекции
        }

        const item = {
            id: Date.now(),
            text: excuse.text,
            category: excuse.category || 'universal',
            isAbsurd: excuse.isAbsurd || false,
            date: new Date().toISOString()
        };

        collection.push(item);
        localStorage.setItem(this.storageKey, JSON.stringify(collection));
        return true;
    }

    // Получить коллекцию
    getCollection() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading collection:', e);
            return [];
        }
    }

    // Удалить из коллекции
    removeFromCollection(id) {
        const collection = this.getCollection();
        const filtered = collection.filter(item => item.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
        return filtered;
    }

    // Очистить коллекцию
    clearCollection() {
        localStorage.removeItem(this.storageKey);
    }

    // Сохранить в историю
    addToHistory(excuse) {
        const history = this.getHistory();
        const item = {
            id: Date.now(),
            text: excuse.text,
            category: excuse.category || 'universal',
            date: new Date().toISOString()
        };

        history.unshift(item); // Добавляем в начало
        
        // Ограничиваем историю последними 50 элементами
        if (history.length > 50) {
            history.pop();
        }

        localStorage.setItem(this.historyKey, JSON.stringify(history));
    }

    // Получить историю
    getHistory() {
        try {
            const data = localStorage.getItem(this.historyKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading history:', e);
            return [];
        }
    }

    // Очистить историю
    clearHistory() {
        localStorage.removeItem(this.historyKey);
    }
}

