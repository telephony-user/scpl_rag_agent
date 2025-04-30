// Убираем dotenv, он будет загружен через флаг
// import dotenv from 'dotenv';
// dotenv.config(); 

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import pino from 'pino';
import { Pool } from 'pg';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
// Убираем импорт url
// import { fileURLToPath, pathToFileURL } from 'url'; 
import pLimit from 'p-limit';
// +++ Возвращаем статические импорты +++
import { getEmbeddings } from '../src/services/vectorizer.js';
import { ensureCollection, upsertPoints, deletePointsByModuleId, COLLECTION_NAME } from '../src/services/qdrantClient.js';
import { v4 as uuidv4 } from 'uuid';

// Настройка логгера
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        },
    },
});

// 1. Создание Скрипта Основного Конвейера и Настройка
// =====================================================

// Парсинг аргументов командной строки
const argv = yargs(hideBin(process.argv))
    .option('module', {
        alias: 'm',
        type: 'string',
        description: 'Module ID to process',
        demandOption: true, // Делаем аргумент обязательным
    })
    .usage('Usage: $0 --module <id>')
    .help()
    .alias('help', 'h')
    .parse();

const moduleId = argv.module;

logger.info(`Starting pipeline for module: ${moduleId}`);

// Настройка клиента PostgreSQL
// Используем DATABASE_URL если он есть, иначе отдельные переменные
const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Или можно настроить так, если DATABASE_URL не используется:
    // host: process.env.PG_HOST,
    // port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
    // user: process.env.PG_USER,
    // password: process.env.PG_PASSWORD,
    // database: process.env.PG_DATABASE,
    // Рекомендуется добавить настройки для SSL в продакшене, если БД требует
    // ssl: {
    //   rejectUnauthorized: false // Или настройте CA сертификат
    // }
});

// ++ ДОБАВЛЕНО: Настройка клиента Axios для OpenRouter ++
const openRouterClient = axios.create({
    baseURL: 'https://openrouter.ai/api/v1',
    headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'scpl_pipeline_mermaid'
    }
});
// ++ КОНЕЦ ДОБАВЛЕННОГО ++

logger.info('PostgreSQL and OpenRouter clients configured.');

// --- Вспомогательные функции пайплайна ---

// 2. Чтение Обработанных Чанков
async function readProcessedChunks(moduleId) {
    const sourceMdRootDir = process.env.SOURCE_MD_ROOT_DIR || 'source_md';
    const chunksDir = path.join(sourceMdRootDir, moduleId, 'processed_chunks');
    logger.info(`Reading chunks from directory: ${chunksDir}`);

    let chunkFiles;
    try {
        chunkFiles = await fs.readdir(chunksDir);
    } catch (error) {
        if (error.code === 'ENOENT') {
            logger.error(`Chunks directory not found: ${chunksDir}`);
        } else {
            logger.error(`Error reading chunks directory ${chunksDir}:`, error);
        }
        return []; // Возвращаем пустой массив, если директория не найдена или ошибка чтения
    }

    const mdFiles = chunkFiles.filter(file => file.endsWith('.md') && file.includes('chunk'));
    mdFiles.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
      const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
      return numA - numB;
    }); // Сортируем по числовому индексу в имени файла

    logger.info(`Found ${mdFiles.length} chunk files to process.`);

    const chunksData = [];
    for (const file of mdFiles) {
        const filePath = path.join(chunksDir, file);
        try {
            // Извлекаем индекс из имени файла (например, ..._chunk_001.md -> 1)
            const match = file.match(/_chunk_(\d+)\.md$/);
            if (!match || match.length < 2) {
                logger.warn(`Could not parse chunk index from filename: ${file}. Skipping.`);
                continue;
            }
            const chunkIndex = parseInt(match[1], 10);

            const chunkText = await fs.readFile(filePath, 'utf-8');
            chunksData.push({
                index: chunkIndex,
                text: chunkText,
                sourceFileName: file // Сохраняем имя файла для возможной отладки
            });
            logger.debug(`Read chunk ${chunkIndex} from ${file}`);
        } catch (error) {
            logger.error(`Error reading or processing chunk file ${filePath}:`, error);
            // Решаем, прерывать ли процесс или пропускать файл
            // continue; // Пропустить этот файл и продолжить
             throw error; // Прерываем по умолчанию
        }
    }

    logger.info(`Successfully read data for ${chunksData.length} chunks.`);
    return chunksData;
}

