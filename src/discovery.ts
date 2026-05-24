import fs from 'fs';
import path from 'path';
import type { PackageInfo, PackageType, DiscoveryOptions } from './types.js';
import { checkGitStatus } from './git-status.js';

export function detectPackageType(packageJson: Record<string, unknown>): PackageType {
  const deps = [
    ...Object.keys((packageJson.dependencies as Record<string, string>) || {}),
    ...Object.keys((packageJson.devDependencies as Record<string, string>) || {})
  ];

  if (deps.includes('next') && deps.includes('react')) {
    return 'next';
  }

  if (deps.includes('react-native')) {
    return 'react-native';
  }

  if (deps.includes('react') || deps.includes('react-dom')) {
    return 'react';
  }

  if (deps.length > 0) {
    return 'node';
  }

  if (packageJson.name?.toString().toLowerCase().includes('doc')) {
    return 'docs';
  }

  return 'unknown';
}

export function parsePackageJson(packageJsonPath: string): PackageInfo | null {
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);

    if (!packageJson.name) {
      return null;
    }

    const dependencies = Object.keys((packageJson.dependencies as Record<string, string>) || {});
    const scripts = Object.keys((packageJson.scripts as Record<string, string>) || {});
    const packagePath = path.dirname(packageJsonPath);

    return {
      name: packageJson.name as string,
      path: packagePath,
      type: detectPackageType(packageJson),
      dependencies,
      scripts,
      gitStatus: checkGitStatus(packagePath),
      recentActivity: new Date(),
      description: (packageJson.description as string) || undefined
    };
  } catch (error) {
    return null;
  }
}

export function scanForPackageJson(
  rootPath: string,
  options: DiscoveryOptions = {}
): PackageInfo[] {
  const packages: PackageInfo[] = [];
  const maxDepth = options.maxDepth || 4;
  const includeNodeModules = options.includeNodeModules || false;

  function scanDirectory(currentPath: string, depth: number): void {
    if (depth > maxDepth) {
      return;
    }

    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          if (!includeNodeModules && entry.name === 'node_modules') {
            continue;
          }

          if (entry.name.startsWith('.')) {
            continue;
          }

          const packageJsonPath = path.join(fullPath, 'package.json');

          if (fs.existsSync(packageJsonPath)) {
            const pkg = parsePackageJson(packageJsonPath);
            if (pkg && pkg.path !== rootPath) {
              packages.push(pkg);
            }
          }

          scanDirectory(fullPath, depth + 1);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  scanDirectory(rootPath, 0);
  return packages;
}

export function discoverPackages(rootPath: string, options?: DiscoveryOptions): PackageInfo[] {
  const packages = scanForPackageJson(rootPath, options);

  // Remove duplicates based on path
  const seenPaths = new Set<string>();
  const uniquePackages: PackageInfo[] = [];

  for (const pkg of packages) {
    if (!seenPaths.has(pkg.path)) {
      seenPaths.add(pkg.path);
      uniquePackages.push(pkg);
    }
  }

  return uniquePackages.sort((a, b) => a.name.localeCompare(b.name));
}