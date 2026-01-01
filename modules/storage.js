// Модуль работы с локальным хранилищем
export class Storage {
    constructor() {
        this.storageKey = 'opravdatel3000_collection';
        this.historyKey = 'opravdatel3000_history';
        this.ratingsKey = 'opravdatel3000_ratings';
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