// 3. Интеграция с LLM (OpenRouter) для Извлечения Информации
// ====================================================================

// Ограничитель параллельных запросов к LLM API
const limitLLM = pLimit(parseInt(process.env.LLM_CONCURRENT_LIMIT || '5', 10)); // Не более 5 запросов одновременно по умолчанию

// Промпт для LLM (можно вынести в .env или отдельный файл)
const LLM_PROMPT_TEMPLATE = process.env.LLM_PROMPT_TEMPLATE || `
Based on the following text chunk, please generate 3-5 relevant questions that a user might ask about this specific content.
Format the output as a JSON array of strings, like this: ["Question 1?", "Question 2?", "Question 3?"]
Do not include any explanation or introductory text, only the JSON array.

Answer in Russian with JSON format.

Text Chunk:
---
{chunkText}
---

`;

// Модель для использования в OpenRouter (можно вынести в .env)
const LLM_MODEL = process.env.LLM_MODEL || "openai/gpt-3.5-turbo";

async function processChunkWithLLM(chunkText) {
    const prompt = LLM_PROMPT_TEMPLATE.replace('{chunkText}', chunkText);
    logger.debug({ prompt }, `Calling LLM API (${LLM_MODEL})...`);

    try {
        const response = await openRouterClient.post('/chat/completions', {
            model: LLM_MODEL,
            messages: [
                { role: "user", content: prompt }
            ],
            // Дополнительные параметры, если нужны (temperature, max_tokens и т.д.)
            // temperature: 0.7,
            // max_tokens: 150,
            response_format: { type: "json_object" }, // Попытка получить JSON напрямую, если модель поддерживает
        });

        const content = response.data.choices[0]?.message?.content;
        if (!content) {
            logger.error('LLM response content is empty or missing.');
            return { questions: [] };
        }

        logger.trace({ content }, 'Raw LLM response content');

        // Пытаемся распарсить JSON
        let questions = [];
        try {
            // Иногда LLM может вернуть JSON внутри ```json ... ``` блока
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : content;
            const parsed = JSON.parse(jsonString);
            // Проверяем, что результат - массив строк
            if (Array.isArray(parsed) && parsed.every(q => typeof q === 'string')) {
                questions = parsed;
            } else {
                logger.warn({ parsed }, 'LLM response was valid JSON but not an array of strings. Trying to extract from object if possible.');
                // ++ ИЗМЕНЕНО: Проверяем оба варианта ключа: questions и Questions ++
                const keyToCheck = parsed.questions ? 'questions' : (parsed.Questions ? 'Questions' : null);
                if (keyToCheck && Array.isArray(parsed[keyToCheck]) && parsed[keyToCheck].every(q => typeof q === 'string')) {
                    questions = parsed[keyToCheck];
                } else {
                     logger.error({ parsed } , 'Could not parse questions array from LLM response. Trying to extract string values from object.');
                     // ++ ДОБАВЛЕНО: Попытка извлечь все строковые значения из объекта ++
                     if (typeof parsed === 'object' && parsed !== null) {
                         questions = Object.values(parsed).filter(v => typeof v === 'string');
                         if (questions.length === 0) {
                             logger.error({ parsed }, 'Could not extract any string values from LLM response object.');
                         }
                     } else {
                          logger.error({ parsed }, 'Response is not an array or a parsable object.');
                     }
                     // ++ КОНЕЦ ДОБАВЛЕННОГО ++
                }
            }
        } catch (parseError) {
            logger.error({ content, error: parseError.message }, 'Failed to parse LLM response as JSON array.');
            // Можно добавить фоллбэк - попытку извлечь строки, если парсинг не удался
        }

        logger.debug(`LLM generated ${questions.length} questions.`);
        return { questions };

    } catch (error) {
        if (error.response) {
            // Ошибка от API (статус код не 2xx)
            logger.error({
                status: error.response.status,
                data: error.response.data,
            }, `LLM API request failed with status ${error.response.status}`);
        } else if (error.request) {
            // Запрос был сделан, но ответ не получен
            logger.error('LLM API request made but no response received:', error.request);
        } else {
            // Ошибка настройки запроса
            logger.error('Error setting up LLM API request:', error.message);
        }
        return { questions: [] }; // Возвращаем пустой массив при ошибке
    }
}


