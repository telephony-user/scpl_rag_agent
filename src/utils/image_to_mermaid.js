import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url'; // Добавлено для определения __filename и __dirname в ES модулях

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MERMAID_LLM_MODEL = process.env.MERMAID_LLM_MODEL || 'openai/gpt-4o';
const MERMAID_PROMPT_TEMPLATE = process.env.MERMAID_PROMPT_TEMPLATE || "Analyze the provided image (alt text: '{image_alt}'). Generate a Mermaid diagram code block (using ```mermaid ... ``` syntax) that accurately represents the information, process, or structure shown in the image. If the image content cannot be represented as a Mermaid diagram, respond with 'SKIP'.";
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Определяет MIME-тип на основе расширения файла.
 * @param {string} filePath - Путь к файлу.
 * @returns {string|null} - MIME-тип или null, если неизвестен.
 */
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.gif': return 'image/gif';
        case '.webp': return 'image/webp';
        case '.svg': return 'image/svg+xml';
        default: return null;
    }
}

/**
 * Вызывает OpenRouter API и возвращает ПОЛНЫЙ ответ LLM для изображения.
 * @param {string} imageAlt - Alt текст изображения.
 * @param {string} imageSrc - Относительный путь к изображению из MD.
 * @param {string} basePath - Абсолютный путь к директории, содержащей MD-файл.
 * @returns {Promise<string|null>} - Возвращает ПОЛНУЮ строку ответа LLM или null в случае ошибки API.
 */
async function generateMermaidFromImage(imageAlt, imageSrc, basePath) {
    console.log(`[Mermaid Generator] Начало генерации для ${imageSrc}`);
    if (!OPENROUTER_API_KEY || !MERMAID_LLM_MODEL) {
        console.error('Ошибка: Не заданы переменные окружения для OpenRouter API (OPENROUTER_API_KEY, MERMAID_LLM_MODEL)');
        return null;
    }
    if (!imageSrc) {
        console.warn('[Mermaid Generator] Пропущено: отсутствует путь к изображению (src).');
        return null;
    }

    const absoluteImagePath = imageSrc.startsWith('/')
        ? path.join(path.resolve(basePath, '..'), imageSrc)
        : path.resolve(basePath, imageSrc);

    console.log(`[Mermaid Generator] Попытка чтения изображения: ${absoluteImagePath}`);

    if (path.extname(absoluteImagePath).toLowerCase() === '.svg') {
        console.warn(`[Mermaid Generator] Пропущено: SVG файл (${absoluteImagePath}) не обрабатывается.`);
        return null;
    }

    let imageBuffer;
    try {
        imageBuffer = await fs.readFile(absoluteImagePath);
        console.log(`[Mermaid Generator] Файл изображения ${absoluteImagePath} успешно прочитан.`);
    } catch (err) {
        console.error(`[Mermaid Generator] Ошибка чтения файла изображения ${absoluteImagePath}: ${err.message}`);
        return null;
    }

    const mimeType = getMimeType(absoluteImagePath);
    if (!mimeType || mimeType === 'image/svg+xml') {
        console.warn(`[Mermaid Generator] Пропущено: неподдерживаемый или SVG MIME-тип (${mimeType || 'unknown'}) для ${absoluteImagePath}`);
        return null;
    }
    console.log(`[Mermaid Generator] Определен MIME-тип: ${mimeType} для ${absoluteImagePath}`);

    const imageBase64 = imageBuffer.toString('base64');
    const textPrompt = MERMAID_PROMPT_TEMPLATE
        .replace('{image_alt}', imageAlt || 'No alt text');

    console.log(`[Mermaid Generator] Запрос к LLM (${MERMAID_LLM_MODEL}) для ${imageSrc} (без контекста)...`);

    const messages = [
        {
            role: 'user',
            content: [
                { type: 'text', text: textPrompt },
                {
                    type: 'image_url',
                    image_url: {
                        url: `data:${mimeType};base64,${imageBase64}`
                    }
                }
            ]
        }
    ];

    try {
        const response = await axios.post(
            OPENROUTER_API_URL,
            {
                model: MERMAID_LLM_MODEL,
                messages: messages,
                max_tokens: 1024
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.APP_URL || 'http://localhost',
                    'X-Title': process.env.APP_NAME || 'SCPL Mermaid Generator',
                }
            }
        );

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            const result = response.data.choices[0].message.content.trim();
            // --- DEBUG: Выводим полный ответ LLM ---
            console.log(`[Mermaid Generator] Ответ от LLM получен для ${imageSrc}:`);
            console.log("```text");
            console.log(result);
            console.log("```");
            // --- END DEBUG ---

            // Убираем все проверки, просто возвращаем сырой результат
            console.log(`[Mermaid Generator] Возвращаем сырой ответ LLM для ${imageSrc}.`);
            return result;

        } else {
            console.error('[Mermaid Generator] Ошибка: Некорректный ответ от OpenRouter API:', response.data);
            return null;
        }
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`[Mermaid Generator] Ошибка при вызове OpenRouter API для ${imageSrc}: ${errorMessage}`);
        if (error.response && error.response.status === 429) {
            console.warn("[Mermaid Generator] Достигнут лимит запросов к API OpenRouter. Попробуйте позже.");
        }
        return null;
    }
}

