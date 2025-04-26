import dotenv from 'dotenv';
import simpleGit from 'simple-git'; // Используем import, т.к. preprocess.mjs - ESM
import fs from 'fs/promises'; // Используем промисы fs
import fse from 'fs-extra'; // Используем fs-extra для проверки существования
import path from 'path';
import { fileURLToPath } from 'url';
import { URL } from 'url'; // Для парсинга и модификации URL

dotenv.config();

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoUrlString = process.env.GIT_REPO_URL;
const accessToken = process.env.GIT_ACCESS_TOKEN; // Получаем токен из .env
const sourceMdRootDir = process.env.SOURCE_MD_ROOT_DIR || 'source_md';
const targetPath = path.resolve(__dirname, '..', '..', sourceMdRootDir); // NEW: Correct path at project root

if (!repoUrlString) {
    console.error('Ошибка: Переменная окружения GIT_REPO_URL не установлена.');
    process.exit(1);
}

let effectiveRepoUrl = repoUrlString;

// --- Обработка GIT_ACCESS_TOKEN (НЕБЕЗОПАСНО, используйте с осторожностью) ---
if (accessToken && repoUrlString.toLowerCase().startsWith('https://')) {
    try {
        const url = new URL(repoUrlString);
        if (!url.password && !url.username) { // Не перезаписываем, если уже есть данные в URL
            url.username = accessToken; // GitHub использует токен как username или password
            effectiveRepoUrl = url.toString();
            console.warn('[Git Fetcher] ВНИМАНИЕ: Используется GIT_ACCESS_TOKEN для встраивания в URL. Это менее безопасно, чем Git Credential Manager.');
        } else {
             console.warn('[Git Fetcher] GIT_ACCESS_TOKEN найден, но URL уже содержит данные пользователя/пароля. Используется оригинальный URL.');
        }
    } catch (e) {
        console.error(`[Git Fetcher] Ошибка парсинга GIT_REPO_URL: ${e.message}. Используется оригинальный URL.`);
        effectiveRepoUrl = repoUrlString;
    }
}
// ------------------------------------------------------------------------

const gitOptions = {
    baseDir: path.resolve(__dirname, '..'), // Рабочая директория для Git
    binary: 'git',
    maxConcurrentProcesses: 6,
};

// Функция для клонирования или обновления
async function fetchAndUpdateRepo() {
    const git = simpleGit(gitOptions);
    try {
        const dirExists = await fse.pathExists(targetPath);

        if (!dirExists) {
            console.log(`[Git Fetcher] Локальная директория ${targetPath} не найдена.`);
            console.log(`[Git Fetcher] Клонирование репозитория из ${repoUrlString} в ${targetPath}...`); // Логируем оригинальный URL без токена
            await git.clone(effectiveRepoUrl, targetPath);
            console.log('[Git Fetcher] Репозиторий успешно клонирован.');
        } else {
            console.log(`[Git Fetcher] Обновление репозитория в ${targetPath}...`);
            const repoGit = simpleGit(targetPath); // Инициализируем для существующей папки
            try {
                await repoGit.pull();
                console.log('[Git Fetcher] Репозиторий успешно обновлен.');
            } catch (pullError) {
                 console.error('[Git Fetcher] Ошибка при выполнении git pull:', pullError.message);
                 console.warn('[Git Fetcher] Возможно, требуется ручное разрешение конфликтов или проверка прав доступа.');
                 // Не прерываем выполнение, preprocess может работать с тем, что есть
                 // process.exit(1); // Раскомментировать, если ошибка обновления критична
            }
        }

        // Опционально: Определение module_id (требует адаптации под вашу структуру папок)
        // const modules = await findModules(targetPath); // Переделано на async
        // console.log('[Git Fetcher] Найденные модули:', modules);

    } catch (error) {
        console.error(`[Git Fetcher] Критическая ошибка при работе с Git репозиторием (${repoUrlString}):`, error);
        process.exit(1);
    }
}

// Заглушка: Функция определения module_id (async версия)
// **ВАЖНО:** Эту функцию нужно реализовать исходя из структуры папок.
async function findModules(basePath) {
    console.warn('[Git Fetcher] Функция findModules не реализована полностью. Используется заглушка.');
    try {
        const dirents = await fs.readdir(basePath, { withFileTypes: true });
        return dirents
            .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
            .map(dirent => ({ module_id: dirent.name, path: path.join(basePath, dirent.name) }));
    } catch (error) {
        console.error('[Git Fetcher] Ошибка при поиске модулей:', error);
        return [];
    }
}


// Экспортируем основную функцию для использования в preprocess.mjs
export { fetchAndUpdateRepo };

// --- Код для самостоятельного запуска скрипта (если нужно) ---
// Определяем, запущен ли файл напрямую
const scriptPath = fileURLToPath(import.meta.url);
const wasRunDirectly = process.argv[1] === scriptPath;

if (wasRunDirectly) {
    console.log('[Git Fetcher] Запуск в автономном режиме...');
    fetchAndUpdateRepo()
        .then(() => console.log('[Git Fetcher] Автономный запуск завершен.'))
        .catch(err => console.error('[Git Fetcher] Ошибка при автономном запуске:', err));
} 