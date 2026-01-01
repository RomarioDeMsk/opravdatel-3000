// Модуль управления интерфейсом
export class UI {
    constructor(generator, storage) {
        this.generator = generator;
        this.storage = storage;
        this.currentExcuse = null;
        this.lastExcuseType = null; // 'serious', 'funny', 'absurd' - для чередования типов
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTopExcuses();
        
        // Оптимизация: используем requestIdleCallback для фоновых задач
        this.topExcusesInterval = null;
        this.scheduleTopExcusesUpdate();
    }
    
    // Планирование обновления топа с оптимизацией
    scheduleTopExcusesUpdate() {
        if ('requestIdleCallback' in window) {
            const updateTop = () => {
                this.loadTopExcuses();
                this.topExcusesInterval = setTimeout(() => {
                    if ('requestIdleCallback' in window) {
                        requestIdleCallback(updateTop, { timeout: 30000 });
                    } else {
                        this.topExcusesInterval = setTimeout(updateTop, 30000);
                    }
                }, 30000);
            };
            requestIdleCallback(updateTop, { timeout: 30000 });
        } else {
            // Fallback для старых браузеров
            this.topExcusesInterval = setInterval(() => {
                this.loadTopExcuses();
            }, 30000);
        }
    }
    
    // Очистка ресурсов
    destroy() {
        if (this.topExcusesInterval) {
            clearInterval(this.topExcusesInterval);
            this.topExcusesInterval = null;
        }
    }

