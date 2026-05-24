import fs from 'fs';
import path from 'path';
import os from 'os';
import type { SwitcherConfig } from './types.js';

const DEFAULT_CONFIG: SwitcherConfig = {
  maxRecentPackages: 10,
  historyFilePath: path.join(os.homedir(), '.monorepo-switcher', 'history.json')
};

export function getConfig(): SwitcherConfig {
  const configPath = path.join(os.homedir(), '.monorepo-switcher', 'config.json');

  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
    } catch (error) {
      return DEFAULT_CONFIG;
    }
  }

  return DEFAULT_CONFIG;
}

export function saveConfig(config: Partial<SwitcherConfig>): void {
  const configDir = path.join(os.homedir(), '.monorepo-switcher');
  const configPath = path.join(configDir, 'config.json');

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const existingConfig = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    : {};

  const mergedConfig = { ...existingConfig, ...config };
  fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2));
}