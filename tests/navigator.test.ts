import { describe, it } from 'node:test';
import assert from 'node:assert';
import { findPackageByName, fuzzySearchPackages, getDirtyPackages } from '../dist/navigator.js';
import type { PackageInfo } from '../dist/types.js';

const mockPackages: PackageInfo[] = [
  {
    name: 'backend',
    path: '/packages/backend',
    type: 'node',
    dependencies: ['express', 'lodash'],
    scripts: ['start', 'test'],
    gitStatus: 'clean',
    recentActivity: new Date(),
    description: 'Backend API service'
  },
  {
    name: 'frontend',
    path: '/packages/frontend',
    type: 'react',
    dependencies: ['react', 'react-dom'],
    scripts: ['dev', 'build'],
    gitStatus: 'modified',
    recentActivity: new Date(),
    description: 'React frontend app'
  },
  {
    name: 'admin',
    path: '/packages/admin',
    type: 'next',
    dependencies: ['next', 'react'],
    scripts: ['dev', 'build'],
    gitStatus: 'clean',
    recentActivity: new Date(),
    description: 'Admin dashboard'
  },
  {
    name: 'shared',
    path: '/packages/shared',
    type: 'node',
    dependencies: ['lodash'],
    scripts: ['build'],
    gitStatus: 'untracked',
    recentActivity: new Date(),
    description: 'Shared utilities'
  }
];

describe('findPackageByName', () => {
  it('finds package by exact name', () => {
    const found = findPackageByName(mockPackages, 'backend');
    assert.ok(found);
    assert.strictEqual(found?.name, 'backend');
  });

  it('returns null for non-existent package', () => {
    const found = findPackageByName(mockPackages, 'non-existent');
    assert.strictEqual(found, null);
  });

  it('finds package by partial name when unique', () => {
    const found = findPackageByName(mockPackages, 'back');
    assert.ok(found);
    assert.strictEqual(found?.name, 'backend');
  });

  it('returns null for partial name with multiple matches', () => {
    const found = findPackageByName(mockPackages, 'e');
    assert.strictEqual(found, null);
  });
});

describe('fuzzySearchPackages', () => {
  it('returns all packages when query is empty', () => {
    const results = fuzzySearchPackages(mockPackages, '');
    assert.strictEqual(results.length, 4);
  });

  it('filters by name', () => {
    const results = fuzzySearchPackages(mockPackages, 'front');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, 'frontend');
  });

  it('filters by description', () => {
    const results = fuzzySearchPackages(mockPackages, 'API');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, 'backend');
  });

  it('is case insensitive', () => {
    const results = fuzzySearchPackages(mockPackages, 'BACKEND');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, 'backend');
  });

  it('returns empty array when no matches', () => {
    const results = fuzzySearchPackages(mockPackages, 'xyz');
    assert.strictEqual(results.length, 0);
  });
});

describe('getDirtyPackages', () => {
  it('filters packages with uncommitted changes', () => {
    const dirty = getDirtyPackages(mockPackages);
    assert.strictEqual(dirty.length, 2);
    assert.ok(dirty.some(p => p.name === 'frontend'));
    assert.ok(dirty.some(p => p.name === 'shared'));
  });

  it('returns empty array when all packages are clean', () => {
    const cleanPackages = mockPackages.map(p => ({ ...p, gitStatus: 'clean' as const }));
    const dirty = getDirtyPackages(cleanPackages);
    assert.strictEqual(dirty.length, 0);
  });
});