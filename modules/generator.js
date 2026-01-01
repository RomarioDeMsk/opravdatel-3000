// Модуль генератора отговорок
export class ExcuseGenerator {
    constructor(excusesData, templatesData, storage) {
        this.excuses = excusesData.excuses || [];
        this.templates = templatesData.templates || {};
        this.patterns = templatesData.patterns || {};
        this.generatedCount = 0;
        this.cache = new Map(); // Кэш для быстрого доступа
        this.storage = storage; // Для доступа к истории
        this.recentExcuses = new Set(); // Недавно использованные отговорки
        this.maxRecentSize = 50; // Максимум недавних отговорок
        this.usedCombinations = new Set(); // Использованные комбинации шаблонов
    }

    // Генерация случайной отговорки (всегда используем готовые отговорки)
    generateRandom(category = 'all', maxAttempts = 10) {
        let attempt = 0;
        let excuse = null;
        
        // Всегда используем готовые отговорки, не шаблоны
        while (attempt < maxAttempts) {
            let filtered = this.excuses;
            
            if (category !== 'all') {
                // Фильтруем строго по выбранной категории
                filtered = this.excuses.filter(e => e.category === category);
                
                // Если в категории нет отговорок, используем универсальные как запасной вариант
                if (filtered.length === 0) {
                    filtered = this.excuses.filter(e => e.category === 'universal');
                }
            }
            
            if (filtered.length === 0) {
                // Если вообще нет отговорок, возвращаем заглушку
                return {
                    text: "К сожалению, база отговорок пуста. Попробуйте позже.",
                    category: category !== 'all' ? category : 'universal',
                    isAbsurd: false,
                    id: 'empty'
                };
            }
            
            // Исключаем недавно использованные
            const available = filtered.filter(e => !this.recentExcuses.has(e.text));
            const source = available.length > 0 ? available : filtered;
            const randomIndex = Math.floor(Math.random() * source.length);
            excuse = source[randomIndex];
            
            // Проверяем, не использовалась ли эта отговорка недавно
            if (excuse && excuse.text && !this.recentExcuses.has(excuse.text)) {
                this.addToRecent(excuse.text);
                return excuse;
            }
            
            attempt++;
        }
        
        // Если не удалось найти уникальную, возвращаем любую из категории
        if (!excuse) {
            let filtered = this.excuses;
            
            if (category !== 'all') {
                filtered = this.excuses.filter(e => e.category === category);
                
                // Если в категории нет отговорок, используем универсальные
                if (filtered.length === 0) {
                    filtered = this.excuses.filter(e => e.category === 'universal');
                }
            }
            
            if (filtered.length > 0) {
                excuse = filtered[Math.floor(Math.random() * filtered.length)];
            } else if (this.excuses.length > 0) {
                // Только если category === 'all', используем все отговорки
                excuse = this.excuses[Math.floor(Math.random() * this.excuses.length)];
            } else {
                return {
                    text: "К сожалению, база отговорок пуста. Попробуйте позже.",
                    category: category !== 'all' ? category : 'universal',
                    isAbsurd: false,
                    id: 'empty'
                };
            }
        }
        
        if (excuse && excuse.text) {
            this.addToRecent(excuse.text);
            return excuse;
        }
        
        // Финальная заглушка
        return {
            text: "Ошибка генерации. Попробуйте еще раз.",
            category: category !== 'all' ? category : 'universal',
            isAbsurd: false,
            id: 'error'
        };
    }
    
    // Добавить в список недавних
    addToRecent(text) {
        this.recentExcuses.add(text);
        
        // Ограничиваем размер списка
        if (this.recentExcuses.size > this.maxRecentSize) {
            const first = this.recentExcuses.values().next().value;
            this.recentExcuses.delete(first);
        }
        
        // Также проверяем историю из localStorage
        if (this.storage) {
            const history = this.storage.getHistory();
            history.slice(0, 20).forEach(item => {
                this.recentExcuses.add(item.text);
            });
        }
    }

