// scripts/test_vectorizer.js
import dotenv from 'dotenv';
import { getEmbeddings } from '../src/services/vectorizer.js'; // Убедитесь, что путь правильный

// Загрузка переменных окружения из .env файла
// Это важно, так как vectorizer.js ожидает VSEGPT_API_URL и VSEGPT_API_KEY
dotenv.config();

// Пример тестовых данных
const sampleTexts = [
    "Это первое тестовое предложение для векторизации.",
    "Hello world, this is a test sentence.",
    "Третий текст для проверки API эмбеддингов.",
    "One more test."
];

// Асинхронная функция для выполнения теста
async function runVectorizerTest() {
    console.log("--- Запуск теста векторизатора ---");
    console.log("Убедитесь, что OPENAI_API_KEY задан в .env файле или переменных окружения.");

    // Check for OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
        console.error("Ошибка: Переменная окружения OPENAI_API_KEY не найдена.");
        console.log("--- Тест векторизатора прерван ---");
        return;
    }

    console.log(`\nОтправка ${sampleTexts.length} текстов для векторизации:`);
    sampleTexts.forEach((text, index) => console.log(`  [${index}]: "${text}"`));

    try {
        console.log("\nВызов getEmbeddings...");
        const startTime = Date.now();
        const embeddings = await getEmbeddings(sampleTexts);
        const duration = (Date.now() - startTime) / 1000; // Длительность в секундах

        console.log(`\n--- Тест УСПЕШНО завершен за ${duration.toFixed(2)} сек. ---`);
        console.log(`Получено эмбеддингов: ${embeddings.length}`);

        if (embeddings.length > 0 && Array.isArray(embeddings[0])) {
            console.log(`Размерность первого эмбеддинга: ${embeddings[0].length}`);
            // console.log("Первый эмбеддинг (начало):", embeddings[0].slice(0, 5)); // Показать только начало
        } else if (embeddings.length > 0) {
            console.warn("Структура первого эмбеддинга неожидана (не массив).");
        } else {
            console.warn("Получен пустой массив эмбеддингов.");
        }

    } catch (error) {
        console.error("\n--- Тест НЕ УДАЛСЯ ---");
        // Детальное логирование ошибки уже должно быть внутри getEmbeddings
        console.error("Перехвачена ошибка во время вызова getEmbeddings:", error.message);
        // Можно раскомментировать для полного стека ошибки
        // console.error(error);
    } finally {
        console.log("\n--- Тест векторизатора завершен ---");
    }
}

// Запуск тестовой функции
runVectorizerTest(); 