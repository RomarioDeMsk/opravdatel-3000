// Модуль работы с локальным хранилищем
export class Storage {
    constructor() {
        this.storageKey = 'opravdatel3000_collection';
        this.historyKey = 'opravdatel3000_history';
        this.ratingsKey = 'opravdatel3000_ratings';
    }

    // Сохранить в избранное
    saveToCollection(excuse) {
        if (!excuse || !excuse.text) {
            console.error('Попытка сохранить пустую отговорку:', excuse);
            return false;
        }
        
        const collection = this.getCollection();
        
        // Проверяем, нет ли уже такой отговорки
        const exists = collection.some(item => item.text === excuse.text);
        if (exists) {
            console.log('Отговорка уже в избранном:', excuse.text);
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
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(collection));
            // Инвалидируем кэш
            this._invalidateCollectionCache();
            console.log('Отговорка добавлена в избранное. Всего в избранном:', collection.length);
            return true;
        } catch (e) {
            console.error('Ошибка сохранения в localStorage:', e);
            // Пробуем очистить старые данные если переполнение
            if (e.name === 'QuotaExceededError') {
                try {
                    // Удаляем самые старые записи
                    collection.sort((a, b) => (a.id || 0) - (b.id || 0));
                    const reduced = collection.slice(-100); // Оставляем последние 100
                    localStorage.setItem(this.storageKey, JSON.stringify(reduced));
                    this._invalidateCollectionCache();
                    console.warn('localStorage переполнен, удалены старые записи');
                } catch (cleanupErr) {
                    console.error('Ошибка очистки localStorage:', cleanupErr);
                }
            }
            return false;
        }
    }

    // Получить коллекцию (с мемоизацией для производительности)
    getCollection() {
        // Проверяем кэш (инвалидируется при изменениях)
        if (this._collectionCache && this._collectionCacheValid) {
            return this._collectionCache;
        }
        
        try {
            const data = localStorage.getItem(this.storageKey);
            const collection = data ? JSON.parse(data) : [];
            
            // Кэшируем результат
            this._collectionCache = collection;
            this._collectionCacheValid = true;
            
            return collection;
        } catch (e) {
            console.error('Error reading collection:', e);
            return [];
        }
    }
    
    // Инвалидация кэша
    _invalidateCollectionCache() {
        this._collectionCacheValid = false;
        this._collectionCache = null;
    }

    // Удалить из коллекции
    removeFromCollection(id) {
        const collection = this.getCollection();
        const filtered = collection.filter(item => item.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
        // Инвалидируем кэш
        this._invalidateCollectionCache();
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

    // Лайкнуть отговорку
    likeExcuse(excuseText) {
        // Проверяем, не голосовал ли уже пользователь
        if (this.hasVoted(excuseText)) {
            return false; // Уже проголосовал
        }
        
        const ratings = this.getRatings();
        const existing = ratings.find(r => r.text === excuseText);
        
        if (existing) {
            existing.likes = (existing.likes || 0) + 1;
            existing.lastLiked = Date.now();
        } else {
            ratings.push({
                text: excuseText,
                likes: 1,
                dislikes: 0,
                lastLiked: Date.now()
            });
        }
        
        // Отмечаем, что пользователь проголосовал
        this.markAsVoted(excuseText, 'like');
        
        localStorage.setItem(this.ratingsKey, JSON.stringify(ratings));
        return existing ? existing.likes : 1;
    }

    // Проверить, лайкнута ли отговорка
    isLiked(excuseText) {
        const ratings = this.getRatings();
        return ratings.some(r => r.text === excuseText && (r.likes || 0) > 0);
    }
    
    // Проверить, проголосовал ли пользователь за отговорку
    hasVoted(excuseText) {
        const votedKey = 'opravdatel3000_voted';
        try {
            const voted = JSON.parse(localStorage.getItem(votedKey) || '{}');
            return voted[excuseText] !== undefined;
        } catch (e) {
            return false;
        }
    }
    
    // Отметить, что пользователь проголосовал
    markAsVoted(excuseText, voteType) {
        const votedKey = 'opravdatel3000_voted';
        try {
            const voted = JSON.parse(localStorage.getItem(votedKey) || '{}');
            voted[excuseText] = voteType;
            localStorage.setItem(votedKey, JSON.stringify(voted));
        } catch (e) {
            console.error('Error marking as voted:', e);
        }
    }
    
    // Получить тип голоса пользователя
    getVoteType(excuseText) {
        const votedKey = 'opravdatel3000_voted';
        try {
            const voted = JSON.parse(localStorage.getItem(votedKey) || '{}');
            return voted[excuseText] || null;
        } catch (e) {
            return null;
        }
    }

    // Получить рейтинги
    getRatings() {
        try {
            const data = localStorage.getItem(this.ratingsKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading ratings:', e);
            return [];
        }
    }

    // Получить топ отговорок по лайкам
    getTopRated(limit = 5) {
        const ratings = this.getRatings();
        return ratings
            .sort((a, b) => (b.likes || 0) - (a.likes || 0))
            .slice(0, limit)
            .map(r => ({
                text: r.text,
                likes: r.likes || 0
            }));
    }

    // Получить количество лайков
    getLikesCount(excuseText) {
        const ratings = this.getRatings();
        const item = ratings.find(r => r.text === excuseText);
        return item ? (item.likes || 0) : 0;
    }

    // Дизлайкнуть отговорку
    dislikeExcuse(excuseText) {
        // Проверяем, не голосовал ли уже пользователь
        if (this.hasVoted(excuseText)) {
            return false; // Уже проголосовал
        }
        
        const ratings = this.getRatings();
        const existing = ratings.find(r => r.text === excuseText);
        
        if (existing) {
            existing.dislikes = (existing.dislikes || 0) + 1;
            existing.lastDisliked = Date.now();
        } else {
            ratings.push({
                text: excuseText,
                likes: 0,
                dislikes: 1,
                lastDisliked: Date.now()
            });
        }
        
        // Отмечаем, что пользователь проголосовал
        this.markAsVoted(excuseText, 'dislike');
        
        localStorage.setItem(this.ratingsKey, JSON.stringify(ratings));
        return existing ? existing.dislikes : 1;
    }

    // Проверить, дизлайкнута ли отговорка
    isDisliked(excuseText) {
        const ratings = this.getRatings();
        return ratings.some(r => r.text === excuseText && (r.dislikes || 0) > 0);
    }

    // Получить количество дизлайков
    getDislikesCount(excuseText) {
        const ratings = this.getRatings();
        const item = ratings.find(r => r.text === excuseText);
        return item ? (item.dislikes || 0) : 0;
    }

    // Получить топ отговорок по лайкам (только палец вверх)
    getTopRated(limit = 5) {
        const ratings = this.getRatings();
        return ratings
            .filter(r => (r.likes || 0) > 0) // Только с лайками
            .sort((a, b) => (b.likes || 0) - (a.likes || 0)) // Сортируем по количеству лайков
            .slice(0, limit)
            .map(r => ({
                text: r.text,
                likes: r.likes || 0
            }));
    }
}

