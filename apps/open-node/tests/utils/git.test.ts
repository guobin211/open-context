import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitService } from '../../src/utils/git';
import simpleGit from 'simple-git';

vi.mock('simple-git');

describe('GitService', () => {
  const repoPath = '/tmp/test-repo';
  let gitService: GitService;
  const mockGit: any = {
    raw: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (simpleGit as any).mockReturnValue(mockGit);
    gitService = new GitService(repoPath);
  });

  describe('listFiles', () => {
    it('should list and filter files correctly', async () => {
      const mockFilesOutput = `
src/index.ts
src/utils.js
README.md
styles.css
src/components/App.tsx
tests/test.jsx
node_modules/pkg/index.js
      `.trim();

      mockGit.raw.mockResolvedValue(mockFilesOutput);

      const files = await gitService.listFiles();

      expect(mockGit.raw).toHaveBeenCalledWith(['ls-files', '-co', '--exclude-standard']);
      expect(files).toEqual([
        'src/index.ts',
        'src/utils.js',
        'src/components/App.tsx',
        'tests/test.jsx',
        'node_modules/pkg/index.js'
      ]);
    });

    it('should return empty array if no matching files found', async () => {
      mockGit.raw.mockResolvedValue('README.md\npackage.json');

      const files = await gitService.listFiles();

      expect(files).toEqual([]);
    });

    it('should handle empty git output', async () => {
      mockGit.raw.mockResolvedValue('');

      const files = await gitService.listFiles();

      expect(files).toEqual([]);
    });

    it('should handle output with only whitespace', async () => {
      mockGit.raw.mockResolvedValue('   \n\n  ');

      const files = await gitService.listFiles();

      expect(files).toEqual([]);
    });
  });
});
