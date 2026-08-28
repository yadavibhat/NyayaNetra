/**
 * NyayaNetra Local Multilingual Embeddings Module
 * Uses Xenova/multilingual-e5-small (~120MB, runs locally in Node.js via ONNX runtime)
 * Supports English, Kannada, and Indian legal/investigation terminology
 */

let pipelineInstance = null;
let isInitializing = false;
let initPromise = null;
let hasLoadError = false;

async function getExtractor() {
  if (pipelineInstance) return pipelineInstance;
  if (hasLoadError) return null;
  if (initPromise) return await initPromise;

  initPromise = (async () => {
    try {
      // Dynamic import to support both CommonJS and ES Module environments
      const transformers = await import('@xenova/transformers');
      const pipeline = transformers.pipeline || transformers.default?.pipeline;
      
      console.log('Loading Xenova/multilingual-e5-small local embedding model...');
      pipelineInstance = await pipeline('feature-extraction', 'Xenova/multilingual-e5-small', {
        quantized: true
      });
      console.log('Successfully loaded Xenova/multilingual-e5-small embeddings pipeline.');
      return pipelineInstance;
    } catch (err) {
      console.warn('Failed to load @xenova/transformers pipeline. Gracefully falling back to heuristic matching:', err.message);
      hasLoadError = true;
      return null;
    }
  })();

  return await initPromise;
}

/**
 * Computes cosine similarity between two numeric vectors
 * @param {Array<number>} vecA
 * @param {Array<number>} vecB
 * @returns {number} score between -1.0 and 1.0
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates an embedding vector for a given string of text.
 * For e5 models, prepending 'query: ' or 'passage: ' optimizes semantic alignment.
 * @param {string} text
 * @param {boolean} isQuery
 * @returns {Promise<Array<number>>}
 */
async function embedText(text, isQuery = false) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return [];
  }
  try {
    const pipe = await getExtractor();
    if (!pipe) return [];

    const formattedInput = isQuery ? `query: ${text.trim()}` : `passage: ${text.trim()}`;
    const output = await pipe(formattedInput, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.warn('Embedding computation failed:', err.message);
    return [];
  }
}

module.exports = {
  embedText,
  cosineSimilarity,
  getExtractor
};