// 4. Реализация Сохранения в PostgreSQL
// =================================================

// Получить ID документа по moduleId или создать новый
async function getOrCreateDocument(moduleId) {
    const client = await pgPool.connect();
    try {
        // Пытаемся найти существующий документ
        let result = await client.query(
            'SELECT id FROM documents WHERE module_id = $1',
            [moduleId]
        );

        if (result.rows.length > 0) {
            logger.debug(`Found existing document for module ${moduleId} with id ${result.rows[0].id}`);
            return result.rows[0].id;
        } else {
            // Если не найден, создаем новый
            logger.info(`Creating new document entry for module ${moduleId}`);
            result = await client.query(
                'INSERT INTO documents (module_id) VALUES ($1) RETURNING id',
                [moduleId]
            );
            logger.info(`Created new document for module ${moduleId} with id ${result.rows[0].id}`);
            return result.rows[0].id;
        }
    } catch (error) {
        logger.error({ moduleId, error: error.message, stack: error.stack }, 'Error getting or creating document in PostgreSQL');
        throw error; // Передаем ошибку дальше, чтобы прервать процесс
    } finally {
        client.release();
    }
}

// Сохранить чанк в БД
async function saveChunkToDB(chunkText, chunkIndex, documentId) {
    const client = await pgPool.connect();
    try {
        // Перед вставкой нового чанка, удалим старый с тем же индексом для данного документа,
        // чтобы избежать дубликатов при повторном запуске пайплайна.
        // Это предполагает, что пара (document_id, chunk_index) должна быть уникальной.
        // Рассмотрите добавление UNIQUE constraint в БД: ALTER TABLE chunks ADD CONSTRAINT unique_chunk_index UNIQUE (document_id, chunk_index);
        const deleteResult = await client.query(
             'DELETE FROM chunks WHERE document_id = $1 AND chunk_index = $2',
             [documentId, chunkIndex]
        );
        if (deleteResult.rowCount > 0) {
            logger.warn(`Deleted ${deleteResult.rowCount} existing chunk(s) with index ${chunkIndex} for document ${documentId} before inserting.`);
            // Также может потребоваться удалить связанные вопросы перед удалением чанка, если есть FOREIGN KEY constraint
            // await client.query('DELETE FROM questions WHERE chunk_id IN (SELECT id FROM chunks WHERE document_id = $1 AND chunk_index = $2)', [documentId, chunkIndex]);
             // Если вы используете ON DELETE CASCADE для внешнего ключа questions.chunk_id, то удалять вопросы отдельно не нужно.
        }


        const result = await client.query(
            'INSERT INTO chunks (document_id, chunk_index, text_content) VALUES ($1, $2, $3) RETURNING id',
            [documentId, chunkIndex, chunkText]
        );
        const chunkId = result.rows[0].id;
        logger.debug(`Saved chunk ${chunkIndex} for document ${documentId} with chunk_id ${chunkId}`);
        return chunkId;
    } catch (error) {
        logger.error({ documentId, chunkIndex, error: error.message, stack: error.stack }, 'Error saving chunk to PostgreSQL');
        throw error;
    } finally {
        client.release();
    }
}

