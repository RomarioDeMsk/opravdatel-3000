# Установка Git на Windows

## Способ 1: Через официальный установщик (Рекомендуется)

1. **Скачайте Git для Windows**
   - Перейдите на https://git-scm.com/download/win
   - Скачайте установщик (автоматически определит 64-bit или 32-bit)

2. **Установите Git**
   - Запустите установщик
   - Нажимайте "Next" на всех шагах (настройки по умолчанию подойдут)
   - В конце выберите "Git from the command line and also from 3rd-party software"
   - Завершите установку

3. **Проверьте установку**
   - Откройте PowerShell заново
   - Выполните: `git --version`
   - Должна появиться версия Git

## Способ 2: Через winget (если установлен)

```powershell
winget install --id Git.Git -e --source winget
```

## Способ 3: Через Chocolatey (если установлен)

```powershell
choco install git
```

## После установки

1. **Закройте и откройте PowerShell заново**
2. **Настройте Git (первый раз)**
   ```powershell
   # Установите ваше имя (обязательно в кавычках!)
   git config --global user.name "RomarioDeMsk"
   
   # Установите ваш email (обязательно в кавычках!)
   git config --global user.email "ваш@email.com"
   ```
   
   ⚠️ **Важно**: 
   - Имя и email должны быть в кавычках
   - Используйте `user.name` и `user.email` как ключи
   - Email может быть любым (даже несуществующим)

3. **Проверьте настройки**
   ```powershell
   git config --global --list
   ```

4. **Теперь можно использовать Git команды**

