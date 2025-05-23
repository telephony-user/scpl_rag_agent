Версия: 1.4

Дата: 23 апреля 2025 г.

## **1. Введение**

Данный документ описывает требования к системе (набору скриптов Node.js и инфраструктуре), предназначенной для автоматизации процесса обработки данных для нескольких независимых модулей. Процесс начинается с **опционального начального преобразования файлов формата `.docx` в Markdown с помощью `pandoc`**. После коммита подготовленных Markdown-файлов (или исходных `.docx`, если конвертация включена в пайплайн) в специальный **Git-репозиторий документации**, **webhook уведомляет** наше Node.js приложение, развернутое на **Coolify**. Приложение **автоматически запускает конвейер**: выполняет предобработку (замена изображений на Mermaid-диаграммы, разделение по заголовкам), извлекает структурированную информацию с помощью LLM, загружает данные в реляционную (**PostgreSQL**) и векторную (Qdrant) базы данных, и, наконец, **сохраняет результаты обработки (чанковые `.md` файлы) обратно в Git-репозиторий приложения**. Система должна быть легко развертываема на Coolify и удобна для передачи заказчику.

## **2. Цели проекта**

- **Обеспечить возможность начальной конвертации** документов из формата `.docx` в Markdown.
- **Автоматизировать** процесс подготовки данных из Markdown-файлов для RAG-систем, **запускаемый через Git webhook**.
- **Реализовать поддержку нескольких модулей** с полной изоляцией данных.
- **Внедрить шаги предобработки:** замена изображений на Mermaid, семантическое разделение текста.
- **Интегрировать** внешние сервисы: **Git (для источников и для пуша результатов)**, OpenRouter (LLM), **PostgreSQL**, **vsegpt.ru (векторизация)**, Qdrant.
- **Создать** воспроизводимый и конфигурируемый конвейер данных на **Node.js**, включающий **обработчик webhook'ов** и **логику пуша результатов обратно в Git-репозиторий документации**.
- **Обеспечить** простоту развертывания на **Coolify** и передачи системы заказчику.

## **3. Системная Архитектура**

Система состоит из предварительного шага конвертации и основного, автоматически запускаемого конвейера:

**0. Предварительная Конвертация (Опционально):** Как в v1.3.

**Основной Автоматизированный Конвейер:**

1.  **Источник данных:** Markdown-файлы для модулей хранятся в **Git-репозитории Документации**.
2.  **Триггер:** Коммит (`push`) в репозиторий Документации отправляет **webhook**.
3.  **Обработчик Webhook (Node.js @ Coolify):** Приложение Node.js принимает webhook, парсит payload для определения измененного `module_id`, немедленно отвечает `200 OK` и **асинхронно запускает пайплайн** для этого модуля.
4.  **Получение Данных:** Скрипт выполняет `git pull` для репозитория Документации.
5.  **Модуль Предобработки:** (Как в v1.3) Читает `.md`, заменяет изображения на Mermaid, разделяет на чанки. Результат - чанковые `.md` файлы в постоянном хранилище Coolify.
6.  **Модуль Основной Обработки (LLM + PostgreSQL):** Обрабатывает чанки, извлекает информацию через LLM, сохраняет в **PostgreSQL**.
7.  **Модуль Векторизации (vsegpt.ru + Qdrant):** Векторизует данные из **PostgreSQL**, загружает в Qdrant.
8.  **Публикация Результатов:** После успешного завершения, скрипт клонирует/обновляет **Git-репозиторий Документации**, копирует туда чанковые `.md` файлы из хранилища Coolify, коммитит и пушит изменения.
9.  **Оркестрация и Деплоймент:** Весь стек (Node.js приложение с HTTP-сервером, **PostgreSQL**, Qdrant) управляется через **Coolify**.

