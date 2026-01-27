import { describe, expect, it } from 'vitest';
import { generateEmbedding } from '../../src/utils/vector';

describe('Vector Utils', () => {
  it('should generate embedding for text using default model', async () => {
    const text = 'test text';
    const result = await generateEmbedding(text);
    console.log('result', result);
    expect(result).toBeDefined();
  });
});
