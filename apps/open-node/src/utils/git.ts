import fs from 'node:fs/promises';
import path from 'node:path';
import simpleGit, { SimpleGit } from 'simple-git';
import { StoragePaths } from '../config';
import logger from './logger';

export class GitService {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  async clone(url: string, branch = 'master'): Promise<void> {
    logger.info({ url, branch }, 'Cloning repository');
    await this.ensureDir(this.repoPath);
    await simpleGit().clone(url, this.repoPath, ['--branch', branch, '--single-branch']);
  }

  async pull(): Promise<void> {
    logger.info('Pulling latest changes');
    await this.git.pull();
  }

  async getCurrentCommit(): Promise<string> {
    const log = await this.git.log(['-1']);
    return log.latest?.hash || '';
  }

  async getDiffFiles(fromCommit: string, toCommit: string): Promise<string[]> {
    const diff = await this.git.diff([fromCommit, toCommit, '--name-only']);
    return diff.split('\n').filter(Boolean);
  }

  async listFiles(): Promise<string[]> {
    const files = await this.git.raw(['ls-files', '-co', '--exclude-standard']);
    return files.split('\n').filter((f) => f.trim() && /\.(ts|js|tsx|jsx|md|json)$/.test(f));
  }

  async readFile(filePath: string): Promise<string> {
    const fullPath = path.join(this.repoPath, filePath);
    return fs.readFile(fullPath, 'utf-8');
  }

  private async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * 获取仓库存储路径
 */
export function getRepoPath(repoId: string): string {
  return path.join(StoragePaths.repos(), repoId);
}