```mermaid
graph TD
    subgraph "Предварительный Этап (Ручной/Скриптовый)"
        direction LR
        PRE_A[Исходные DOCX файлы] -- pandoc --> PRE_B{Конвертация};
        PRE_B -- .md файлы --> PRE_C[Структура для Git];
        PRE_B -- Изображения --> PRE_D[Папка media/];
        PRE_D --> PRE_C;
    end

    subgraph "Основной Автоматизированный Конвейер"
        direction TD
        GitDocs[Git Repo: Документация] -- 1. Push --> WH{{Webhook}};
        WH -- 2. Уведомление --> Handler[Обработчик Webhook (Node.js @ Coolify)];
        Handler -- 3. Async Start (module_id) --> Pipeline;

        subgraph Pipeline ["Пайплайн Обработки (для module_id)"]
            direction LR
            P0(4. Git Pull Docs) --> P1(5. Предобработка);
            P1 -- Чанки MD в Хранилище --> P2(6. LLM + PostgreSQL);
            P2 -- Данные для векторизации --> P3(7. Векторизация + Qdrant);
            P3 -- Успех --> P4(8. Публикация Результатов);
        end

        P1 -- Вызов LLM --> OpenRouter[OpenRouter API];
        P2 -- Данные --> PostgreSQL[(PostgreSQL @ Coolify)];
        P3 -- Текст --> Vsegpt[vsegpt.ru API];
        Vsegpt -- Векторы --> P3;
        P3 -- Векторы+Payload --> Qdrant[(Qdrant @ Coolify)];
        P4 -- Git Push --> GitDocs;

        Handler --> GitDocs; # Для Git Pull
        P4 --> Handler; # Для Git Push (через секреты Handler/Coolify)

        subgraph "Компоненты на Coolify"
            Handler; PostgreSQL; Qdrant;
        end
        subgraph "Внешние Сервисы/Репозитории"
            GitDocs; OpenRouter; Vsegpt;
        end
    end

    PRE_C --> GitDocs;

    style PRE_A fill:#eee,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5
    style PRE_B fill:#eee,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5
    style PRE_C fill:#eee,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5
    style PRE_D fill:#eee,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5
    style Handler fill:#ffcc99,stroke:#333,stroke-width:2px
    style P1 fill:#f9f,stroke:#333,stroke-width:2px
    style P2 fill:#ccf,stroke:#333,stroke-width:2px
    style P3 fill:#ccf,stroke:#333,stroke-width:2px
    style P4 fill:#99ff99,stroke:#333,stroke-width:2px
```

## **4. Функциональные Требования**

### **4.0. Предварительная Конвертация DOCX в Markdown** (Без изменений)

### **4.1. Управление Источниками Данных**

- **4.1.1. Структура Хранения:** (Без изменений) Git-репозиторий Документации с папками по `module_id`.
- **4.1.2. Идентификация Модуля:** `module_id` определяется из **payload webhook\'а** или при ручном запуске.
- **4.1.3. Доступ (Чтение Документации):** (Без изменений) Настроенный доступ для `git pull` репозитория Документации.
- **4.1.4. Webhook Триггер:**
    - В репозитории Документации должен быть настроен **webhook**, срабатывающий на событие `push`.
    - Webhook должен отправлять POST-запрос на URL эндпоинта обработчика в приложении Node.js на Coolify.
    - (Рекомендуется) Использовать секрет webhook\'а для валидации запросов.
- **4.1.5. Доступ (Запись Результатов):** Система должна иметь настроенный доступ (SSH-ключ или токен) для выполнения `git push` обратно в **Git-репозиторий Документации**.

### **4.2. Модуль Предобработки (Node.js)**

Запускается **автоматически** из обработчика webhook\'а или вручную для указанного `module_id`.

- **4.2.1. Вход:** Путь к папке модуля в локальной копии репозитория Документации.
- **4.2.2. Чтение Файлов:** (Без изменений)
- **4.2.3. Замена Изображений на Mermaid:** (Без изменений)
- **4.2.4. Разделение по Заголовкам (Сплиттинг):** (Без изменений) Разделение на чанки по H1-H6 с учетом `minChunkLength` и `maxChunkLength`.
- **4.2.5. Выход:** Набор объектов-чанков **и сохранение текста каждого чанка в отдельный `.md` файл** в папке внутри постоянного хранилища Coolify (например, `/app/source_md/<module_id>/processed_chunks/<source_file_name>/`).

### **4.3. Основной Конвейер Обработки (Node.js)**

Запускается **автоматически** после этапа 4.2.