    // Генерация из шаблонов (используется только для абсурдного режима)
    generateFromTemplates(category = 'all', maxAttempts = 15) {
        // Если шаблоны пустые, используем готовые отговорки
        const hasTemplates = this.patterns && Object.keys(this.patterns).length > 0 && 
                            Object.values(this.patterns).some(patterns => patterns && patterns.length > 0);
        
        if (!hasTemplates) {
            // Если шаблонов нет, возвращаем случайную отговорку из базы
            if (this.excuses.length > 0) {
                const absurdExcuses = this.excuses.filter(e => e.isAbsurd === true);
                if (absurdExcuses.length > 0) {
                    return absurdExcuses[Math.floor(Math.random() * absurdExcuses.length)];
                }
                return this.excuses[Math.floor(Math.random() * this.excuses.length)];
            }
            return {
                text: "К сожалению, база отговорок пуста.",
                category: 'universal',
                isAbsurd: true,
                id: 'empty'
            };
        }
        
        let attempt = 0;
        let text = '';
        let templateCategory = category;
        
        // Определяем категорию для шаблонов
        if (category === 'all' || !this.patterns[category]) {
            const categories = Object.keys(this.patterns);
            templateCategory = categories[Math.floor(Math.random() * categories.length)];
        }

        const patterns = this.patterns[templateCategory] || this.patterns.absurd || [];
        if (patterns.length === 0) {
            // Если шаблоны пустые, используем готовые отговорки
            if (this.excuses.length > 0) {
                const absurdExcuses = this.excuses.filter(e => e.isAbsurd === true);
                if (absurdExcuses.length > 0) {
                    return absurdExcuses[Math.floor(Math.random() * absurdExcuses.length)];
                }
                return this.excuses[Math.floor(Math.random() * this.excuses.length)];
            }
            return {
                text: "Ошибка генерации.",
                category: 'universal',
                isAbsurd: true,
                id: 'error'
            };
        }

        // Пытаемся создать уникальную комбинацию
        while (attempt < maxAttempts) {
            const pattern = this.getRandomItem(patterns);
            const combinationKey = this.getCombinationKey(pattern, templateCategory);
            
            // Генерируем текст
            text = this.fillPattern(pattern, templateCategory);
            
            // Проверяем уникальность
            if (!this.recentExcuses.has(text) && !this.usedCombinations.has(combinationKey)) {
                this.usedCombinations.add(combinationKey);
                this.addToRecent(text);
                
                // Ограничиваем размер использованных комбинаций
                if (this.usedCombinations.size > 200) {
                    const first = this.usedCombinations.values().next().value;
                    this.usedCombinations.delete(first);
                }
                
                return {
                    text: text,
                    category: templateCategory === 'absurd' ? 'universal' : templateCategory,
                    isAbsurd: templateCategory === 'absurd',
                    id: `generated_${Date.now()}_${this.generatedCount++}`
                };
            }
            
            attempt++;
        }
        
        // Если не удалось создать уникальную, возвращаем любую
        const pattern = this.getRandomItem(patterns);
        text = this.fillPattern(pattern, templateCategory);
        this.addToRecent(text);
        
        return {
            text: text,
            category: templateCategory === 'absurd' ? 'universal' : templateCategory,
            isAbsurd: templateCategory === 'absurd',
            id: `generated_${Date.now()}_${this.generatedCount++}`
        };
    }
    
    // Получить ключ комбинации для отслеживания (оптимизировано)
    getCombinationKey(pattern, category) {
        // Используем хэш для экономии памяти
        const patternHash = this.simpleHash(pattern.substring(0, 50));
        return `${category}_${patternHash}`;
    }
    
