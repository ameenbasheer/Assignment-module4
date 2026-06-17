/**
 * Hugging Face Inference API wrapper (replaces RapidMiner).
 *
 * We use a sentence-transformers model to measure semantic similarity
 * between a "user profile" sentence (built from what a user has bought)
 * and candidate product descriptions. The closer the meaning, the more
 * relevant the recommendation.
 *
 * Model: sentence-transformers/all-MiniLM-L6-v2  (free, fast)
 * Task : sentence-similarity -> returns a cosine-similarity score per candidate
 */

// Read config at call time so it works regardless of dotenv import order
const getModel = () =>
    process.env.HF_MODEL || "sentence-transformers/all-MiniLM-L6-v2";
const getApiKey = () => process.env.HUGGINGFACE_API_KEY;

/**
 * Returns true when a Hugging Face API key is configured.
 */
const isConfigured = () => Boolean(getApiKey());

/**
 * Get semantic-similarity scores between one source sentence and many
 * candidate sentences using the Hugging Face Inference API.
 *
 * @param {string} sourceSentence
 * @param {string[]} sentences
 * @returns {Promise<number[]>} similarity score per candidate (same order)
 */
const getSimilarityScores = async (sourceSentence, sentences) => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("HUGGINGFACE_API_KEY is not configured");
    }
    if (!sentences.length) return [];

    const url = `https://api-inference.huggingface.co/models/${getModel()}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            inputs: {
                source_sentence: sourceSentence,
                sentences,
            },
            // wait for the model to spin up instead of failing with 503
            options: { wait_for_model: true },
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(
            `Hugging Face API error ${response.status}: ${text.slice(0, 200)}`
        );
    }

    const scores = await response.json();

    if (!Array.isArray(scores)) {
        throw new Error("Unexpected Hugging Face response format");
    }

    return scores;
};

module.exports = { isConfigured, getSimilarityScores, getModel };
