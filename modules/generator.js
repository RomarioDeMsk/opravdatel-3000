// Модуль генератора отговорок
export class ExcuseGenerator {
    constructor(excusesData, templatesData) {
        this.excuses = excusesData.excuses || [];
        this.templates = templatesData.templates || {};
        this.patterns = templatesData.patterns || {};
        this.generatedCount = 0;
        this.cache = new Map(); // Кэш для быстрого доступа
    }

    // Генерация случайной отговорки
    generateRandom(category = 'all') {
        // 70% вероятность использовать шаблоны, 30% - готовые отговорки
        if (Math.random() > 0.3 && this.patterns && Object.keys(this.patterns).length > 0) {
            return this.generateFromTemplates(category);
        }
        
        let filtered = this.excuses;
        
        if (category !== 'all') {
            filtered = this.excuses.filter(e => e.category === category);
        }
        
        if (filtered.length === 0) {
            return this.generateFromTemplates(category);
        }
        
        const randomIndex = Math.floor(Math.random() * filtered.length);
        return filtered[randomIndex];
    }

    // Генерация из шаблонов
    generateFromTemplates(category = 'all') {
        // Определяем категорию для шаблонов
        let templateCategory = category;
        if (category === 'all' || !this.patterns[category]) {
            const categories = Object.keys(this.patterns);
            templateCategory = categories[Math.floor(Math.random() * categories.length)];
        }

        const patterns = this.patterns[templateCategory] || this.patterns.absurd || [];
        if (patterns.length === 0) {
            return this.generateAbsurd();
        }

        const pattern = this.getRandomItem(patterns);
        const text = this.fillPattern(pattern, templateCategory);
        
        return {
            text: text,
            category: templateCategory === 'absurd' ? 'universal' : templateCategory,
            isAbsurd: templateCategory === 'absurd',
            id: `generated_${Date.now()}_${this.generatedCount++}`
        };
    }

    // Заполнение шаблона
    fillPattern(pattern, category) {
        let result = pattern;
        
        // Заменяем все плейсхолдеры
        const placeholders = pattern.match(/\{(\w+)\}/g) || [];
        
        placeholders.forEach(placeholder => {
            const key = placeholder.replace(/[{}]/g, '');
            let replacement = '';
            
            // Определяем, какой массив использовать
            if (key === 'starter') {
                replacement = this.getRandomItem(this.templates.starters || []);
            } else if (key === 'work_reason') {
                replacement = this.getRandomItem(this.templates.work_reasons || []);
            } else if (key === 'school_reason') {
                replacement = this.getRandomItem(this.templates.school_reasons || []);
            } else if (key === 'family_reasons') {
                replacement = this.getRandomItem(this.templates.family_reasons || []);
            } else if (key === 'friends_reasons') {
                replacement = this.getRandomItem(this.templates.friends_reasons || []);
            } else if (key === 'date_reasons') {
                replacement = this.getRandomItem(this.templates.date_reasons || []);
            } else if (key === 'absurd_objects') {
                replacement = this.getRandomItem(this.templates.absurd_objects || []);
            } else if (key === 'absurd_consequences') {
                replacement = this.getRandomItem(this.templates.absurd_consequences || []);
            } else if (key === 'ending') {
                replacement = this.getRandomItem(this.templates.endings || []);
            } else if (key === 'work_details') {
                replacement = this.getRandomItem(this.templates.work_details || []);
            } else if (key === 'work_actions') {
                replacement = this.getRandomItem(this.templates.work_actions || []);
            } else if (key === 'time_frames') {
                replacement = this.getRandomItem(this.templates.time_frames || []);
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
        return array[Math.floor(Math.random() * array.length)];
    }

    containsKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }
}