- **4.3.1. Обработка Чанков через LLM (OpenRouter):** (Без изменений)
- **4.3.2. Сохранение в PostgreSQL:** (Без изменений)
- **4.3.3. Векторизация и Загрузка в Qdrant:** (Без изменений)
- **4.3.4. Публикация Результатов в Git (в репозиторий Документации):**
    - **Вход:** Уведомление об успешном завершении предыдущих шагов для `module_id`.
    - **Получение Результатов:** Доступ к сохраненным файлам чанков (`.md`) из постоянного хранилища Coolify (путь из 4.2.5).
    - **Работа с Git:**
        - Клонировать или обновить локальную копию **репозитория Документации** во временной директории внутри контейнера.
        - Скопировать/переместить все `.md` файлы чанков для обработанного `module_id` в целевую папку репозитория Документации (`<module_id>/processed_chunks/`).
        - Выполнить `git add <module_id>/processed_chunks`, `git commit -m "Автоматическое обновление processed chunks для модуля <module_id>"`, `git push origin <ветка>`.
        - Использовать учетные данные (токен/ключ для **записи в репозиторий Документации**) из секретов Coolify.
    - **Обработка Ошибок:** Логировать ошибки при работе с Git (клонирование, коммит, пуш).

### **4.4. Обработчик Webhook и Оркестрация (Node.js)**

- **4.4.1. HTTP Сервер:** Приложение Node.js должно включать HTTP-сервер (например, на базе `express`).
- **4.4.2. Webhook Эндпоинт:** Реализовать эндпоинт (например, `/webhook/docs-push`), слушающий POST-запросы.
- **4.4.3. Валидация Запроса:** (Рекомендуется) Проверять подпись запроса, используя секрет webhook\'а (`WEBHOOK_SECRET`).
- **4.4.4. Парсинг Payload:** Анализировать тело запроса webhook\'а от Git-провайдера для определения:
    - Списка измененных/добавленных файлов (`.md` или `.docx`).
    - Соответствующего `module_id` (из пути к файлам).
- **4.4.5. Асинхронный Запуск Пайплайна:**
    - Для каждого уникального `module_id`, затронутого коммитом:
        - **Немедленно** вернуть ответ `200 OK` Git-провайдеру.
        - **Асинхронно** запустить полный конвейер (Шаг 4.1.3 (git pull), Шаг 4.2, Шаг 4.3). Использовать `child_process.spawn` или систему очередей задач (например, BullMQ).
- **4.4.6. Обработка Ошибок:** Логировать ошибки парсинга payload, валидации секрета и запуска дочерних процессов/задач.

## **5. Модели Данных** (Без изменений)

### **5.1. Схема PostgreSQL** ...
### **5.2. Структура Payload Вектора в Qdrant (Единая коллекция)** ...

## **6. Технические Требования**

- **Язык:** Node.js LTS.
- **Зависимости Node.js:**
    - `express` (или аналог) для HTTP-сервера.
    - `axios` / `node-fetch`
    - `remark`, `remark-parse`, `mdast-util-to-markdown`, `unist-util-visit`
    - `@qdrant/js-client`, клиенты для OpenRouter, vsegpt.ru
    - **`pg` (или другой клиент/ORM для PostgreSQL)**
    - `simple-git` / `child_process`
    - `dotenv`
    - `pino` / `winston`
    - (Опционально) Библиотека для валидации webhook-подписей (например, `crypto`).
    - (Опционально) Библиотека для очередей задач (например, `bullmq`).
- **Системные Зависимости:** `pandoc`, `git`.
- **Инфраструктура:** Docker, Coolify (Node.js App, **PostgreSQL**, Qdrant).
- **Внешние API:** Git (Docs Repo), OpenRouter, vsegpt.ru.
- **Переменные Окружения / Секреты:**
    - Все предыдущие (`SOURCE_MD_ROOT_DIR`, `MIN/MAX_CHUNK...`, `OPENROUTER_API_KEY`, `GIT_REPO_URL` (Docs), `GIT_SSH_KEY_PATH`/`GIT_ACCESS_TOKEN` (Docs), `QDRANT_URL`, `QDRANT_API_KEY`, `VSEGPT_API_KEY`).
    - **Новые/Измененные:**
        - `DATABASE_URL` (или `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE`): Данные для подключения к **PostgreSQL**.
        - `WEBHOOK_SECRET`: Секрет для валидации входящих webhook'ов (использовать **Secret**).
        - `GIT_DOCS_WRITE_SSH_KEY_PATH` (или `GIT_DOCS_WRITE_PUSH_TOKEN`): Токен или путь к ключу для **`git push` в репозиторий Документации** (использовать **Secret**).
        - `GIT_DOCS_WRITE_TARGET_BRANCH`: Ветка в репозитории документации для публикации результатов.
        - `WEBHOOK_LISTENER_PORT`: Порт, на котором слушает HTTP-сервер обработчика webhook'ов (если Coolify не маппит его автоматически).
        - `GIT_COMMIT_USER`, `GIT_COMMIT_EMAIL`: Автор коммитов с результатами.

