export type PackageType = 'node' | 'react' | 'next' | 'react-native' | 'docs' | 'unknown';

export type GitStatus = 'clean' | 'modified' | 'untracked';

export interface PackageInfo {
  name: string;
  path: string;
  type: PackageType;
  dependencies: string[];
  scripts: string[];
  gitStatus: GitStatus;
  recentActivity: Date;
  description?: string;
}

export interface SessionContext {
  recentPackages: string[];
  currentPackage: string | null;
  lastActivity: Date;
}

export interface MonorepoInfo {
  root: string;
  packages: PackageInfo[];
  packageCount: number;
}

export interface DiscoveryOptions {
  maxDepth?: number;
  includeNodeModules?: boolean;
}

export interface SwitcherConfig {
  maxRecentPackages: number;
  historyFilePath: string;
}