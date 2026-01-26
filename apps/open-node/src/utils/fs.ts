import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { extensionMapping, SupportLanguage } from '@/indexers';

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function deleteDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

export function calculateChecksum(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath).slice(1);
}
