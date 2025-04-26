require('dotenv').config();
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

const repoUrl = process.env.GIT_REPO_URL;
// Use SOURCE_MD_ROOT_DIR from .env or default to 'source_md'
const targetDirName = process.env.SOURCE_MD_ROOT_DIR || 'source_md';
// Resolve the absolute path relative to the project root (assuming utils is in src)
const targetPath = path.resolve(__dirname, '..', '..', targetDirName);

// Настройка аутентификации (простой пример, может потребоваться адаптация)
const gitOptions = {
    baseDir: path.resolve(__dirname, '..', '..'), // Project root directory
    binary: 'git',
    maxConcurrentProcesses: 6,
};

/**
 * Clones the repository if it doesn't exist, or pulls the latest changes if it does.
 * Uses GIT_REPO_URL and SOURCE_MD_ROOT_DIR from .env.
 */
async function fetchAndUpdateRepo() {
    if (!repoUrl) {
        console.error('[Git Fetcher] Ошибка: Переменная окружения GIT_REPO_URL не установлена.');
        // Не выходим из процесса, позволяем preprocess решить, что делать
        throw new Error('GIT_REPO_URL is not set in .env');
    }

    const git = simpleGit(gitOptions);
    console.log(`[Git Fetcher] Целевая директория: ${targetPath}`);
    console.log(`[Git Fetcher] URL репозитория: ${repoUrl}`);

    try {
        // Проверяем существует ли директория
        let repoExists = false;
        try {
            await fs.promises.access(targetPath);
            repoExists = true;
        } catch (e) {
            repoExists = false;
        }

        if (!repoExists) {
            console.log(`[Git Fetcher] Директория не найдена. Клонирование репозитория из ${repoUrl} в ${targetPath}...`);
            // Убедимся, что родительская директория существует (если targetPath = ./source_md)
            await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
            await git.clone(repoUrl, targetPath);
            console.log('[Git Fetcher] Репозиторий успешно клонирован.');
        } else {
            console.log(`[Git Fetcher] Репозиторий найден. Обновление репозитория в ${targetPath}...`);
            // Переключаемся на работу внутри репозитория для pull
            const repoGit = simpleGit(targetPath);
            await repoGit.pull();
            console.log('[Git Fetcher] Репозиторий успешно обновлен.');
        }

        // Опционально: можно вернуть путь или статус
        return targetPath;

    } catch (error) {
        console.error('[Git Fetcher] Ошибка при работе с Git репозиторием:', error);
        // Перебрасываем ошибку дальше, чтобы preprocess мог ее обработать
        throw error;
    }
}

// Заглушка: Функция определения module_id (ОСТАВЛЕНА, но не используется в fetchAndUpdateRepo)
// **ВАЖНО:** Эту функцию нужно реализовать исходя
// из структуры папок в вашем репозитории с MD-файлами, если она нужна где-то еще.
function findModules(basePath) {
    console.warn('[Git Fetcher] Функция findModules не реализована полностью. Используется заглушка.');
    try {
        return fs.readdirSync(basePath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
            .map(dirent => ({ module_id: dirent.name, path: path.join(basePath, dirent.name) }));
    } catch (error) {
        console.error('[Git Fetcher] Ошибка при поиске модулей:', error);
        return [];
    }
}

// Экспортируем функцию для использования в других модулях
module.exports = { fetchAndUpdateRepo, findModules }; 