/**
 * Обрабатывает Markdown-контент, заменяя HTML <img> (не SVG) на СЫРОЙ ответ LLM.
 * @param {string} markdownContent - Входной Markdown-текст.
 * @param {string} mdFilePath - Полный путь к обрабатываемому Markdown-файлу.
 * @returns {Promise<string>} - Обработанный Markdown-текст.
 */
async function replaceImagesWithMermaid(markdownContent, mdFilePath) {
    console.log(`[Main Processor] Начало обработки файла (Regex, HTML only, no SVG, RAW LLM output): ${mdFilePath}`); // Обновлен лог
    const basePath = path.dirname(mdFilePath);
    console.log(`[Main Processor] Базовый путь для изображений: ${basePath}`);

    const imgTagRegex = /<img\s+[^>]*?src\s*=\s*(["']?)(.*?)\1[^>]*?(?:alt\s*=\s*(["']?)(.*?)\3)?[^>]*?\/?>/gi;

    const matches = [];
    let match;

    console.log('[Main Processor] Поиск HTML <img> тегов...');
    while ((match = imgTagRegex.exec(markdownContent)) !== null) {
        const imageSrc = match[2];
        if (path.extname(imageSrc).toLowerCase() === '.svg') {
            console.log(`[Main Processor] Пропущен SVG HTML тег: ${match[0]}`);
            continue;
        }
        console.log('[Main Processor] Найдено совпадение HTML img (не SVG):', match[0]);
        matches.push({
            fullMatch: match[0],
            src: imageSrc,
            alt: match[4] || '',
            index: match.index,
            length: match[0].length,
        });
    }
    console.log(`[Main Processor] Найдено ${matches.length} HTML <img> тегов (не SVG) для обработки.`);

    matches.sort((a, b) => a.index - b.index);

    const replacements = [];

    for (const item of matches) {
        console.log(`[Main Processor] Обработка изображения: ${item.src} (ожидаем сырой ответ LLM)`); // Обновлен лог

        try {
            // Получаем сырой ответ LLM (или null при ошибке API)
            const rawLlmResponse = await generateMermaidFromImage(
                item.alt,
                item.src,
                basePath
            );

            // Если ответ не null (т.е. API не вернул ошибку)
            if (rawLlmResponse !== null) {
                replacements.push({
                    index: item.index,
                    length: item.length,
                    // Вставляем сырой ответ как есть.
                    // Можно добавить форматирование, например, обернуть в ```text ... ```
                    replacementText: `\n${rawLlmResponse}\n` // Добавляем переносы строк для отделения от остального текста
                });
                console.log(`[Main Processor] Запланирована замена для ${item.src} сырым ответом LLM.`);
            } else {
                 // Ошибка API произошла внутри generateMermaidFromImage (уже залогирована там)
                 console.log(`[Main Processor] Замена не требуется/не удалась (ошибка API?) для ${item.src}.`);
            }
        } catch (genError) {
            // Этот catch теперь менее вероятен, т.к. ошибки API ловятся внутри generateMermaidFromImage
            console.error(`[Main Processor] Критическая ошибка при вызове generateMermaidFromImage для ${item.src}:`, genError);
        }
    }

    let processedContent = markdownContent;
    console.log(`[Main Processor] Применение ${replacements.length} замен (сырым ответом LLM)...`); // Обновлен лог
    for (let i = replacements.length - 1; i >= 0; i--) {
        const r = replacements[i];
        processedContent = processedContent.substring(0, r.index) + r.replacementText + processedContent.substring(r.index + r.length);
    }

    console.log(`[Main Processor] Обработка файла ${mdFilePath} (RAW LLM output) завершена.`); // Обновлен лог
    return processedContent;
}

export { replaceImagesWithMermaid };

// Пример использования (для локального тестирования)
// Используем import.meta.url для определения, запущен ли файл напрямую
const currentFilePath = fileURLToPath(import.meta.url);
const scriptWasRunDirectly = process.argv[1] === currentFilePath;

if (scriptWasRunDirectly) {
    (async () => {
        const testMdRelativePath = 'pandoc sandbox/output/Модуль SCPL.Core.AgentHelper-v2-20250130_184624.md';
        const currentDir = path.dirname(currentFilePath); // Аналог __dirname
        // process.cwd() остается таким же - текущая рабочая директория, откуда запущен node
        const testMdPath = path.resolve(process.cwd(), testMdRelativePath);
        console.log(`[Test Script] Запускаем тест для файла: ${testMdPath}`);
        try {
             try {
                 await fs.access(testMdPath);
             } catch (e) {
                  console.error(`Ошибка: Тестовый Markdown файл не найден по пути ${testMdPath}. Убедитесь, что путь верен (${testMdPath}) и файл существует.`);
                  return;
             }
            const testMdContent = await fs.readFile(testMdPath, 'utf-8');
            console.log("[Test Script] Исходный Markdown прочитан.");
            const processedOutput = await replaceImagesWithMermaid(testMdContent, testMdPath);
            console.log("\n[Test Script] Обработанный результат (Markdown):");
             // console.log(processedOutput); // Раскомментировать для вывода
            const outputFilePath = path.join(path.dirname(testMdPath), 'processed_test_output_raw_llm.md'); // Новое имя файла
            await fs.writeFile(outputFilePath, processedOutput);
            console.log(`\n[Test Script] Результат записан в: ${outputFilePath}`);
        } catch (error) {
             console.error("[Test Script] Ошибка во время тестового запуска:", error);
        }
    })();
}