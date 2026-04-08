# Changelog

## 0.0.1

Initial pre-release.

### Features

- **Opt-in managed canvases** — canvases must be explicitly added in settings before syncing (no more sync-all-by-default)
- **Auto-sync on canvas modification** with configurable debounce
- **Sync on canvas open** — opening a managed canvas triggers a sync automatically
- **Ribbon icon** to sync all managed canvases with one click
- **Status bar** showing last sync state (idle / updated N notes / error)
- **Multi-canvas conflict detection** — notes on multiple canvases use first-canvas-wins, with console warnings
- **Per-canvas property overrides** and label mappings
- **Global label mappings** as fallback
- **Slugify group labels** option (e.g., "In Progress" -> "in-progress")
- **Nested group priority** — choose outermost (default) or innermost group
- **Exit behavior** — clear, remove, or keep property when a note leaves all groups
- **Settings migration scaffold** — future schema changes won't break existing installs

### Infrastructure

- Vitest test suite for canvas-parser and frontmatter-sync
- CI workflow (lint, test, build on push/PR)
- Release workflow (build + GitHub Release on tag push)
- Version bump scripts (`npm run release:patch/minor/major`)
