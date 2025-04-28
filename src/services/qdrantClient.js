import { QdrantClient } from '@qdrant/js-client-rest';
import pino from 'pino';

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

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME;
const VECTOR_SIZE = parseInt(process.env.QDRANT_VECTOR_SIZE, 10);

if (!QDRANT_URL) {
    throw new Error("QDRANT_URL environment variable is not set.");
}
if (!COLLECTION_NAME) {
    throw new Error("QDRANT_COLLECTION_NAME environment variable is not set.");
}
if (!VECTOR_SIZE || isNaN(VECTOR_SIZE)) {
    throw new Error("QDRANT_VECTOR_SIZE environment variable is not set or invalid.");
}

// Initialize Qdrant Client
const qdrantClient = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY, // The client handles the case where apiKey is undefined
});

/**
 * Ensures that the specified Qdrant collection exists, creating it if necessary.
 * 
 * @param {string} collectionName - The name of the collection.
 * @param {number} vectorSize - The dimensionality of the vectors.
 * @param {string} distanceMetric - The distance metric (e.g., 'Cosine', 'Euclid', 'Dot').
 * @returns {Promise<boolean>} A promise that resolves to true if the collection exists or was created, false otherwise.
 */
async function ensureCollection(collectionName = COLLECTION_NAME, vectorSize = VECTOR_SIZE, distanceMetric = 'Cosine') {
    try {
        const result = await qdrantClient.getCollections();
        const collectionExists = result.collections.some((collection) => collection.name === collectionName);

        if (collectionExists) {
            logger.info(`Collection '${collectionName}' already exists.`);
            // Optionally, verify if the existing collection has the correct vector size/distance metric.
            // const collectionInfo = await qdrantClient.getCollection(collectionName);
            // if (collectionInfo.vectors_config?.params?.size !== vectorSize || collectionInfo.vectors_config?.params?.distance !== distanceMetric) {
            //     logger.warn(`Collection '${collectionName}' exists but has different configuration!`);
            //     // Handle mismatch if necessary (e.g., throw error, delete/recreate)
            // }
            return true;
        } else {
            logger.info(`Collection '${collectionName}' does not exist. Creating...`);
            await qdrantClient.createCollection(collectionName, {
                vectors: {
                    size: vectorSize,
                    distance: distanceMetric,
                },
            });
            logger.info(`Collection '${collectionName}' created successfully.`);
            return true;
        }
    } catch (error) {
        logger.error({ error }, `Error ensuring collection '${collectionName}'`);
        return false;
    }
}

/**
 * Upserts (inserts or updates) points into the specified Qdrant collection.
 * 
 * @param {Array<object>} points - An array of point objects. Each object should have 'id', 'vector', and 'payload'.
 * @param {string} collectionName - The name of the collection.
 * @returns {Promise<object>} A promise that resolves to the result of the upsert operation.
 * @throws {Error} If the upsert operation fails.
 */
async function upsertPoints(points, collectionName = COLLECTION_NAME) {
    if (!Array.isArray(points) || points.length === 0) {
        logger.info("No points provided for upsert.");
        return null;
    }

    try {
        // Use wait: true to ensure the operation is completed before returning
        const result = await qdrantClient.upsert(collectionName, { 
            wait: true, 
            points: points 
        }); 
        logger.info(`Upserted ${points.length} points into collection '${collectionName}'. Status: ${result.status}`);
        if (result.status !== 'completed') {
             logger.warn({ result }, 'Qdrant upsert operation did not complete successfully');
        }
        return result;
    } catch (error) {
        logger.error({ error }, `Error upserting points into collection '${collectionName}'`);
        throw error; // Re-throw to be handled by the caller
    }
}

/**
 * Удаляет точки из коллекции Qdrant, соответствующие указанному module_id.
 * @param {string} moduleId - ID модуля, чьи точки нужно удалить.
 */
export async function deletePointsByModuleId(moduleId) {
    if (!moduleId) {
        logger.warn('Module ID not provided for deletion. Skipping.');
        return;
    }
    logger.info(`Attempting to delete points for module_id '${moduleId}' from collection '${COLLECTION_NAME}'...`);

    try {
        const filter = {
            must: [
                {
                    key: 'module_id', 
                    match: {
                        value: moduleId,
                    },
                },
            ],
        };

        const response = await qdrantClient.delete(
            COLLECTION_NAME, 
            {
                filter: filter
            }
        );

        logger.info(`Deletion operation for module_id '${moduleId}' completed. Status: ${response.status}.`);

    } catch (error) {
        logger.error({ 
            error: error,
            errorMessage: error?.message,
            errorStack: error?.stack,
            responseData: error?.response?.data
        }, `Error deleting points for module_id '${moduleId}' from collection '${COLLECTION_NAME}'`);

        if (error.response?.data) {
            logger.error('Qdrant API Error details:', error.response.data);
        }
        // Пока не пробрасываем ошибку, чтобы увидеть лог
        // throw error; 
    }
}

export {
    qdrantClient,
    ensureCollection,
    upsertPoints,
    COLLECTION_NAME, // Export collection name for convenience
}; 