# monorepo-switcher

> Intelligent CLI tool for quickly switching between packages in monorepos with context awareness and smart workspace discovery.

## Features

- 🔍 **Instant Discovery**: Lists all packages in monorepo with one command
- 🎯 **Smart History**: Remembers recently used packages for quick access
- 🔥 **Context Awareness**: Shows git status, uncommitted changes, and package types
- 🚀 **Lightning-Fast Navigation**: `monorepo-switcher backend` takes you directly to the right package
- 🧠 **Intelligent Search**: Fuzzy search across package names, descriptions, and paths
- 🎨 **Beautiful CLI**: Colorized output with emoji indicators and clear status badges

## Installation

```bash
npm install -g monorepo-switcher
```

Or use the short alias:

```bash
npm install -g mrsw
```

## Usage

### Basic Switching

```bash
# List all packages
monorepo-switcher

# Switch to a specific package
monorepo-switcher backend

# Interactive mode with fuzzy selection
monorepo-switcher -i

# Fuzzy search
monorepo-switcher --fuzzy "front"
```

### Context-Aware Commands

```bash
# Show only recently used packages
monorepo-switcher --recent

# Show only packages with uncommitted changes
monorepo-switcher --dirty

# List all packages (no switching)
monorepo-switcher --list
```

### Special Commands

```bash
# Show recently used packages (standalone)
monorepo-switcher recent

# Show recently used packages with custom limit
monorepo-switcher recent --number 10

# Show packages with uncommitted changes
monorepo-switcher dirty

# Clear package history
monorepo-switcher clear
```

## Output Example

```
📦 Monorepo: /Users/dev/my-project (12 packages)

🎯 RECENTLY USED:
├── backend/          ⭐ 2 files modified
├── frontend/        ✅ clean
└── shared/          🔥 5 files modified (active)

🔍 ALL PACKAGES:
├── backend/ (Node.js) - REST API service
├── frontend/ (React) - Web UI
├── shared/ (TypeScript) - Common utilities
├── admin/ (React) - Admin dashboard
├── mobile/ (React Native) - Mobile app
└── docs/ (Markdown) - Project documentation
```

## Status Indicators

| Icon | Status |
|------|--------|
| ✅ | Clean (no uncommitted changes) |
| 🔥 | Modified (staged or unstaged changes) |
| 📋 | Untracked (new files not in git) |

## Package Type Badges

| Badge | Type |
|-------|------|
| [React] | React application |
| [Next] | Next.js application |
| [RN] | React Native application |
| [Node] | Node.js package |
| [Docs] | Documentation package |
| [Unknown] | Unknown package type |

## How It Works

1. **Auto-discovery**: Scans your monorepo for `package.json` files
2. **Type detection**: Analyzes dependencies to detect package types
3. **Git integration**: Checks git status for each package
4. **Session persistence**: Remembers your workspace context across terminal sessions

## Configuration

Configuration is stored in `~/.monorepo-switcher/config.json`:

```json
{
  "maxRecentPackages": 10,
  "historyFilePath": "/home/user/.monorepo-switcher/history.json"
}
```

## Monorepo Support

Works out-of-the-box with:
- pnpm workspaces
- yarn workspaces
- npm workspaces
- Turborepo
- Nx
- Lerna
- Rush
- Custom monorepo structures

## Use Cases

### Switching to the Backend

```bash
$ monorepo-switcher backend
✓ Switched to: backend
  Path: /Users/dev/my-project/packages/backend
  Run: cd /Users/dev/my-project/packages/backend
```

### Finding All Dirty Packages

```bash
$ monorepo-switcher dirty

🔥 Dirty Packages:
  🔥 [React] frontend - Web UI
  🔥 [Node] shared - Common utilities
```

### Quick Fuzzy Search

```bash
$ monorepo-switcher --fuzzy "admin"
✓ Switched to: admin
  Path: /Users/dev/my-project/packages/admin
  Run: cd /Users/dev/my-project/packages/admin
```

## License

MIT © [Sulthon](https://github.com/sulthonzh)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have feature requests, please open an issue on [GitHub](https://github.com/sulthonzh/monorepo-switcher/issues).