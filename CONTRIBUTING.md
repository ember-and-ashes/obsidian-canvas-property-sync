# Contributing

This plugin was built for personal use and is shared open source in case others find it useful. Contributions are welcome, but I may not be able to review or merge PRs promptly.

If you want to take the plugin in a different direction or change its core purpose, please **fork the repo** rather than opening a PR. This plugin is built for a very specific workflow and I'd like to keep it focused.

Bug fixes and small improvements that align with the existing purpose are the most likely to be accepted.

## Development setup

```bash
git clone https://github.com/ember-and-ashes/obsidian-canvas-property-sync.git
cd obsidian-canvas-property-sync
npm install
```

### Build

```bash
npm run build        # Type-check + production bundle
npm run dev          # Watch mode with hot reload
```

### Test

```bash
npm test             # Run tests once
npm run test:watch   # Watch mode
```

### Local testing in Obsidian

1. Build the plugin: `npm run build`
2. Copy `main.js` and `manifest.json` to `<vault>/.obsidian/plugins/canvas-property-sync/`
3. Reload Obsidian or toggle the plugin off/on

## Project structure

```
src/
  main.ts              # Plugin entry point, lifecycle, event handlers
  types.ts             # TypeScript interfaces and default settings
  settings.ts          # Settings tab UI
  canvas-parser.ts     # Canvas JSON parsing and group membership resolution
  frontmatter-sync.ts  # Frontmatter property updates
  __mocks__/obsidian.ts  # Obsidian API stubs for testing
  *.test.ts            # Test files (co-located)
```

## Pull requests

1. Create a feature branch from `main`
2. Make your changes
3. Ensure `npm test` and `npm run build` both pass
4. Open a PR against `main`

## Releasing

Releases are automated via GitHub Actions. To cut a release:

```bash
npm run release:patch   # 0.0.x bump
npm run release:minor   # 0.x.0 bump
npm run release:major   # x.0.0 bump
git push --follow-tags
```

This updates `package.json`, `manifest.json`, and `versions.json`, creates a git tag, and pushes it. The release workflow builds the plugin and creates a GitHub Release with the compiled assets.
