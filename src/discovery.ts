import fs from 'fs';
import path from 'path';
import type { PackageInfo, PackageType, DiscoveryOptions, MonorepoDetection } from './types.js';
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

  if (deps.includes('vue') || deps.includes('nuxt')) {
    return 'vue';
  }

  if (deps.includes('svelte') || deps.includes('@sveltejs/kit')) {
    return 'svelte';
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
      description: (packageJson.description as string) || undefined,
      version: (packageJson.version as string) || undefined
    };
  } catch (error) {
    return null;
  }
}

/**
 * Detect monorepo tool and workspace configuration from root
 */
export function detectMonorepoTool(rootPath: string): MonorepoDetection {
  // Check for pnpm workspace
  const pnpmWorkspacePath = path.join(rootPath, 'pnpm-workspace.yaml');
  if (fs.existsSync(pnpmWorkspacePath)) {
    return { tool: 'pnpm', rootPath };
  }

  // Check for turborepo
  if (fs.existsSync(path.join(rootPath, 'turbo.json'))) {
    return { tool: 'turborepo', rootPath };
  }

  // Check for nx
  if (fs.existsSync(path.join(rootPath, 'nx.json'))) {
    return { tool: 'nx', rootPath };
  }

  // Check for lerna
  if (fs.existsSync(path.join(rootPath, 'lerna.json'))) {
    return { tool: 'lerna', rootPath };
  }

  // Check root package.json for workspaces config
  const rootPkgPath = path.join(rootPath, 'package.json');
  if (fs.existsSync(rootPkgPath)) {
    try {
      const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));

      if (Array.isArray(rootPkg.workspaces)) {
        // yarn/npm workspaces array format
        return { tool: 'yarn', rootPath, workspaceGlobs: rootPkg.workspaces };
      }

      if (rootPkg.workspaces && Array.isArray(rootPkg.workspaces.packages)) {
        // yarn/npm workspaces object format
        return { tool: 'yarn', rootPath, workspaceGlobs: rootPkg.workspaces.packages };
      }

      // Check if pnpm via packageManager field
      if (typeof rootPkg.packageManager === 'string' && rootPkg.packageManager.startsWith('pnpm')) {
        return { tool: 'pnpm', rootPath };
      }
    } catch {
      // ignore parse errors
    }
  }

  return { tool: 'unknown', rootPath };
}

/**
 * Resolve workspace globs to actual package paths
 */
export function resolveWorkspacePackages(rootPath: string, globs: string[]): string[] {
  const packagePaths: string[] = [];

  for (const glob of globs) {
    // Handle simple glob patterns like "packages/*" or "apps/*"
    const parts = glob.split('/');
    if (parts.length >= 2 && parts[parts.length - 1] === '*') {
      const basePath = path.join(rootPath, ...parts.slice(0, -1));
      if (fs.existsSync(basePath)) {
        try {
          const entries = fs.readdirSync(basePath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.')) {
              const pkgPath = path.join(basePath, entry.name);
              if (fs.existsSync(path.join(pkgPath, 'package.json'))) {
                packagePaths.push(pkgPath);
              }
            }
          }
        } catch {
          // skip unreadable dirs
        }
      }
    }
  }

  return packagePaths;
}

export function scanForPackageJson(
  rootPath: string,
  options: DiscoveryOptions = {}
): PackageInfo[] {
  const packages: PackageInfo[] = [];
  const maxDepth = options.maxDepth || 4;
  const includeNodeModules = options.includeNodeModules || false;

  // First try workspace-aware discovery
  const detection = detectMonorepoTool(rootPath);
  if (detection.tool !== 'unknown' && detection.workspaceGlobs) {
    const workspacePaths = resolveWorkspacePackages(rootPath, detection.workspaceGlobs);
    for (const pkgPath of workspacePaths) {
      const pkgJsonPath = path.join(pkgPath, 'package.json');
      const pkg = parsePackageJson(pkgJsonPath);
      if (pkg) {
        packages.push(pkg);
      }
    }
    if (packages.length > 0) {
      return packages;
    }
  }

  // Fallback to directory scanning
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
