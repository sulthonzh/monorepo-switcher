import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { getSessionContext, saveSessionContext, addToRecent, clearRecent } from '../dist/context.js';

const TEST_HISTORY_FILE = path.join(process.cwd(), 'test-history.json');

function deleteTestHistoryFile(): void {
  if (fs.existsSync(TEST_HISTORY_FILE)) {
    fs.unlinkSync(TEST_HISTORY_FILE);
  }
}

describe('Session Context', () => {
  before(() => {
    deleteTestHistoryFile();
  });

  after(() => {
    deleteTestHistoryFile();
  });

  it('returns default context when no history exists', () => {
    const context = getSessionContext();
    assert.ok(Array.isArray(context.recentPackages));
    assert.strictEqual(context.recentPackages.length, 0);
    assert.strictEqual(context.currentPackage, null);
    assert.ok(context.lastActivity instanceof Date);
  });

  it('saves and retrieves session context', () => {
    const testContext = {
      recentPackages: ['pkg1', 'pkg2'],
      currentPackage: 'pkg1',
      lastActivity: new Date()
    };

    saveSessionContext(testContext);
    const retrieved = getSessionContext();

    assert.deepStrictEqual(retrieved.recentPackages, testContext.recentPackages);
    assert.strictEqual(retrieved.currentPackage, testContext.currentPackage);
  });

  it('adds package to recent history', () => {
    clearRecent();
    addToRecent('test-package');

    const context = getSessionContext();
    assert.strictEqual(context.recentPackages[0], 'test-package');
    assert.strictEqual(context.currentPackage, 'test-package');
  });

  it('moves existing package to front when added again', () => {
    clearRecent();
    addToRecent('pkg1');
    addToRecent('pkg2');
    addToRecent('pkg1');

    const context = getSessionContext();
    assert.strictEqual(context.recentPackages[0], 'pkg1');
    assert.strictEqual(context.recentPackages[1], 'pkg2');
  });

  it('clears recent packages', () => {
    addToRecent('test-package');
    clearRecent();

    const context = getSessionContext();
    assert.strictEqual(context.recentPackages.length, 0);
    assert.strictEqual(context.currentPackage, null);
  });
});