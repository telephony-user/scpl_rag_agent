# SCPL Project

Описание вашего проекта...

## Установка

### Требования

- Node.js (версия ...)
- npm (версия ...)
- Docker
- Docker Compose
- Pandoc

### Установка Pandoc

`Pandoc` необходим для конвертации файлов `.docx` в `.md`.

- **Windows:** Скачайте установщик с [официального сайта](https://pandoc.org/installing.html).
- **macOS (используя Homebrew):** `brew install pandoc`
- **Debian/Ubuntu:** `sudo apt-get update && sudo apt-get install pandoc`
- **Другие ОС:** См. [инструкции по установке](https://pandoc.org/installing.html).

Убедитесь, что `pandoc` доступен в вашем системном `PATH`, выполнив команду:

```bash
pandoc --version
```

### Локальный запуск

1. Клонируйте репозиторий:
   ```bash
   git clone <repository_url>
   cd <repository_directory>
   ```
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Создайте файл `.env` на основе `.env.example` и заполните необходимые переменные.
4. Запустите приложение (пример):
   ```bash
   npm start
   ```

## Использование

### Предобработка Документации Модуля

Для подготовки данных из репозитория документации (файлы `.docx` и `.md`) к дальнейшей обработке используется единый скрипт `scripts/preprocess.mjs`.

**Что делает скрипт:**

1.  **Получает актуальные данные:** (Рекомендуется настроить) Сначала клонирует или обновляет локальную копию Git-репозитория с документацией (путь к репозиторию и локальной папке настраивается в `.env`).
2.  **Конвертирует DOCX в MD:** Находит все файлы `.docx` в директории указанного модуля и конвертирует их в Markdown с помощью `pandoc`.
3.  **Заменяет изображения:** Находит все изображения (не SVG) в `.md` файлах (оригинальных и сконвертированных) и пытается заменить их на Mermaid-диаграммы, используя LLM (настройки API в `.env`).
4.  **Разделяет на чанки:** Разделяет содержимое каждого обработанного `.md` файла на чанки по заголовкам (уровень настраивается в `.env`) и максимальной длине (настраивается в `.env`).
5.  **Сохраняет результат:** Сохраняет все полученные чанки для указанного модуля в единый JSON-файл в директорию `output/` (например, `output/preprocessed_chunks_ИМЯ_МОДУЛЯ.json`).

**Запуск:**

Выполните команду, заменив `<id_вашего_модуля>` на идентификатор модуля, который вы хотите обработать (это имя директории в вашем репозитории с документацией):

```bash
npm run preprocess -- --module=<id_вашего_модуля>
# Например:
# npm run preprocess -- --module=SCPL.Core.AgentHelper
```

Убедитесь, что:
*   Необходимые переменные окружения (`OPENROUTER_API_KEY`, `GIT_REPO_URL`, `SOURCE_MD_ROOT_DIR` и т.д.) установлены в файле `.env`.
*   Git-репозиторий с документацией доступен (настроена аутентификация).
*   `pandoc` установлен и доступен в `PATH`.

## Развертывание

Инструкции по развертыванию... 