## **7. Нефункциональные Требования** (Без изменений, но важность асинхронности повышается)

- **Обработка ошибок:** ...
- **Логирование:** ...
- **Конфигурация:** ...
- **Асинхронность:** ...
- **Идемпотентность (Желательно):** ...

## **8. Развертывание и Передача Заказчику**

- **Контейнеризация:** (Без изменений) Dockerfile должен включать `pandoc` и `git`.
- **Развертывание на Coolify:**
    - Развернуть Node.js приложение, **PostgreSQL**, Qdrant.
    - Настроить **все** переменные окружения и **секреты**, включая новые для webhook'а и пуша результатов, **и для подключения к PostgreSQL**.
    - Настроить **постоянное хранилище** для `SOURCE_MD_ROOT_DIR`.
    - Убедиться, что порт `WEBHOOK_LISTENER_PORT` доступен для входящих запросов от Git-провайдера (Coolify обычно сам управляет проксированием).
- **Передача Заказчику:**
    - Git-репозиторий Приложения со всем кодом (`Dockerfile`, `.env.example`, `README.md`).
    - `README.md` должен содержать инструкции по:
        - Настройке окружения (включая `pandoc`).
        - Получению API-ключей и **токена/ключа для пуша результатов в репозиторий Документации**.
        - Заполнению `.env.example` / секретов Coolify (включая **данные для PostgreSQL**).
        - **Настройке webhook в репозитории Документации** (URL эндпоинта, секрет).
        - Выполнению шага конвертации DOCX (если он ручной).
        - Подготовке репозитория Документации.
        - Развертыванию стека на Coolify.
        - **Описанию автоматического процесса** (коммит -> webhook -> обработка -> пуш результатов).
        - (Опционально) Инструкции по ручному запуску пайплайна через терминал Coolify для отладки.
        - **Описанию структуры папки `processed_chunks` с результатами в репозитории Документации**.

## **9. За рамками проекта (Out of Scope)**

- Создание пользовательского интерфейса (UI).
- Разработка API для внешнего взаимодействия.
- Реализация сложной логики автоматических повторных попыток при сбоях пайплайна.
- **Сложная логика разрешения конфликтов** при одновременном запуске пайплайна для одного модуля (например, если два коммита пришли почти одновременно).
- Система мониторинга выполнения асинхронных задач.
- Реализация самого RAG-приложения.

## **10. Критерии Успеха**

- Документы `.docx` успешно конвертируются в `.md`...
- **Webhook от Git-провайдера успешно принимается, валидируется и парсится приложением.**
- **Изменения в репозитории документации корректно инициируют запуск полного конвейера для соответствующего модуля.**
- Конвейер успешно обрабатывает Markdown-файлы... (замена Mermaid, сплиттинг).
- Структурированные данные сохраняются в **PostgreSQL**...
- Данные успешно векторизуются и загружаются в Qdrant...
- Данные разных модулей логически изолированы.
- **Результаты обработки (чанковые `.md` файлы) успешно коммитятся и пушатся обратно в репозиторий Документации.**
- Система на Node.js успешно развертывается на Coolify...
- Процесс передачи заказчику понятен, включая настройку webhook'а.
- Логи выполнения информативны, включая логи обработки webhook'ов и асинхронных задач.
- Конфигурация и секреты управляются через переменные окружения/секреты Coolify.

## **11. История Версий**

- **v1.4 (23.04.2025):** Переход на автоматический запуск конвейера через Git webhook. Добавлены требования к HTTP-эндпоинту, обработке webhook'а, асинхронному запуску и пушу результатов в Git-репозиторий приложения. **Заменен Supabase на стандартный PostgreSQL.** Обновлена архитектура, диаграмма, технические требования, инструкции по развертыванию и критерии успеха.
- **v1.3 (22.04.2025):** Добавлен опциональный предварительный шаг конвертации DOCX в Markdown с помощью `pandoc`.
- **v1.2 (12.04.2025):** Уточнено развертывание БД на Coolify.
- **v1.1 (12.04.2025):** Уточнены требования (Git, Node.js, Qdrant).
- **v1.0 (12.04.2025):** Начальная версия документа.