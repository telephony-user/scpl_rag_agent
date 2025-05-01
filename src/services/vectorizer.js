import axios from 'axios';

// Use OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';

if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
}

/**
 * Retrieves embeddings for a list of texts using the OpenAI API.
 * 
 * @param {string[]} texts - An array of strings to get embeddings for.
 * @param {string} [model='text-embedding-3-large'] - The OpenAI model to use ('text-embedding-3-large', 'text-embedding-3-small', 'text-embedding-ada-002').
 * @returns {Promise<number[][]>} A promise that resolves to an array of embeddings (arrays of numbers).
 * @throws {Error} If the API request fails or returns an unexpected response.
 */
async function getEmbeddings(texts, model = 'text-embedding-3-large') { // Updated default model
    if (!Array.isArray(texts) || texts.length === 0) {
        return [];
    }

    // Remove explicit AbortController timeout, rely on Axios timeout
    // const controller = new AbortController();
    // const timeoutId = setTimeout(() => {
    //     console.error(`Error fetching embeddings: Request explicitly timed out after 180 seconds.`);
    //     controller.abort();
    // }, 180000);

    try {
        console.log(`Requesting embeddings from OpenAI API (Model: ${model}) for ${texts.length} texts...`);
        const response = await axios.post(OPENAI_API_URL, {
            input: texts, // OpenAI uses 'input'
            model: model  // Specify the model
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`, // Use OpenAI API Key
            },
            // Keep Axios timeout
            timeout: 170000 
            // signal: controller.signal, // Removed signal
        });

        // clearTimeout(timeoutId); // Removed clearTimeout

        const data = response.data;

        // Validate OpenAI response structure
        if (!data || !Array.isArray(data.data) || data.data.length !== texts.length) {
            console.error("Unexpected OpenAI API response structure:", data);
            throw new Error('Unexpected API response structure from OpenAI embedding service.');
        }

        // Sort results by index just in case they come out of order (OpenAI usually preserves order)
        data.data.sort((a, b) => a.index - b.index);
        
        // Extract embeddings
        const embeddings = data.data.map(item => item.embedding);
        console.log(`Successfully received ${embeddings.length} embeddings from OpenAI.`);
        return embeddings;

    } catch (error) {
        // clearTimeout(timeoutId); // Removed clearTimeout
        console.error(`Error fetching embeddings from OpenAI (Model: ${model}):`);

        // Keep detailed error handling
        if (axios.isCancel(error)) {
             console.error('--> Request aborted (likely due to timeout).');
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
             console.error(`--> Request timed out (Axios timeout: ${error.config?.timeout}ms).`);
        } else if (error.response) {
             console.error(`--> API request failed with status ${error.response.status}:`, JSON.stringify(error.response.data, null, 2));
             // Throw a more specific error message if possible
             const errorMsg = error.response.data?.error?.message || `API request failed with status ${error.response.status}`;
             throw new Error(errorMsg); 
        } else if (error.request) {
             console.error('--> No response received from server.', error.message);
             throw new Error('No response received from OpenAI embedding service.');
        } else {
             console.error('--> Error setting up request for embeddings:', error.message);
             throw new Error('Error setting up request for OpenAI embedding service.');
        }
        // Re-throw the original error or a new one
        throw error; 
    }
}

export {
    getEmbeddings,
}; 