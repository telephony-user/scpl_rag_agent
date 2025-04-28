import axios from 'axios';

const API_URL = process.env.VSEGPT_API_URL;
const API_KEY = process.env.VSEGPT_API_KEY;

if (!API_URL) {
    throw new Error("VSEGPT_API_URL environment variable is not set.");
}
if (!API_KEY) {
    throw new Error("VSEGPT_API_KEY environment variable is not set.");
}

/**
 * Retrieves embeddings for a list of texts using the vsegpt.ru API (or compatible).
 * 
 * @param {string[]} texts - An array of strings to get embeddings for.
 * @param {string} [model='text-embedding-ada-002'] - Optional model name if needed by the API.
 * @returns {Promise<number[][]>} A promise that resolves to an array of embeddings (arrays of numbers).
 * @throws {Error} If the API request fails or returns an unexpected response.
 */
async function getEmbeddings(texts, model = 'emb-openai/text-embedding-3-large') {
    if (!Array.isArray(texts) || texts.length === 0) {
        return [];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        console.error(`Error fetching embeddings: Request explicitly timed out after 60 seconds.`);
        controller.abort();
    }, 60000);

    try {
        const response = await axios.post(API_URL, {
            input: texts,
            model: model
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = response.data;

        if (!data || !Array.isArray(data.data) || data.data.length !== texts.length) {
            console.error("Unexpected API response structure:", data);
            throw new Error('Unexpected API response structure from embedding service.');
        }

        const embeddings = data.data.map(item => item.embedding);

        return embeddings;

    } catch (error) {
        clearTimeout(timeoutId);

        if (axios.isCancel(error)) {
             console.error('Error fetching embeddings: Request aborted (likely due to timeout).');
        } else if (error.code === 'ECONNABORTED') {
             console.error(`Error fetching embeddings: Request timed out via axios timeout (${error.config.timeout}ms).`);
        } else if (error.response) {
             console.error(`Error fetching embeddings: API request failed with status ${error.response.status}:`, error.response.data);
             throw new Error(`API request failed with status ${error.response.status}`);
        } else if (error.request) {
             console.error('Error fetching embeddings: No response received from server.', error.message);
             throw new Error('No response received from embedding service.');
        } else {
             console.error('Error setting up request for embeddings:', error.message);
             throw new Error('Error setting up request for embedding service.');
        }
        throw error;
    }
}

export {
    getEmbeddings,
}; 