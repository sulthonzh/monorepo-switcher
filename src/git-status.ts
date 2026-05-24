import { execSync } from 'child_process';
import type { GitStatus } from './types.js';

export function checkGitStatus(packagePath: string): GitStatus {
  try {
    const output = execSync('git status --porcelain', {
      cwd: packagePath,
      encoding: 'utf-8'
    });

    if (output.trim().length === 0) {
      return 'clean';
    }

    const lines = output.trim().split('\n');
    const hasUntracked = lines.some(line => line.startsWith('??'));
    return hasUntracked ? 'untracked' : 'modified';
  } catch (error) {
    return 'clean';
  }
}

export function getGitRoot(cwd: string): string | null {
  try {
    const output = execSync('git rev-parse --show-toplevel', {
      cwd,
      encoding: 'utf-8'
    });
    return output.trim();
  } catch (error) {
    return null;
  }
}

export function isGitRepo(cwd: string): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      cwd,
      encoding: 'utf-8'
    });
    return true;
  } catch (error) {
    return false;
  }
}