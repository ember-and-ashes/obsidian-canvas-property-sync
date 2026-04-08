# Canvas Property Sync

An Obsidian plugin that automatically syncs note frontmatter properties based on canvas group placement. Use canvas groups as kanban columns and keep your note metadata in sync.

## Features

- **Opt-in managed canvases** — only canvases you explicitly add in settings are synced
- **Automatic sync** — move a note into a canvas group, and its frontmatter property updates to match the group label
- **Sync on canvas open** — when you open a managed canvas, it syncs automatically
- **Ribbon icon** — click the refresh icon in the sidebar to sync all managed canvases
- **Status bar** — shows the last sync result (idle, updated N notes, or error)
- **Configurable property** — sync to any frontmatter property (`status`, `stage`, `priority`, etc.)
- **Per-canvas overrides** — different canvases can sync to different properties
- **Label mappings** — map group labels to custom property values (e.g., "In Progress" → "wip"), per-canvas or globally
- **Slugify option** — automatically convert group labels to lowercase slugs
- **Nested group support** — when a note is inside nested groups, the outermost group wins by default (configurable to innermost)
- **Multi-canvas conflict detection** — if a note appears on multiple managed canvases, the first canvas wins and a warning is logged
- **Manual sync commands** — sync the current canvas or all managed canvases via the command palette

## Installation

1. Download `canvas-property-sync.zip` from the [latest release](https://github.com/ember-and-ashes/obsidian-canvas-property-sync/releases)
2. Extract the zip into your vault's `.obsidian/plugins/` directory
3. Enable the plugin in Obsidian's Community Plugins settings

### Building from source

```bash
npm install
npm run build
```

Then copy `main.js` and `manifest.json` to your vault's `.obsidian/plugins/canvas-property-sync/` directory.

## Usage

1. Open the plugin settings and add one or more canvases to the **Managed canvases** list
2. Create groups on those canvases (these act as your kanban columns)
3. Drag notes into the groups
4. The plugin automatically updates each note's frontmatter property to match its group label

No canvases are synced until you explicitly add them in settings.

### Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Default property** | The frontmatter property to sync | `status` |
| **Auto-sync** | Toggle automatic syncing on canvas changes and canvas open | `true` |
| **Debounce delay** | How long to wait after the last change before syncing | `500ms` |
| **Slugify group labels** | Convert labels like "In Progress" to `in-progress` | `true` |
| **Nested group priority** | Which group sets the property when a note is in nested groups | `outermost` |
| **When note leaves all groups** | Clear the property value, remove it entirely, or do nothing | `clear` |
| **Managed canvases** | Which canvases to sync (with optional per-canvas property override and label mappings) | none |
| **Global label mappings** | Fallback mappings used when a canvas doesn't define its own | none |

### Commands

- **Sync current canvas** — manually sync the currently active canvas
- **Sync all managed canvases** — sync all configured canvases at once

### Ribbon icon

The refresh icon (↻) in the left sidebar triggers **Sync all managed canvases**.

### Status bar

The status bar shows the current sync state:
- **Canvas Sync: idle** — no recent sync activity
- **Canvas Sync: updated N notes** — after a successful sync
- **Canvas Sync: error** — if a sync failed (check the developer console for details)

### Multi-canvas conflict handling

If the same note appears on multiple managed canvases, the first canvas (in the order they were added to settings) wins. A warning is logged to the console for each skipped duplicate.

## How it works

Canvas files (`.canvas`) are JSON. Each group has coordinates and a label, and each file node has coordinates and a file path. The plugin checks which file nodes fall within which groups (using bounding box containment with a small tolerance), then updates the corresponding note's frontmatter property to match the group label.

For nested groups, the outermost (largest area) group takes precedence by default. You can switch to innermost in settings.

## License

MIT
