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

    try {
        // Note: The request body structure might need adjustment based on the specific API requirements.
        // Common structures include { input: texts } or { texts: texts, model: model }
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            // Assuming OpenAI-compatible input structure. Adjust if vsegpt.ru differs.
            body: JSON.stringify({
                input: texts, 
                model: model // Include model if the API requires it
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();

        // Assuming OpenAI-compatible output structure { data: [{ embedding: [...] }, ...] }
        // Adjust this based on the actual structure returned by vsegpt.ru API.
        if (!data || !Array.isArray(data.data) || data.data.length !== texts.length) {
            console.error("Unexpected API response structure:", data);
            throw new Error('Unexpected API response structure from embedding service.');
        }

        // Extract embeddings in the correct order
        const embeddings = data.data.map(item => item.embedding);

        return embeddings;

    } catch (error) {
        console.error('Error fetching embeddings:', error);
        // Re-throw the error to be handled by the caller
        throw error; 
    }
}

export {
    getEmbeddings,
}; 