import { describe, it } from 'node:test';
import assert from 'node:assert';
import { detectPackageType, discoverPackages } from '../dist/discovery.js';

describe('detectPackageType', () => {
  it('detects Next.js projects', () => {
    const packageJson = {
      name: 'test',
      dependencies: {
        next: '14.0.0',
        react: '18.2.0'
      }
    };
    const type = detectPackageType(packageJson);
    assert.strictEqual(type, 'next');
  });

  it('detects React Native projects', () => {
    const packageJson = {
      name: 'test',
      dependencies: {
        'react-native': '0.72.0'
      }
    };
    const type = detectPackageType(packageJson);
    assert.strictEqual(type, 'react-native');
  });

  it('detects React projects', () => {
    const packageJson = {
      name: 'test',
      dependencies: {
        react: '18.2.0'
      }
    };
    const type = detectPackageType(packageJson);
    assert.strictEqual(type, 'react');
  });

  it('detects Node.js projects', () => {
    const packageJson = {
      name: 'test',
      dependencies: {
        express: '4.18.2',
        lodash: '4.17.21'
      }
    };
    const type = detectPackageType(packageJson);
    assert.strictEqual(type, 'node');
  });

  it('detects docs projects', () => {
    const packageJson = {
      name: 'my-docs',
      dependencies: {}
    };
    const type = detectPackageType(packageJson);
    assert.strictEqual(type, 'docs');
  });

  it('detects unknown type', () => {
    const packageJson = {
      name: 'test',
      dependencies: {}
    };
    const type = detectPackageType(packageJson);
    assert.strictEqual(type, 'unknown');
  });
});

describe('discoverPackages', () => {
  it('returns empty array for non-existent path', () => {
    const packages = discoverPackages('/non/existent/path');
    assert.strictEqual(packages.length, 0);
  });

  it('discovers packages in current directory', () => {
    const packages = discoverPackages(process.cwd());
    assert.ok(Array.isArray(packages));
  });
});