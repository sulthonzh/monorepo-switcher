import fs from 'fs';
import path from 'path';
import type { SessionContext } from './types.js';
import { getConfig } from './config.js';

const DEFAULT_CONTEXT: SessionContext = {
  recentPackages: [],
  currentPackage: null,
  lastActivity: new Date()
};

export function getSessionContext(): SessionContext {
  const config = getConfig();
  const historyDir = path.dirname(config.historyFilePath);

  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  if (fs.existsSync(config.historyFilePath)) {
    try {
      const content = fs.readFileSync(config.historyFilePath, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        ...DEFAULT_CONTEXT,
        ...parsed,
        recentPackages: parsed.recentPackages || [],
        lastActivity: parsed.lastActivity ? new Date(parsed.lastActivity) : new Date()
      };
    } catch (error) {
      return { ...DEFAULT_CONTEXT };
    }
  }

  return { ...DEFAULT_CONTEXT };
}

export function saveSessionContext(context: SessionContext): void {
  const config = getConfig();
  const historyDir = path.dirname(config.historyFilePath);

  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  fs.writeFileSync(config.historyFilePath, JSON.stringify(context, null, 2));
}

export function addToRecent(packageName: string): void {
  const context = getSessionContext();
  const config = getConfig();

  const index = context.recentPackages.indexOf(packageName);
  if (index > -1) {
    context.recentPackages.splice(index, 1);
  }

  context.recentPackages.unshift(packageName);

  if (context.recentPackages.length > config.maxRecentPackages) {
    context.recentPackages = context.recentPackages.slice(0, config.maxRecentPackages);
  }

  context.currentPackage = packageName;
  context.lastActivity = new Date();

  saveSessionContext(context);
}

export function clearRecent(): void {
  saveSessionContext({
    recentPackages: [],
    currentPackage: null,
    lastActivity: new Date()
  });
}