// Сохранить сгенерированные вопросы в БД
async function saveQuestionsToDB(questions, chunkId, documentId) {
    if (!questions || questions.length === 0) {
        logger.debug(`No questions to save for chunk_id ${chunkId}`);
        return;
    }

    const client = await pgPool.connect();
    try {
        // Сначала удалим старые вопросы для этого chunk_id, чтобы избежать дубликатов
        await client.query('DELETE FROM questions WHERE chunk_id = $1', [chunkId]);

        // ++ ИЗМЕНЕНО: Вставляем вопросы по одному в цикле ++
        const insertQuery = 'INSERT INTO questions (chunk_id, document_id, question_text) VALUES ($1, $2, $3)';
        for (const question of questions) {
            await client.query(insertQuery, [chunkId, documentId, question]);
        }
        // ++ КОНЕЦ ИЗМЕНЕНИЯ ++

        logger.debug(`Saved ${questions.length} questions for chunk_id ${chunkId}`);
    } catch (error) {
        logger.error({ chunkId, documentId, questionsCount: questions.length, error: error.message, stack: error.stack }, 'Error saving questions to PostgreSQL');
        // Не прерываем процесс из-за ошибки сохранения вопросов, но логируем
        // throw error; // Раскомментируйте, если хотите прерывать пайплайн при ошибке сохранения вопросов
    } finally {
        client.release();
    }
}

// +++ Добавлено для Фазы 5: Получение вопросов из БД +++
/**
 * Fetches questions for a given document ID from the PostgreSQL database.
 * @param {number} documentId - The ID of the document (module).
 * @returns {Promise<Array<object>>} A promise resolving to an array of question objects { question_id, question_text, chunk_id, document_id, module_id }.
 */
async function getQuestionsForDocument(documentId) {
    const client = await pgPool.connect();
    try {
        const result = await client.query(
            `SELECT q.id as question_id, q.question_text, q.chunk_id, q.document_id, d.module_id
             FROM questions q
             JOIN documents d ON q.document_id = d.id
             WHERE q.document_id = $1`,
            [documentId]
        );
        logger.info(`Fetched ${result.rowCount} questions from DB for document_id: ${documentId}`);
        return result.rows;
    } catch (error) {
        logger.error(`Error fetching questions for document_id ${documentId}:`, error);
        throw error; // Re-throw to handle in main loop
    } finally {
        client.release();
    }
}
// --- Конец добавлений ---


