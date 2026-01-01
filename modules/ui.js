// Модуль управления интерфейсом
export class UI {
    constructor(generator, storage) {
        this.generator = generator;
        this.storage = storage;
        this.currentExcuse = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTopExcuses();
    }

    setupEventListeners() {
        // Кнопки генерации
        document.getElementById('btn-random').addEventListener('click', () => {
            this.generateRandom();
        });

        document.getElementById('btn-category').addEventListener('click', () => {
            this.toggleCategorySelector();
        });

        document.getElementById('btn-absurd').addEventListener('click', () => {
            this.generateAbsurd();
        });

        document.getElementById('btn-ai').addEventListener('click', () => {
            this.toggleAIAssistant();
        });

        const aiGenerateBtn = document.getElementById('btn-ai-generate');
        if (aiGenerateBtn) {
            aiGenerateBtn.addEventListener('click', () => {
                this.generateSmart();
            });
        }

        // Кнопки категорий
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.generateByCategory(category);
                this.toggleCategorySelector();
            });
        });

        // Кнопки действий
        document.getElementById('btn-copy').addEventListener('click', () => {
            this.copyToClipboard();
        });

        document.getElementById('btn-share').addEventListener('click', () => {
            this.shareExcuse();
        });

        document.getElementById('btn-favorite').addEventListener('click', () => {
            this.saveToFavorite();
        });

        document.getElementById('btn-collection').addEventListener('click', () => {
            this.showCollection();
        });

        // Модальное окно
        document.getElementById('modal-close').addEventListener('click', () => {
            this.hideCollection();
        });

        document.getElementById('collection-modal').addEventListener('click', (e) => {
            if (e.target.id === 'collection-modal') {
                this.hideCollection();
            }
        });

        // Enter в поле ИИ
        const aiInput = document.getElementById('ai-input');
        if (aiInput) {
            aiInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.generateSmart();
                }
            });
        }
    }

    // Генерация случайной отговорки
    async generateRandom() {
        // Анимация генерации
        this.animateGeneration();
        await this.delay(500);
        
        const excuse = this.generator.generateRandom();
        this.displayExcuse(excuse);
    }

    // Генерация по категории
    async generateByCategory(category) {
        // Анимация генерации
        this.animateGeneration();
        await this.delay(500);
        
        const excuse = this.generator.generateRandom(category);
        this.displayExcuse(excuse);
    }

    // Генерация абсурдной отговорки
    async generateAbsurd() {
        // Специальная анимация для абсурда
        this.animateAbsurdGeneration();
        await this.delay(800);
        
        const excuse = this.generator.generateAbsurd();
        this.displayExcuse(excuse);
    }

    // Анимация генерации
    animateGeneration() {
        const terminal = document.getElementById('terminal');
        if (terminal) {
            terminal.classList.add('generating');
            setTimeout(() => {
                terminal.classList.remove('generating');
            }, 500);
        }
    }

    // Анимация для абсурдной генерации
    animateAbsurdGeneration() {
        const terminal = document.getElementById('terminal');
        if (terminal) {
            terminal.classList.add('absurd-generating');
            setTimeout(() => {
                terminal.classList.remove('absurd-generating');
            }, 800);
        }
    }

    // Генерация умной отговорки
    async generateSmart() {
        const input = document.getElementById('ai-input');
        if (!input) {
            console.error('AI input not found');
            return;
        }
        
        const situation = input.value.trim();
        
        if (!situation) {
            alert('Пожалуйста, опишите вашу ситуацию!');
            input.focus();
            return;
        }

        // Скрываем варианты если были показаны
        this.hideVariants();

        // Обновляем статус
        this.updateStatus('Анализ ситуации...');

        // Показываем индикатор загрузки с анимацией
        const terminal = document.getElementById('terminal-content');
        if (terminal) {
            terminal.innerHTML = '<span class="loading-animation">Анализирую ситуацию<span class="loading-dots">...</span></span>';
        }
        
        // Анимация загрузки
        await this.showLoadingAnimation();
        await this.delay(800);
        
        this.updateStatus('Генерация вариантов...');
        if (terminal) {
            terminal.innerHTML = '<span class="loading-animation">Генерирую варианты отговорок<span class="loading-dots">...</span></span>';
        }
        await this.delay(600);
        
        try {
            const excuse = this.generator.generateSmart(situation);
            if (excuse && excuse.variants && excuse.variants.length === 3) {
                // Показываем все 3 варианта
                this.updateStatus('Готово');
                this.displayVariants(excuse.variants);
            } else if (excuse && excuse.text) {
                // Fallback: показываем один вариант
                this.updateStatus('Готово');
                this.displayExcuse(excuse);
            } else {
                console.error('Failed to generate excuse');
                this.updateStatus('Ошибка');
                if (terminal) {
                    terminal.textContent = 'Ошибка генерации. Попробуйте еще раз.';
                }
            }
        } catch (error) {
            console.error('Error generating smart excuse:', error);
            this.updateStatus('Ошибка');
            if (terminal) {
                terminal.textContent = 'Произошла ошибка. Попробуйте еще раз.';
            }
        }
        
        // Очищаем поле
        input.value = '';
    }

    // Показать 3 варианта отговорок
    displayVariants(variants) {
        const variantsContainer = document.getElementById('variants-container');
        const variantsGrid = document.getElementById('variants-grid');
        const terminal = document.getElementById('terminal');
        
        if (!variantsContainer || !variantsGrid) return;

        // Очищаем предыдущие варианты
        variantsGrid.innerHTML = '';
        
        // Скрываем терминал
        if (terminal) {
            terminal.style.display = 'none';
        }
        
        // Создаем карточки для каждого варианта
        variants.forEach((variant, index) => {
            const variantCard = document.createElement('div');
            variantCard.className = 'variant-card';
            variantCard.style.animationDelay = `${index * 0.1}s`;
            
            const typeBadge = document.createElement('div');
            typeBadge.className = `variant-badge variant-badge-${variant.type.toLowerCase().replace('ая', '')}`;
            typeBadge.textContent = variant.type;
            
            const textDiv = document.createElement('div');
            textDiv.className = 'variant-text';
            textDiv.textContent = variant.text;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'variant-actions';
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'variant-btn';
            copyBtn.innerHTML = '📋 Копировать';
            copyBtn.addEventListener('click', () => {
                this.copyVariant(variant.text);
                this.animateSuccess(copyBtn);
            });
            
            const selectBtn = document.createElement('button');
            selectBtn.className = 'variant-btn variant-btn-primary';
            selectBtn.innerHTML = '✓ Выбрать';
            selectBtn.addEventListener('click', () => {
                this.selectVariant(variant);
            });
            
            actionsDiv.appendChild(copyBtn);
            actionsDiv.appendChild(selectBtn);
            
            variantCard.appendChild(typeBadge);
            variantCard.appendChild(textDiv);
            variantCard.appendChild(actionsDiv);
            
            variantsGrid.appendChild(variantCard);
        });
        
        // Показываем контейнер с анимацией
        variantsContainer.style.display = 'block';
        setTimeout(() => {
            variantsContainer.classList.add('show');
        }, 10);
    }

    // Скрыть варианты
    hideVariants() {
        const variantsContainer = document.getElementById('variants-container');
        const terminal = document.getElementById('terminal');
        
        if (variantsContainer) {
            variantsContainer.classList.remove('show');
            setTimeout(() => {
                variantsContainer.style.display = 'none';
            }, 300);
        }
        
        if (terminal) {
            terminal.style.display = 'block';
        }
    }

    // Выбрать вариант
    selectVariant(variant) {
        this.hideVariants();
        const excuse = {
            text: variant.text,
            category: variant.category,
            isAbsurd: variant.type === 'Абсурдная'
        };
        this.displayExcuse(excuse);
    }

    // Копировать вариант
    async copyVariant(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    // Анимация успеха
    animateSuccess(element) {
        element.classList.add('success-animation');
        setTimeout(() => {
            element.classList.remove('success-animation');
        }, 600);
    }

    // Анимация загрузки
    async showLoadingAnimation() {
        const terminal = document.getElementById('terminal');
        if (terminal) {
            terminal.classList.add('loading');
        }
        await this.delay(1000);
        if (terminal) {
            terminal.classList.remove('loading');
        }
    }

    // Обновить статус
    updateStatus(text) {
        const statusText = document.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = text;
        }
    }

    // Создать эффект конфетти
    createConfetti() {
        const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
        const confettiCount = 30;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, 2000);
            }, i * 20);
        }
    }

    // Отображение отговорки
    displayExcuse(excuse) {
        // Скрываем варианты если они были показаны
        this.hideVariants();
        
        this.currentExcuse = excuse;
        const terminal = document.getElementById('terminal-content');
        
        // Показываем терминал если он был скрыт
        const terminalEl = document.getElementById('terminal');
        if (terminalEl) {
            terminalEl.style.display = 'block';
        }
        
        // Анимация печати
        this.typewriterEffect(terminal, excuse.text);
        
        // Сохраняем в историю
        this.storage.addToHistory(excuse);
    }

    // Эффект печатной машинки
    typewriterEffect(element, text) {
        element.textContent = '';
        element.classList.add('typewriter');
        
        let index = 0;
        const speed = 30; // Скорость печати
        
        const type = () => {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                setTimeout(type, speed);
            } else {
                element.classList.remove('typewriter');
                element.innerHTML = text + '<span class="cursor-blink">_</span>';
            }
        };
        
        type();
    }

    // Переключение селектора категорий
    toggleCategorySelector() {
        const selector = document.getElementById('category-selector');
        const aiAssistant = document.getElementById('ai-assistant');
        
        if (selector.style.display === 'none') {
            selector.style.display = 'block';
            aiAssistant.style.display = 'none';
        } else {
            selector.style.display = 'none';
        }
    }

    // Переключение ИИ помощника
    toggleAIAssistant() {
        const aiAssistant = document.getElementById('ai-assistant');
        const selector = document.getElementById('category-selector');
        
        if (aiAssistant.style.display === 'none') {
            aiAssistant.style.display = 'block';
            selector.style.display = 'none';
        } else {
            aiAssistant.style.display = 'none';
        }
    }

    // Копирование в буфер обмена
    async copyToClipboard() {
        if (!this.currentExcuse) {
            return;
        }

        try {
            await navigator.clipboard.writeText(this.currentExcuse.text);
            
            // Визуальная обратная связь с анимацией
            const btn = document.getElementById('btn-copy');
            const originalText = btn.querySelector('.action-text').textContent;
            btn.classList.add('success-pulse');
            btn.querySelector('.action-text').textContent = 'Скопировано!';
            setTimeout(() => {
                btn.querySelector('.action-text').textContent = originalText;
                btn.classList.remove('success-pulse');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    // Поделиться
    async shareExcuse() {
        if (!this.currentExcuse) {
            return;
        }

        const shareData = {
            title: 'Оправдатель 3000',
            text: this.currentExcuse.text,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: копируем в буфер
                await this.copyToClipboard();
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
            }
        }
    }

    // Сохранить в избранное
    saveToFavorite() {
        if (!this.currentExcuse) {
            return;
        }

        const saved = this.storage.saveToCollection(this.currentExcuse);
        
        if (saved) {
            // Визуальная обратная связь с анимацией
            const btn = document.getElementById('btn-favorite');
            const icon = btn.querySelector('.action-icon');
            btn.classList.add('success-pulse');
            icon.textContent = '⭐';
            icon.style.transform = 'scale(1.5) rotate(360deg)';
            
            // Эффект конфетти
            this.createConfetti();
            
            setTimeout(() => {
                icon.style.transform = '';
                btn.classList.remove('success-pulse');
            }, 600);
        }
    }

    // Показать коллекцию
    showCollection() {
        const modal = document.getElementById('collection-modal');
        const list = document.getElementById('collection-list');
        
        const collection = this.storage.getCollection();
        
        if (collection.length === 0) {
            list.innerHTML = '<p class="empty-message">Коллекция пуста. Сохраните понравившиеся отговорки!</p>';
        } else {
            list.innerHTML = '';
            collection.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'collection-item';
                
                const textDiv = document.createElement('div');
                textDiv.className = 'collection-item-text';
                textDiv.textContent = item.text;
                
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'collection-item-actions';
                
                const copyBtn = document.createElement('button');
                copyBtn.className = 'collection-item-btn';
                copyBtn.textContent = 'Копировать';
                copyBtn.addEventListener('click', () => this.copyCollectionItem(item.text));
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'collection-item-btn';
                deleteBtn.textContent = 'Удалить';
                deleteBtn.addEventListener('click', () => this.removeCollectionItem(item.id));
                
                actionsDiv.appendChild(copyBtn);
                actionsDiv.appendChild(deleteBtn);
                
                itemDiv.appendChild(textDiv);
                itemDiv.appendChild(actionsDiv);
                
                list.appendChild(itemDiv);
            });
        }
        
        modal.style.display = 'flex';
    }

    // Скрыть коллекцию
    hideCollection() {
        document.getElementById('collection-modal').style.display = 'none';
    }

    // Удалить из коллекции
    removeCollectionItem(id) {
        this.storage.removeFromCollection(id);
        this.showCollection(); // Обновляем список
    }

    // Копировать элемент коллекции
    async copyCollectionItem(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    // Загрузить топ отговорок
    loadTopExcuses() {
        const topList = document.getElementById('top-list');
        const topExcuses = this.generator.getTopExcuses(5);
        
        topList.innerHTML = topExcuses.map(excuse => `
            <div class="top-item">${excuse.text}</div>
        `).join('');
    }


    // Задержка для анимаций
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// UI будет доступен глобально после инициализации