    // Простая хэш-функция для оптимизации
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    // Заполнение шаблона
    fillPattern(pattern, category) {
        let result = pattern;
        const usedItems = new Set(); // Отслеживаем использованные элементы для этой генерации
        
        // Заменяем все плейсхолдеры
        const placeholders = pattern.match(/\{(\w+)\}/g) || [];
        
        placeholders.forEach(placeholder => {
            const key = placeholder.replace(/[{}]/g, '');
            let replacement = '';
            let array = [];
            
            // Определяем, какой массив использовать
            if (key === 'starter') {
                array = this.templates.starters || [];
            } else if (key === 'work_reason') {
                array = this.templates.work_reasons || [];
            } else if (key === 'school_reason') {
                array = this.templates.school_reasons || [];
            } else if (key === 'family_reasons') {
                array = this.templates.family_reasons || [];
            } else if (key === 'friends_reasons') {
                array = this.templates.friends_reasons || [];
            } else if (key === 'date_reasons') {
                array = this.templates.date_reasons || [];
            } else if (key === 'absurd_objects') {
                array = this.templates.absurd_objects || [];
            } else if (key === 'absurd_consequences') {
                array = this.templates.absurd_consequences || [];
            } else if (key === 'ending') {
                array = this.templates.endings || [];
            } else if (key === 'work_details') {
                array = this.templates.work_details || [];
            } else if (key === 'work_actions') {
                array = this.templates.work_actions || [];
            } else if (key === 'time_frames') {
                array = this.templates.time_frames || [];
            }
            
            // Выбираем случайный элемент, избегая недавно использованных
            if (array.length > 0) {
                // Сначала пытаемся найти элемент, который не использовался в этой генерации
                const available = array.filter(item => !usedItems.has(`${key}_${item}`));
                const source = available.length > 0 ? available : array;
                
                // Перемешиваем для большей случайности
                const shuffled = [...source].sort(() => Math.random() - 0.5);
                replacement = shuffled[0] || array[0];
                usedItems.add(`${key}_${replacement}`);
            }
            
            result = result.replace(placeholder, replacement);
        });
        
        return result;
    }

    // Генерация абсурдной отговорки
    generateAbsurd() {
        return this.generateFromTemplates('absurd');
    }

    // Умный помощник (имитация ИИ через клиентскую логику)
    generateSmart(situation) {
        if (!situation || situation.trim().length === 0) {
            return {
                text: "Пожалуйста, опишите вашу ситуацию, и я придумаю отговорку!",
                category: 'universal',
                isAbsurd: false
            };
        }

        const lowerSituation = situation.toLowerCase();
        
        // Определение категории по ключевым словам
        let category = 'universal';
        if (this.containsKeywords(lowerSituation, ['работа', 'начальник', 'офис', 'коллега', 'совещание'])) {
            category = 'work';
        } else if (this.containsKeywords(lowerSituation, ['школа', 'урок', 'учитель', 'университет', 'лекция', 'экзамен'])) {
            category = 'school';
        } else if (this.containsKeywords(lowerSituation, ['друг', 'встреча', 'вечеринка', 'тусовка'])) {
            category = 'friends';
        } else if (this.containsKeywords(lowerSituation, ['семья', 'родители', 'мама', 'папа', 'бабушка', 'дедушка', 'тёща', 'теща'])) {
            category = 'family';
        } else if (this.containsKeywords(lowerSituation, ['свидание', 'встреча', 'романтика', 'любовь'])) {
            category = 'date';
        }

        // Генерация трех вариантов
        const variants = [];
        
        // Вариант 1: Правдоподобный
        const plausible = this.generateRandom(category);
        variants.push({
            type: 'Правдоподобная',
            text: plausible.text,
            category: plausible.category
        });

        // Вариант 2: Креативная (из другой категории или абсурдная)
        const creative = Math.random() > 0.5 
            ? this.generateRandom('universal')
            : this.generateAbsurd();
        variants.push({
            type: 'Креативная',
            text: creative.text,
            category: creative.category || 'universal'
        });

        // Вариант 3: Полностью абсурдная
        const absurd = this.generateAbsurd();
        variants.push({
            type: 'Абсурдная',
            text: absurd.text,
            category: absurd.category
        });

        // Возвращаем случайный вариант из трех
        const selected = variants[Math.floor(Math.random() * variants.length)];
        
        return {
            text: `[${selected.type}] ${selected.text}`,
            category: selected.category,
            isAbsurd: selected.type === 'Абсурдная',
            variants: variants // Сохраняем все варианты для возможного использования
        };
    }

    // Получить топ отговорок
    getTopExcuses(limit = 5) {
        // В реальном приложении это могло бы быть из базы с рейтингами
        // Здесь просто возвращаем случайные популярные
        const shuffled = [...this.excuses].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, limit);
    }

    // Вспомогательные методы
    getRandomItem(array) {
        if (!array || array.length === 0) {
            return "что-то важное";
        }
        // Перемешиваем массив для большей случайности
        const shuffled = [...array].sort(() => Math.random() - 0.5);
        return shuffled[0];
    }
    
    // Очистить недавние отговорки (можно вызвать при необходимости)
    clearRecent() {
        this.recentExcuses.clear();
        this.usedCombinations.clear();
    }

    containsKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }
}

