import ollama from 'ollama';
import logger from './logger';

const DEFAULT_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || 'qwen3-embedding';

const SUPPORTED_MODELS = {
  QWEN3_EMBEDDING: 'qwen3-embedding',
  QWEN3_EMBEDDING_4B: 'qwen3-embedding:4b',
  QWEN3_VL_EMBEDDING_2B: 'Qwen3-VL-Embedding-2B',
  QWEN3_VL_RERANKER_2B: 'Qwen3-VL-Reranker-2B'
} as const;

type SupportedModel = (typeof SUPPORTED_MODELS)[keyof typeof SUPPORTED_MODELS];

export async function generateEmbedding(text: string, model?: SupportedModel): Promise<number[]> {
  const targetModel = model || DEFAULT_EMBEDDING_MODEL;
  try {
    const response = await ollama.embeddings({
      model: targetModel,
      prompt: text
    });
    return response.embedding;
  } catch (error) {
    logger.error({ error, model: targetModel }, 'Failed to generate embedding');
    throw error;
  }
}

export async function batchGenerateEmbeddings(texts: string[], model?: SupportedModel): Promise<number[][]> {
  const targetModel = model || DEFAULT_EMBEDDING_MODEL;
  try {
    const responses = await Promise.all(
      texts.map((text) =>
        ollama.embeddings({
          model: targetModel,
          prompt: text
        })
      )
    );
    return responses.map((r) => r.embedding);
  } catch (error) {
    logger.error({ error, model: targetModel }, 'Failed to generate batch embeddings');
    throw error;
  }
}

export function prepareEmbeddingText(params: { signature?: string; code: string; docComment?: string }): string {
  const parts: string[] = [];

  if (params.signature) {
    parts.push(params.signature);
  }

  parts.push(params.code);

  if (params.docComment) {
    const cleaned = params.docComment.replace(/\/\*\*|\*\/|\*|TODO|FIXME/g, '').trim();
    if (cleaned) {
      parts.push(cleaned);
    }
  }

  return parts.join('\n');
}
