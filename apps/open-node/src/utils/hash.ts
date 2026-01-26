import { xxh64 } from '@node-rs/xxhash';

/**
 * 使用 xxhash64 生成文件内容的哈希值
 */
export function generateContentHash(content: string): string {
  return xxh64(Buffer.from(content)).toString(16);
}

/**
 * 生成短 ID（用于虚拟 workspace/repo）
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}