    setupEventListeners() {
        // Кнопки генерации
        const btnRandom = document.getElementById('btn-random');
        if (btnRandom) {
            btnRandom.addEventListener('click', () => {
                this.generateRandom();
            });
        }

        const btnCategory = document.getElementById('btn-category');
        if (btnCategory) {
            btnCategory.addEventListener('click', () => {
                this.toggleCategorySelector();
            });
        }

        const btnAbsurd = document.getElementById('btn-absurd');
        if (btnAbsurd) {
            btnAbsurd.addEventListener('click', () => {
                this.generateAbsurd();
            });
        }

        const btnAI = document.getElementById('btn-ai');
        if (btnAI) {
            btnAI.addEventListener('click', () => {
                this.toggleAIAssistant();
            });
        }

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
                if (category) {
                    this.generateByCategory(category);
                    this.toggleCategorySelector();
                }
            });
        });

        // Кнопки голосования
        const btnLike = document.getElementById('btn-like');
        if (btnLike) {
            btnLike.addEventListener('click', () => {
                this.voteExcuse('like');
            });
        }

        const btnDislike = document.getElementById('btn-dislike');
        if (btnDislike) {
            btnDislike.addEventListener('click', () => {
                this.voteExcuse('dislike');
            });
        }

        const btnSuperLike = document.getElementById('btn-super-like');
        if (btnSuperLike) {
            btnSuperLike.addEventListener('click', () => {
                this.superLikeExcuse();
            });
        }

        const btnCloseFavorites = document.getElementById('btn-close-favorites');
        if (btnCloseFavorites) {
            btnCloseFavorites.addEventListener('click', () => {
                this.hideFavorites();
            });
        }

        const btnFavorites = document.getElementById('btn-favorites');
        if (btnFavorites) {
            btnFavorites.addEventListener('click', () => {
                this.toggleFavorites();
            });
        }

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

    // Генерация случайной отговорки (оптимизировано)
    async generateRandom() {
        // Отменяем предыдущую анимацию если есть
        const terminal = document.getElementById('terminal-content');
        if (terminal) {
            this.cancelTypewriterEffect(terminal);
        }
        
        // Анимация генерации
        this.animateGeneration();
        await this.delay(500);
        
        // Генерируем в следующем фрейме для плавности
        requestAnimationFrame(() => {
            const excuse = this.generator.generateRandom();
            this.displayExcuse(excuse);
        });
    }

    // Генерация по категории
    async generateByCategory(category) {
        // Анимация генерации
        this.animateGeneration();
        await this.delay(500);
        
        const excuse = this.generator.generateRandom(category);
        this.displayExcuse(excuse);
    }

    // Генерация абсурдной отговорки (оптимизировано)
    async generateAbsurd() {
        // Отменяем предыдущую анимацию если есть
        const terminal = document.getElementById('terminal-content');
        if (terminal) {
            this.cancelTypewriterEffect(terminal);
        }
        
        // Специальная анимация для абсурда
        this.animateAbsurdGeneration();
        await this.delay(800);
        
        // Генерируем в следующем фрейме для плавности
        requestAnimationFrame(() => {
            const excuse = this.generator.generateAbsurd();
            this.displayExcuse(excuse);
        });
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
        
        // Определяем тип текущей отговорки для чередования
        if (excuse.isAbsurd) {
            this.lastExcuseType = 'absurd';
        } else {
            // Определяем по тексту: если есть юмор - funny, иначе - serious
            const funnyKeywords = ['кот', 'аллергия', 'случайно', 'объявил', 'требует', 'решил', 'начал', 'попал'];
            const isFunny = funnyKeywords.some(keyword => excuse.text.toLowerCase().includes(keyword));
            this.lastExcuseType = isFunny ? 'funny' : 'serious';
        }
        
        const terminal = document.getElementById('terminal-content');
        
        // Показываем терминал если он был скрыт
        const terminalEl = document.getElementById('terminal');
        if (terminalEl) {
            terminalEl.style.display = 'block';
        }
        
        // Анимация печати
        this.typewriterEffect(terminal, excuse.text, () => {
            // После завершения печати показываем панель голосования
            this.showVotingPanel();
        });
        
        // Сохраняем в историю
        this.storage.addToHistory(excuse);
    }
    
    // Показать панель голосования
    showVotingPanel() {
        const votingPanel = document.getElementById('voting-panel');
        if (votingPanel && this.currentExcuse) {
            votingPanel.style.display = 'flex';
            this.updateVotingCounts();
        }
    }
    
    // Скрыть панель голосования
    hideVotingPanel() {
        const votingPanel = document.getElementById('voting-panel');
        if (votingPanel) {
            votingPanel.style.display = 'none';
        }
    }
    
    // Голосование за отговорку
    voteExcuse(type) {
        if (!this.currentExcuse) {
            return;
        }

        // Проверяем, не голосовал ли уже пользователь
        if (this.storage.hasVoted(this.currentExcuse.text)) {
            return; // Уже проголосовал, блокируем
        }

        // Анимация swipe как в Tinder
        const terminal = document.getElementById('terminal');
        if (terminal) {
            const direction = type === 'like' ? 'right' : 'left';
            terminal.classList.add(`swipe-${direction}`);
            
            // После анимации обновляем данные
            setTimeout(() => {
                if (type === 'like') {
                    const likes = this.storage.likeExcuse(this.currentExcuse.text);
                    if (likes !== false) {
                        const btn = document.getElementById('btn-like');
                        if (btn) {
                            btn.classList.add('voted');
                        }
                        this.updateVotingCounts();
                        this.loadTopExcuses();
                    }
                } else if (type === 'dislike') {
                    const dislikes = this.storage.dislikeExcuse(this.currentExcuse.text);
                    if (dislikes !== false) {
                        const btn = document.getElementById('btn-dislike');
                        if (btn) {
                            btn.classList.add('voted');
                        }
                        this.updateVotingCounts();
                    }
                }
                
                // Убираем класс анимации и скрываем панель голосования
                terminal.classList.remove(`swipe-${direction}`);
                this.hideVotingPanel();
                
                // Генерируем новую отговорку той же категории с чередованием типов
                setTimeout(() => {
                    this.generateNextExcuse();
                }, 300);
            }, 500);
        }
    }
    
    // Показать сообщение о следующей отговорке
    showNextExcuseMessage() {
        const terminalContent = document.getElementById('terminal-content');
        if (terminalContent) {
            terminalContent.innerHTML = '<span class="cursor-blink">Нажмите кнопку для новой отговорки...</span>';
        }
    }
    
    // Генерация следующей отговорки после голосования
    async generateNextExcuse() {
        if (!this.currentExcuse) {
            return;
        }
        
        // Определяем категорию текущей отговорки
        const category = this.currentExcuse.category || 'all';
        
        // Определяем следующий тип отговорки (чередование)
        const nextType = this.getNextExcuseType();
        
        // Генерируем новую отговорку
        const newExcuse = this.generator.generateRandomByType(category, nextType, this.currentExcuse.text);
        
        if (newExcuse) {
            // Обновляем тип для следующей итерации
            this.lastExcuseType = nextType;
            
            // Отображаем новую отговорку
            this.displayExcuse(newExcuse);
        } else {
            // Если не удалось сгенерировать, показываем сообщение
            this.showNextExcuseMessage();
        }
    }
    
    // Получить следующий тип отговорки (чередование)
    getNextExcuseType() {
        // Если это первая отговорка или тип не определен, выбираем случайно
        if (!this.lastExcuseType) {
            const types = ['serious', 'funny', 'absurd'];
            return types[Math.floor(Math.random() * types.length)];
        }
        
        // Чередуем типы: serious -> funny -> absurd -> serious...
        const typeOrder = ['serious', 'funny', 'absurd'];
        const currentIndex = typeOrder.indexOf(this.lastExcuseType);
        const nextIndex = (currentIndex + 1) % typeOrder.length;
        
        return typeOrder[nextIndex];
    }
    
    // Супер лайк (лайк + избранное)
    superLikeExcuse() {
        if (!this.currentExcuse) {
            return;
        }

        // Проверяем, не голосовал ли уже пользователь
        if (this.storage.hasVoted(this.currentExcuse.text)) {
            return; // Уже проголосовал, блокируем
        }

        // Анимация супер лайка как в Tinder
        const terminal = document.getElementById('terminal');
        if (terminal) {
            terminal.classList.add('super-like-animation');
            
            // Создаем эффект звездочек
            this.createSuperLikeEffect(terminal);
            
            // После анимации обновляем данные
            setTimeout(() => {
                // Лайкаем
                const likes = this.storage.likeExcuse(this.currentExcuse.text);
                if (likes !== false) {
                    // Добавляем в избранное
                    const saved = this.storage.saveToCollection(this.currentExcuse);
                    
                    const btn = document.getElementById('btn-super-like');
                    if (btn) {
                        btn.classList.add('voted');
                    }
                    this.updateVotingCounts();
                    this.loadTopExcuses();
                    
                    // Обновляем список избранного и показываем раздел
                    console.log('Супер лайк: сохранено в избранное:', saved);
                    this.loadFavorites();
                    const favoritesSection = document.getElementById('favorites-section');
                    if (favoritesSection) {
                        // Всегда показываем раздел избранного после супер лайка
                        this.showFavorites();
                        const collection = this.storage.getCollection();
                        console.log('Избранное обновлено. Количество:', collection.length);
                        console.log('Элементы избранного:', collection);
                    } else {
                        console.error('Элемент favorites-section не найден');
                    }
                } else {
                    console.warn('Не удалось лайкнуть отговорку (возможно, уже проголосовано)');
                }
                
                // Убираем класс анимации и скрываем панель голосования
                terminal.classList.remove('super-like-animation');
                this.hideVotingPanel();
                
                // Генерируем новую отговорку той же категории с чередованием типов
                setTimeout(() => {
                    this.generateNextExcuse();
                }, 300);
            }, 800);
        }
    }
    
    // Создать эффект звездочек для супер лайка
    createSuperLikeEffect(container) {
        const starCount = 20;
        const colors = ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#00CED1'];
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'super-like-star';
            star.style.left = `${50 + (Math.random() - 0.5) * 40}%`;
            star.style.top = `${50 + (Math.random() - 0.5) * 40}%`;
            star.style.color = colors[Math.floor(Math.random() * colors.length)];
            star.style.animationDelay = `${Math.random() * 0.3}s`;
            star.textContent = '⭐';
            container.appendChild(star);
            
            setTimeout(() => {
                star.remove();
            }, 1000);
        }
    }
    
    // Показать избранные отговорки
    showFavorites() {
        const favoritesSection = document.getElementById('favorites-section');
        if (favoritesSection) {
            this.loadFavorites();
            favoritesSection.style.display = 'block';
            // Обновляем состояние кнопки
            const btn = document.getElementById('btn-favorites');
            if (btn) {
                btn.classList.add('active');
            }
        }
    }
    
    // Скрыть избранные отговорки
    hideFavorites() {
        const favoritesSection = document.getElementById('favorites-section');
        if (favoritesSection) {
            favoritesSection.style.display = 'none';
            // Обновляем состояние кнопки
            const btn = document.getElementById('btn-favorites');
            if (btn) {
                btn.classList.remove('active');
            }
        }
    }
    
    // Переключить видимость избранного
    toggleFavorites() {
        const favoritesSection = document.getElementById('favorites-section');
        if (favoritesSection) {
            if (favoritesSection.style.display === 'none' || !favoritesSection.style.display) {
                this.showFavorites();
            } else {
                this.hideFavorites();
            }
        }
    }
    
    // Загрузить избранные отговорки (оптимизировано с DocumentFragment)
    loadFavorites() {
        const favoritesList = document.getElementById('favorites-list');
        if (!favoritesList) {
            console.error('favorites-list элемент не найден');
            return;
        }
        
        const favorites = this.storage.getCollection();
        console.log('Загрузка избранного. Найдено элементов:', favorites.length);
        
        // Используем DocumentFragment для batch DOM updates
        const fragment = document.createDocumentFragment();
        
        if (favorites.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-message';
            emptyMsg.textContent = 'У вас пока нет избранных отговорок. Используйте ⭐ для добавления!';
            fragment.appendChild(emptyMsg);
        } else {
            // Сортируем по дате (новые сверху) - оптимизированная сортировка
            const sortedFavorites = favorites.slice().sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : (a.id || 0);
                const dateB = b.date ? new Date(b.date).getTime() : (b.id || 0);
                return dateB - dateA;
            });
            
            // Создаем элементы в цикле
            sortedFavorites.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'favorite-item';
                
                const textDiv = document.createElement('div');
                textDiv.className = 'favorite-text';
                textDiv.textContent = item.text || ''; // textContent автоматически экранирует HTML
                itemDiv.appendChild(textDiv);
                
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'favorite-actions';
                
                const copyBtn = document.createElement('button');
                copyBtn.className = 'favorite-btn favorite-copy';
                copyBtn.title = 'Копировать';
                copyBtn.textContent = '📋';
                copyBtn.dataset.text = item.text || '';
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.copyToClipboard(item.text, copyBtn);
                });
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'favorite-btn favorite-remove';
                removeBtn.title = 'Удалить';
                removeBtn.textContent = '🗑️';
                removeBtn.dataset.id = item.id;
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeFavorite(parseInt(item.id));
                });
                
                actionsDiv.appendChild(copyBtn);
                actionsDiv.appendChild(removeBtn);
                itemDiv.appendChild(actionsDiv);
                fragment.appendChild(itemDiv);
            });
        }
        
        // Один раз обновляем DOM
        favoritesList.innerHTML = '';
        favoritesList.appendChild(fragment);
    }
    
    // Удалить из избранного
    removeFavorite(id) {
        this.storage.removeFromCollection(id);
        this.loadFavorites();
    }
    
    // Копировать в буфер обмена
    async copyToClipboard(text, buttonElement = null) {
        if (!text) {
            console.error('Попытка скопировать пустой текст');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(text);
            // Визуальная обратная связь
            if (buttonElement) {
                buttonElement.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    buttonElement.style.transform = '';
                }, 200);
            }
        } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback для старых браузеров
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            } catch (fallbackErr) {
                console.error('Fallback copy also failed:', fallbackErr);
            }
        }
    }
    
    // Обновить счетчики голосования
    updateVotingCounts() {
        if (!this.currentExcuse) return;
        
        const likes = this.storage.getLikesCount(this.currentExcuse.text);
        const dislikes = this.storage.getDislikesCount(this.currentExcuse.text);
        const voteType = this.storage.getVoteType(this.currentExcuse.text);
        
        const likeCountEl = document.getElementById('like-count');
        const dislikeCountEl = document.getElementById('dislike-count');
        
        if (likeCountEl) {
            likeCountEl.textContent = likes;
            likeCountEl.style.display = likes > 0 ? 'inline-block' : 'none';
        }
        
        if (dislikeCountEl) {
            dislikeCountEl.textContent = dislikes;
            dislikeCountEl.style.display = dislikes > 0 ? 'inline-block' : 'none';
        }
        
        // Обновляем состояние кнопок
        const likeBtn = document.getElementById('btn-like');
        const dislikeBtn = document.getElementById('btn-dislike');
        
        // Блокируем кнопки, если уже проголосовали
        if (this.storage.hasVoted(this.currentExcuse.text)) {
            if (voteType === 'like') {
                likeBtn?.classList.add('voted', 'disabled');
                dislikeBtn?.classList.add('disabled');
            } else if (voteType === 'dislike') {
                dislikeBtn?.classList.add('voted', 'disabled');
                likeBtn?.classList.add('disabled');
            }
        } else {
            likeBtn?.classList.remove('voted', 'disabled');
            dislikeBtn?.classList.remove('voted', 'disabled');
        }
    }

    // Эффект печатной машинки (оптимизирован с requestAnimationFrame)
    typewriterEffect(element, text, onComplete) {
        if (!element || !text) return;
        
        element.textContent = '';
        element.classList.add('typewriter');
        
        let index = 0;
        const speed = 30; // Скорость печати
        let lastTime = performance.now();
        let animationFrameId = null;
        
        const type = (currentTime) => {
            const elapsed = currentTime - lastTime;
            
            if (elapsed >= speed) {
                if (index < text.length) {
                    // Batch DOM updates - обновляем только при необходимости
                    element.textContent = text.substring(0, index + 1);
                    index++;
                    lastTime = currentTime;
                } else {
                    // Анимация завершена
                    element.classList.remove('typewriter');
                    const cursor = document.createElement('span');
                    cursor.className = 'cursor-blink';
                    cursor.textContent = '_';
                    element.appendChild(cursor);
                    
                    if (onComplete) {
                        onComplete();
                    }
                    return; // Завершаем анимацию
                }
            }
            
            animationFrameId = requestAnimationFrame(type);
        };
        
        animationFrameId = requestAnimationFrame(type);
        
        // Сохраняем ID для возможности отмены
        if (!this.typewriterAnimations) {
            this.typewriterAnimations = new Map();
        }
        this.typewriterAnimations.set(element, animationFrameId);
    }
    
    // Отмена анимации печатной машинки
    cancelTypewriterEffect(element) {
        if (this.typewriterAnimations && this.typewriterAnimations.has(element)) {
            cancelAnimationFrame(this.typewriterAnimations.get(element));
            this.typewriterAnimations.delete(element);
        }
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

