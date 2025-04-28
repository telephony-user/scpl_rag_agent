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
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                input: texts,
                model: model
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.data) || data.data.length !== texts.length) {
            console.error("Unexpected API response structure:", data);
            throw new Error('Unexpected API response structure from embedding service.');
        }

        const embeddings = data.data.map(item => item.embedding);

        return embeddings;

    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            console.error('Error fetching embeddings: Request timed out after 60 seconds.');
        } else {
             console.error('Error fetching embeddings:', error);
        }
        throw error;
    }
}

export {
    getEmbeddings,
}; 