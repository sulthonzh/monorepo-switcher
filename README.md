# monorepo-switcher

> Jump between packages in your monorepo like you actually know where things are.

Stop typing `cd packages/some-long-service-name` fifty times a day. `mrsw` finds your packages, remembers where you've been, and tells you which ones have uncommitted changes.

## What it does

- **Discovers packages** — scans your monorepo or reads workspace config (pnpm, yarn, npm, lerna, turborepo, nx)
- **Shows context** — git status, package type, version, description at a glance
- **Remembers history** — recent packages are one flag away
- **Finds dirty packages** — see which packages have uncommitted changes
- **Fuzzy search** — type part of a name, it finds it
- **JSON output** — pipe it into anything with `--json`

## Install

```bash
npm install -g monorepo-switcher
```

Comes with a short alias: `mrsw`

## Usage

```bash
# List all packages
mrsw

# Switch to a specific package (exact or partial match)
mrsw backend
mrsw user-service

# Interactive selection
mrsw -i

# Fuzzy search
mrsw --fuzzy "front"

# Recent packages
mrsw --recent
mrsw recent -n 3

# Dirty packages (uncommitted changes)
mrsw --dirty
mrsw dirty

# Package details
mrsw info backend

# JSON output (great for scripting)
mrsw --json
mrsw dirty --json
mrsw info backend --json

# Clear history
mrsw clear
```

## JSON Output

Every command supports `--json` for scripting:

```bash
# All packages as JSON
mrsw --json

# Just dirty ones
mrsw dirty --json

# Package info
mrsw info my-package --json
```

Example output:

```json
{
  "root": "/projects/my-monorepo",
  "tool": "pnpm",
  "packageCount": 8,
  "packages": [
    {
      "name": "@myorg/backend",
      "path": "/projects/my-monorepo/packages/backend",
      "type": "node",
      "version": "2.1.0",
      "description": "API server",
      "gitStatus": "clean",
      "dependencies": 12,
      "scripts": ["dev", "build", "test"]
    }
  ]
}
```

## Monorepo Detection

Works with any of these out of the box:

- **pnpm** — `pnpm-workspace.yaml`
- **yarn/npm** — `workspaces` in root `package.json`
- **turborepo** — `turbo.json`
- **nx** — `nx.json`
- **lerna** — `lerna.json`
- **plain** — falls back to directory scanning

## Package Types

Auto-detects from dependencies:

| Type | Detected By |
|------|------------|
| Next | `next` + `react` |
| React Native | `react-native` |
| Vue | `vue` or `nuxt` |
| Svelte | `svelte` or `@sveltejs/kit` |
| React | `react` / `react-dom` |
| Node | any dependencies |
| Docs | name contains "doc" |

## Configuration

Config stored in `~/.monorepo-switcher/config.json`:

```json
{
  "maxRecentPackages": 10,
  "historyFilePath": "~/.monorepo-switcher/history.json"
}
```

## License

MIT