// --- Основная логика выполнения Пайплайна ---
async function main() {
    logger.info(`=== Starting Pipeline Run for Module: ${moduleId} ===`);

    // --- Динамический импорт удален ---
    // const __filename = fileURLToPath(import.meta.url);
    // const __dirname = path.dirname(__filename);
    // const vectorizerPath = path.resolve(__dirname, '../src/services/vectorizer.js');
    // const qdrantClientPath = path.resolve(__dirname, '../src/services/qdrantClient.js');
    // const vectorizerURL = pathToFileURL(vectorizerPath).href;
    // const qdrantClientURL = pathToFileURL(qdrantClientPath).href;
    // const { getEmbeddings } = await import(vectorizerURL);
    // const { ensureCollection, upsertPoints, COLLECTION_NAME } = await import(qdrantClientURL);
    // logger.debug('Dynamically imported vectorizer and qdrantClient services.');

    // +++ Проверка/создание коллекции Qdrant (используем статические импорты) +++
    logger.info(`Ensuring Qdrant collection '${COLLECTION_NAME}' exists...`);
    const collectionReady = await ensureCollection();
    if (!collectionReady) {
        logger.error(`Failed to ensure Qdrant collection '${COLLECTION_NAME}'. Exiting.`);
        process.exit(1); // Выход, если не удалось подготовить коллекцию
    }
    logger.info(`Qdrant collection '${COLLECTION_NAME}' is ready.`);
    // --- Конец добавлений ---

    let documentId;
    try {
        // 1. Получаем или создаем запись документа в БД
        documentId = await getOrCreateDocument(moduleId);
        logger.info(`Using document_id: ${documentId} for module: ${moduleId}`);

        // 2. Читаем обработанные чанки из файлов
        const chunksData = await readProcessedChunks(moduleId);
        if (chunksData.length === 0) {
            logger.warn(`No chunks found for module ${moduleId}. Exiting pipeline.`);
            return; // Выход, если нет чанков для обработки
        }

        // 3. Обработка чанков: LLM и сохранение в PostgreSQL
        let totalQuestionsGenerated = 0;
        for (const chunk of chunksData) {
            logger.info(`Processing chunk ${chunk.index} for document ${documentId}...`);

            // Вызов LLM для генерации вопросов (с ограничением параллелизма)
            const llmResult = await limitLLM(() => processChunkWithLLM(chunk.text));

            // Сохраняем чанк в БД
            const chunkId = await saveChunkToDB(chunk.text, chunk.index, documentId);
            logger.info(`Saved chunk ${chunk.index} (chunk_id: ${chunkId}) to DB.`);

            // Сохраняем сгенерированные вопросы в БД
            if (llmResult.questions && llmResult.questions.length > 0) {
                await saveQuestionsToDB(llmResult.questions, chunkId, documentId);
                logger.info(`Saved ${llmResult.questions.length} questions for chunk ${chunkId} to DB.`);
                totalQuestionsGenerated += llmResult.questions.length;
            } else {
                logger.warn(`No questions generated or saved for chunk ${chunkId}.`);
            }
        }
        logger.info(`Finished processing and saving ${chunksData.length} chunks and ${totalQuestionsGenerated} questions to PostgreSQL.`);

        // +++ Добавлено для Фазы 5: Векторизация вопросов и загрузка в Qdrant +++
        if (totalQuestionsGenerated > 0) {
            logger.info(`--- Starting Vectorization and Qdrant Upload for Document ${documentId} ---`);
            try {
                // 1. Получить все вопросы для этого документа из PostgreSQL
                const questionsToVectorize = await getQuestionsForDocument(documentId);

                if (questionsToVectorize.length > 0) {
                    // +++ ВЫЗОВ УДАЛЕНИЯ ПЕРЕД ВЕКТОРИЗАЦИЕЙ И UPSERT +++
                    logger.info(`Deleting existing Qdrant points for module ${moduleId} before upsert...`);
                    await deletePointsByModuleId(moduleId); // <--- Вызываем удаление здесь
                    logger.info(`Finished deleting existing Qdrant points for module ${moduleId}.`);
                    // +++ КОНЕЦ ВЫЗОВА УДАЛЕНИЯ +++

                    // --- MODIFICATION: Batch processing for embeddings ---
                    const BATCH_SIZE = 10; // Process 10 questions per API call
                    let allEmbeddings = [];
                    let totalVectorized = 0;

                    logger.info(`Vectorizing ${questionsToVectorize.length} questions in batches of ${BATCH_SIZE}...`);

                    for (let i = 0; i < questionsToVectorize.length; i += BATCH_SIZE) {
                        const batchQuestions = questionsToVectorize.slice(i, i + BATCH_SIZE);
                        const batchTexts = batchQuestions.map(q => q.question_text);
                        const batchStartIndex = i;
                        const batchEndIndex = i + batchTexts.length -1;

                        logger.info(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: Questions ${batchStartIndex} to ${batchEndIndex}`);

                        // --- MODIFICATION: Add Retry Logic ---
                        let batchEmbeddings = null;
                        let attempts = 0;
                        const MAX_ATTEMPTS = 3;
                        const RETRY_DELAY = 20000; // Increased delay to 20 seconds

                        while (attempts < MAX_ATTEMPTS && !batchEmbeddings) {
                            attempts++;
                            try {
                                if (attempts > 1) {
                                     logger.warn(`Retrying batch ${Math.floor(i / BATCH_SIZE) + 1} (Attempt ${attempts}/${MAX_ATTEMPTS}) after delay...`);
                                     await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                                }
                                // Get embeddings for the current batch
                                const result = await getEmbeddings(batchTexts);
                                // Check if result is valid before assigning
                                if (result && result.length === batchTexts.length) {
                                    batchEmbeddings = result;
                                } else {
                                    // Log unexpected structure even on retry attempts
                                     logger.error(`Unexpected structure or partial result for batch ${Math.floor(i / BATCH_SIZE) + 1} on attempt ${attempts}. Expected ${batchTexts.length}, got ${result?.length}.`);
                                    // Optional: throw error immediately if structure is wrong, or let retry loop continue
                                    if (attempts >= MAX_ATTEMPTS) {
                                         throw new Error(`Embedding batch ${Math.floor(i / BATCH_SIZE) + 1} failed after ${MAX_ATTEMPTS} attempts due to unexpected structure.`);
                                    }
                                }

                            } catch (batchError) {
                                logger.error(`Attempt ${attempts}/${MAX_ATTEMPTS} failed for batch ${Math.floor(i / BATCH_SIZE) + 1} (questions ${batchStartIndex}-${batchEndIndex}):`, batchError.message);
                                if (attempts >= MAX_ATTEMPTS) {
                                    logger.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed after ${MAX_ATTEMPTS} attempts.`);
                                    throw batchError; // Re-throw the error after final attempt
                                }
                                // Continue loop to retry after delay
                            }
                        }
                        // --- END RETRY MODIFICATION ---

                        // Check if embeddings were successfully obtained after retries
                        if (batchEmbeddings) { // Use the variable populated in the retry loop
                            allEmbeddings.push(...batchEmbeddings);
                            totalVectorized += batchEmbeddings.length;
                            logger.debug(`Received ${batchEmbeddings.length} embeddings for batch ${Math.floor(i / BATCH_SIZE) + 1}. Total vectorized: ${totalVectorized}`);
                        } else {
                             // This should ideally not be reached if the retry loop throws on final failure
                            logger.error(`Failed to get embeddings for batch ${Math.floor(i / BATCH_SIZE) + 1} after ${MAX_ATTEMPTS} attempts. Stopping vectorization.`);
                            throw new Error(`Embedding batch failed permanently (questions ${batchStartIndex}-${batchEndIndex}).`);
                        }
                    }
                    // --- END MODIFICATION ---


                    // Use the collected embeddings (allEmbeddings)
                    if (allEmbeddings.length === questionsToVectorize.length) {
                        logger.info(`Successfully received ${allEmbeddings.length} embeddings for all batches.`);

                        // 3. Подготовить точки для Qdrant (using allEmbeddings)
                        const pointsToUpsert = questionsToVectorize.map((question, index) => ({
                            id: question.question_id, // Используем ID из БД
                            vector: allEmbeddings[index], // Use embedding from the collected results
                            payload: {
                                question_text: question.question_text,
                                question_id: question.question_id,
                                chunk_id: question.chunk_id,
                                document_id: question.document_id,
                                module_id: question.module_id,
                            },
                        }));

                        logger.info(`Prepared ${pointsToUpsert.length} points for Qdrant upsert.`);

                        // 4. Загрузить/обновить точки в Qdrant
                        await upsertPoints(pointsToUpsert);
                        logger.info(`Successfully upserted points into Qdrant collection '${COLLECTION_NAME}'.`);

                    } else {
                        // This condition might be reached if an error was thrown during batching
                        logger.error(`Failed to get embeddings for all questions. Expected ${questionsToVectorize.length}, received ${allEmbeddings.length}. Skipping Qdrant upsert.`);
                    }
                } else {
                     logger.warn(`No questions found in DB for document ${documentId} to vectorize. Skipping deletion and upsert.`);
                     // Если вопросов нет, то и удалять/добавлять нечего
                }

            } catch (vectorizationError) {
                logger.error(`Error during vectorization or Qdrant upload phase:`, vectorizationError);
            }
            logger.info(`--- Finished Vectorization and Qdrant Upload ---`);
        } else {
            // +++ ДОБАВЛЕНО: Удаление старых точек, даже если новые вопросы не сгенерированы +++
             logger.info(`No new questions were generated for module ${moduleId}. Deleting any potentially stale points from Qdrant...`);
             try {
                 await deletePointsByModuleId(moduleId);
                 logger.info(`Finished deleting potentially stale points for module ${moduleId}.`);
             } catch (deletionError) {
                  logger.error(`Error deleting stale points for module ${moduleId}:`, deletionError);
             }
            // +++ КОНЕЦ ДОБАВЛЕНИЯ +++
            // logger.info(`Skipping vectorization as no questions were generated or found for module ${moduleId}.`); // Старая строка заменена
        }
        // --- Конец добавлений ---

    } catch (error) {
        logger.error(`Pipeline failed for module ${moduleId}:`, error);
        process.exitCode = 1; // Устанавливаем код выхода в 1 при ошибке
    } finally {
        await pgPool.end(); // Закрываем пул соединений PostgreSQL
        logger.info(`PostgreSQL pool closed.`);
        logger.info(`=== Finished Pipeline Run for Module: ${moduleId} ===`);
    }
}

// Запуск основной функции
main(); 