export { discoverPackages, parsePackageJson, scanForPackageJson } from './discovery.js';
export { getSessionContext, saveSessionContext, addToRecent, clearRecent } from './context.js';
export { findPackageByName, findPackageByPath, fuzzySearchPackages, getRecentPackages, getDirtyPackages, switchToPackage } from './navigator.js';
export { checkGitStatus, getGitRoot, isGitRepo } from './git-status.js';
export { getConfig, saveConfig } from './config.js';

export type {
  PackageInfo,
  PackageType,
  GitStatus,
  SessionContext,
  MonorepoInfo,
  DiscoveryOptions,
  SwitcherConfig
} from './types.js';