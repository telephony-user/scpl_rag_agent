require('dotenv').config();
const { QdrantClient } = require('@qdrant/qdrant-js');

const qdrantUrl = process.env.QDRANT_URL;
const qdrantApiKey = process.env.QDRANT_API_KEY; // Опционально, если требуется API ключ

let qdrantClient = null;

if (qdrantUrl) {
    const clientOptions = {
        url: qdrantUrl,
    };
    if (qdrantApiKey) {
        clientOptions.apiKey = qdrantApiKey;
    }
    qdrantClient = new QdrantClient(clientOptions);
    console.log(`Клиент Qdrant инициализирован для URL: ${qdrantUrl}`);
} else {
    console.warn('Переменная окружения QDRANT_URL не установлена. Клиент Qdrant не будет инициализирован.');
}

module.exports = qdrantClient; 