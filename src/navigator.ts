import path from 'path';
import type { PackageInfo, MonorepoInfo } from './types.js';
import { addToRecent, getSessionContext } from './context.js';

export function findPackageByName(packages: PackageInfo[], name: string): PackageInfo | null {
  const exactMatch = packages.find(pkg => pkg.name === name);
  if (exactMatch) {
    return exactMatch;
  }

  const partialMatches = packages.filter(pkg => pkg.name.includes(name));
  if (partialMatches.length === 1) {
    return partialMatches[0];
  }

  return null;
}

export function findPackageByPath(packages: PackageInfo[], targetPath: string): PackageInfo | null {
  const absoluteTargetPath = path.resolve(targetPath);

  for (const pkg of packages) {
    const absolutePkgPath = path.resolve(pkg.path);
    if (absolutePkgPath === absoluteTargetPath || absolutePkgPath.startsWith(absoluteTargetPath + path.sep)) {
      return pkg;
    }
  }

  return null;
}

export function fuzzySearchPackages(packages: PackageInfo[], query: string): PackageInfo[] {
  if (!query) {
    return packages;
  }

  const lowerQuery = query.toLowerCase();

  return packages.filter(pkg => {
    const nameMatch = pkg.name.toLowerCase().includes(lowerQuery);
    const descMatch = pkg.description?.toLowerCase().includes(lowerQuery);
    const pathMatch = pkg.path.toLowerCase().includes(lowerQuery);

    return nameMatch || descMatch || pathMatch;
  });
}

export function getRecentPackages(monorepoInfo: MonorepoInfo, limit: number = 5): PackageInfo[] {
  const recentPackageNames = new Set<string>();
  const context = getSessionContext();

  for (const name of context.recentPackages) {
    if (recentPackageNames.size >= limit) {
      break;
    }
    recentPackageNames.add(name);
  }

  const recentPackages = monorepoInfo.packages.filter(pkg =>
    recentPackageNames.has(pkg.name)
  );

  return recentPackages.sort((a, b) => {
    const indexA = context.recentPackages.indexOf(a.name);
    const indexB = context.recentPackages.indexOf(b.name);
    return indexA - indexB;
  });
}

export function getDirtyPackages(packages: PackageInfo[]): PackageInfo[] {
  return packages.filter(pkg => pkg.gitStatus !== 'clean');
}

export function switchToPackage(packageInfo: PackageInfo): string {
  addToRecent(packageInfo.name);
  return packageInfo.path;
}