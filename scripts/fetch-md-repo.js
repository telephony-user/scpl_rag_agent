require('dotenv').config();
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

const repoUrl = process.env.GIT_REPO_URL;
const targetPath = path.resolve(__dirname, '../source_md'); // Директория для клонирования

if (!repoUrl) {
    console.error('Ошибка: Переменная окружения GIT_REPO_URL не установлена.');
    process.exit(1);
}

// Настройка аутентификации (простой пример, может потребоваться адаптация)
// Для SSH: Убедитесь, что SSH-ключ настроен в системе или используйте GIT_SSH_KEY_PATH
// Для HTTPS токена: Может потребоваться внедрение токена в URL или использование 'credential-helper'
const gitOptions = {
    baseDir: path.resolve(__dirname, '..'), // Рабочая директория для Git
    binary: 'git',
    maxConcurrentProcesses: 6,
};

const git = simpleGit(gitOptions);

async function fetchRepo() {
    try {
        if (!fs.existsSync(targetPath)) {
            console.log(`Клонирование репозитория из ${repoUrl} в ${targetPath}...`);
            await git.clone(repoUrl, targetPath);
            console.log('Репозиторий успешно клонирован.');
        } else {
            console.log(`Обновление репозитория в ${targetPath}...`);
            const repoGit = simpleGit(targetPath);
            await repoGit.pull();
            console.log('Репозиторий успешно обновлен.');
        }

        // Определение module_id (требует адаптации под вашу структуру папок)
        const modules = findModules(targetPath);
        console.log('Найденные модули:', modules);

    } catch (error) {
        console.error('Ошибка при работе с Git репозиторием:', error);
        process.exit(1);
    }
}

// Заглушка: Функция определения module_id
// **ВАЖНО:** Эту функцию нужно реализовать исходя
// из структуры папок в вашем репозитории с MD-файлами.
function findModules(basePath) {
    console.warn('Функция findModules не реализована полностью. Используется заглушка.');
    // Пример: ищем папки первого уровня как модули
    try {
        return fs.readdirSync(basePath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
            .map(dirent => ({ module_id: dirent.name, path: path.join(basePath, dirent.name) }));
    } catch (error) {
        console.error('Ошибка при поиске модулей:', error);
        return [];
    }
}

fetchRepo(); 