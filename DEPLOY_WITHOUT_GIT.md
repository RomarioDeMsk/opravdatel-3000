# Размещение сайта БЕЗ Git

Если Git не установлен, можно использовать более простые способы!

---

## Вариант 1: Netlify Drag & Drop (САМЫЙ ПРОСТОЙ) ⭐

### Шаги:

1. **Подготовьте файлы**
   - Откройте папку `web/static` в проводнике Windows
   - Выделите ВСЕ файлы (Ctrl+A)
   - Создайте ZIP-архив (правой кнопкой → "Отправить" → "Сжатая ZIP-папка")
   - Или просто оставьте папку открытой

2. **Зарегистрируйтесь на Netlify**
   - Перейдите на https://www.netlify.com
   - Нажмите "Sign up" (можно через Google/GitHub/Email)
   - Подтвердите регистрацию

3. **Загрузите сайт**
   - После входа вы увидите панель управления
   - Найдите секцию "Want to deploy a new site without connecting to Git?"
   - **Перетащите папку `web/static`** прямо в эту область
   - Или нажмите "Browse to upload" и выберите папку
   - Подождите 10-30 секунд

4. **Готово!**
   - Netlify автоматически создаст URL вида: `random-name-12345.netlify.app`
   - Сайт сразу доступен!
   - Можно изменить имя в настройках (Site settings → Change site name)

### Обновление сайта:
- Просто перетащите обновленную папку снова
- Или используйте "Deploy manually" в настройках

---

## Вариант 2: GitHub через веб-интерфейс

### Шаги:

1. **Создайте аккаунт на GitHub**
   - Перейдите на https://github.com
   - Зарегистрируйтесь

2. **Создайте новый репозиторий**
   - Нажмите "+" в правом верхнем углу → "New repository"
   - Название: `opravdatel-3000`
   - Выберите "Public"
   - НЕ добавляйте README, .gitignore, лицензию
   - Нажмите "Create repository"

3. **Загрузите файлы через веб-интерфейс**
   - На странице репозитория нажмите "uploading an existing file"
   - Или перетащите файлы в область "Drag files here"
   - Загрузите ВСЕ файлы из папки `web/static`:
     - index.html
     - style.css
     - app.js
     - sw.js
     - manifest.json
     - папку `data/` (со всеми файлами внутри)
     - папку `modules/` (со всеми файлами внутри)
   - Внизу страницы нажмите "Commit changes"

4. **Включите GitHub Pages**
   - Перейдите в Settings → Pages (в меню слева)
   - В разделе "Source" выберите "Deploy from a branch"
   - Branch: `main`
   - Folder: `/ (root)`
   - Нажмите "Save"

5. **Готово!**
   - Сайт будет доступен по адресу: `https://YOUR_USERNAME.github.io/opravdatel-3000/`
   - Обычно активация занимает 1-2 минуты

### Обновление сайта:
- Загрузите обновленные файлы через веб-интерфейс GitHub
- Или установите Git позже для удобства

---

## Вариант 3: Vercel через веб-интерфейс

### Шаги:

1. **Зарегистрируйтесь на Vercel**
   - Перейдите на https://vercel.com
   - Зарегистрируйтесь через GitHub (или Email)

2. **Создайте проект**
   - Нажмите "Add New Project"
   - Выберите "Import Git Repository" (если есть GitHub)
   - Или используйте "Deploy" → "Browse" и выберите папку `web/static`

3. **Настройте проект**
   - Framework Preset: Other
   - Root Directory: оставьте пустым (или `static` если загружали всю папку)
   - Нажмите "Deploy"

4. **Готово!**
   - Сайт будет доступен по адресу: `opravdatel-3000.vercel.app`

---

## Вариант 4: Cloudflare Pages через веб-интерфейс

### Шаги:

1. **Зарегистрируйтесь на Cloudflare**
   - Перейдите на https://dash.cloudflare.com
   - Создайте бесплатный аккаунт

2. **Создайте проект Pages**
   - Перейдите в Pages → Create a project
   - Выберите "Upload assets"
   - Загрузите ZIP-архив папки `web/static`
   - Или используйте "Direct Upload"

3. **Настройте проект**
   - Project name: `opravdatel-3000`
   - Нажмите "Create project"

4. **Готово!**
   - Сайт будет доступен по адресу: `opravdatel-3000.pages.dev`

---

## Рекомендация

**Для начала используйте Netlify Drag & Drop** — это самый простой способ:
- ✅ Не требует установки программ
- ✅ Не требует знания Git
- ✅ Работает за 2 минуты
- ✅ Бесплатно
- ✅ Автоматический HTTPS

---

## Что делать дальше?

1. **Сейчас**: Используйте Netlify Drag & Drop для быстрого размещения
2. **Позже**: Установите Git (см. INSTALL_GIT.md) для удобного обновления
3. **В будущем**: Подключите GitHub к Netlify для автоматического обновления

---

## Полезные ссылки

- Netlify: https://www.netlify.com
- GitHub: https://github.com
- Vercel: https://vercel.com
- Cloudflare Pages: https://pages.cloudflare.com

