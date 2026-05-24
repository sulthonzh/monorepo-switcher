import process from 'process';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { Command } from 'commander';
import { discoverPackages } from './discovery.js';
import {
  findPackageByName,
  fuzzySearchPackages,
  getRecentPackages,
  getDirtyPackages,
  switchToPackage
} from './navigator.js';
import { getSessionContext, clearRecent } from './context.js';
import { getGitRoot } from './git-status.js';
import type { PackageInfo } from './types.js';

const program = new Command();

program
  .name('monorepo-switcher')
  .description('Intelligent CLI tool for quickly switching between packages in monorepos')
  .version('1.0.0');

function getMonorepoRoot(): string {
  const gitRoot = getGitRoot(process.cwd());
  if (gitRoot) {
    return gitRoot;
  }
  return process.cwd();
}

function displayPackage(packageInfo: PackageInfo): string {
  const statusIcon = packageInfo.gitStatus === 'clean' ? chalk.green('✅') :
                     packageInfo.gitStatus === 'modified' ? chalk.yellow('🔥') :
                     chalk.blue('📋');

  const typeBadge = packageInfo.type === 'react' ? chalk.cyan('[React]') :
                    packageInfo.type === 'next' ? chalk.cyan('[Next]') :
                    packageInfo.type === 'react-native' ? chalk.magenta('[RN]') :
                    packageInfo.type === 'node' ? chalk.green('[Node]') :
                    packageInfo.type === 'docs' ? chalk.gray('[Docs]') :
                    chalk.gray('[Unknown]');

  const name = chalk.bold(packageInfo.name);
  const desc = packageInfo.description ? chalk.gray(` - ${packageInfo.description}`) : '';

  return `${statusIcon} ${typeBadge} ${name}${desc}`;
}

function displayPackageList(packages: PackageInfo[], title: string): void {
  if (packages.length === 0) {
    return;
  }

  console.log(chalk.bold(`\n${title}:`));
  for (const pkg of packages) {
    console.log(`  ${displayPackage(pkg)}`);
  }
}

async function interactiveMode(packages: PackageInfo[]): Promise<void> {
  const choices = packages.map(pkg => ({
    name: displayPackage(pkg),
    value: pkg.name,
    short: pkg.name
  }));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'package',
      message: 'Select a package to switch to:',
      choices,
      pageSize: 15
    }
  ]);

  const selected = packages.find(pkg => pkg.name === answers.package);
  if (selected) {
    const targetPath = switchToPackage(selected);
    console.log(chalk.green(`\n✓ Switched to: ${selected.name}`));
    console.log(chalk.gray(`  Path: ${targetPath}`));
    console.log(chalk.gray(`  Run: cd ${targetPath}`));
    process.exit(0);
  }
}

program
  .argument('[package]', 'Package name or path to switch to')
  .option('-f, --fuzzy', 'Enable fuzzy search mode')
  .option('-r, --recent', 'Show only recently used packages')
  .option('-d, --dirty', 'Show only packages with uncommitted changes')
  .option('-i, --interactive', 'Interactive package selection')
  .option('-l, --list', 'List all packages without switching')
  .action(async (target: string | undefined, options) => {
    const spinner = ora('Discovering packages...').start();

    const root = getMonorepoRoot();
    const packages = discoverPackages(root);

    spinner.succeed(`Found ${packages.length} packages in monorepo`);

    if (packages.length === 0) {
      console.log(chalk.yellow('\nNo packages found in monorepo'));
      console.log(chalk.gray(`  Root: ${root}`));
      process.exit(0);
    }

    let filteredPackages = packages;

    if (options.recent) {
      const context = getSessionContext();
      filteredPackages = packages.filter(pkg => context.recentPackages.includes(pkg.name));
    }

    if (options.dirty) {
      filteredPackages = getDirtyPackages(packages);
    }

    if (target && options.fuzzy) {
      filteredPackages = fuzzySearchPackages(packages, target);
    }

    if (options.list) {
      console.log(chalk.bold(`\n📦 Monorepo: ${root}`));

      if (options.recent || options.dirty) {
        displayPackageList(filteredPackages, options.recent ? '🎯 Recently Used' : '🔥 Dirty Packages');
      } else {
        const recent = getRecentPackages({ root, packages, packageCount: packages.length });

        displayPackageList(recent, '🎯 Recently Used');
        displayPackageList(packages, '🔍 All Packages');
      }

      process.exit(0);
    }

    if (options.interactive || !target) {
      await interactiveMode(filteredPackages);
      return;
    }

    const found = findPackageByName(packages, target);
    if (!found) {
      console.log(chalk.red(`\n✗ Package not found: ${target}`));
      console.log(chalk.gray(`  Run without arguments to see available packages`));
      process.exit(1);
    }

    const targetPath = switchToPackage(found);
    console.log(chalk.green(`\n✓ Switched to: ${found.name}`));
    console.log(chalk.gray(`  Path: ${targetPath}`));
    console.log(chalk.gray(`  Run: cd ${targetPath}`));
  });

program
  .command('recent')
  .description('Show recently used packages')
  .option('-n, --number <num>', 'Number of recent packages to show', '5')
  .action(async (options) => {
    const root = getMonorepoRoot();
    const packages = discoverPackages(root);

    if (packages.length === 0) {
      console.log(chalk.yellow('\nNo packages found in monorepo'));
      process.exit(0);
    }

    const count = parseInt(options.number, 10);
    const recent = getRecentPackages({ root, packages, packageCount: packages.length }, count);

    console.log(chalk.bold(`\n📦 Monorepo: ${root}`));
    displayPackageList(recent, '🎯 Recently Used');

    if (recent.length === 0) {
      console.log(chalk.gray('\n  No recent packages yet. Switch to a package to build history.'));
    }
  });

program
  .command('dirty')
  .description('Show packages with uncommitted changes')
  .action(async () => {
    const root = getMonorepoRoot();
    const packages = discoverPackages(root);

    if (packages.length === 0) {
      console.log(chalk.yellow('\nNo packages found in monorepo'));
      process.exit(0);
    }

    const dirty = getDirtyPackages(packages);

    console.log(chalk.bold(`\n📦 Monorepo: ${root}`));

    if (dirty.length === 0) {
      console.log(chalk.green('\n  ✅ All packages are clean'));
    } else {
      displayPackageList(dirty, '🔥 Dirty Packages');
    }
  });

program
  .command('clear')
  .description('Clear package history')
  .action(() => {
    clearRecent();
    console.log(chalk.green('\n✓ Package history cleared'));
  });

program.parse();