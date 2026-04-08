import { Notice, Plugin, TFile, debounce } from 'obsidian';
import { CanvasPropertySyncSettingTab } from './settings';
import { parseCanvas, resolveGroupMemberships } from './canvas-parser';
import { syncFrontmatter } from './frontmatter-sync';
import { DEFAULT_SETTINGS, CURRENT_SETTINGS_VERSION, CanvasPropertySyncSettings } from './types';

export default class CanvasPropertySyncPlugin extends Plugin {
	settings: CanvasPropertySyncSettings;
	private debouncedSync: ReturnType<typeof debounce>;
	private statusBarEl: HTMLElement;

	async onload() {
		await this.loadSettings();

		this.debouncedSync = debounce(
			(file: TFile) => this.syncCanvas(file),
			this.settings.debounceMs,
			true
		);

		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (!this.settings.autoSync) return;
				if (!(file instanceof TFile)) return;
				if (file.extension !== 'canvas') return;
				if (!this.isCanvasManaged(file.path)) return;

				this.debouncedSync(file);
			})
		);

		// Sync when a managed canvas is opened
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				if (!this.settings.autoSync) return;
				if (!leaf) return;

				const view = leaf.view as any;
				if (view?.getViewType?.() !== 'canvas') return;

				const file = view.file as TFile | undefined;
				if (!file || !(file instanceof TFile)) return;
				if (!this.isCanvasManaged(file.path)) return;

				this.syncCanvas(file);
			})
		);

		this.addCommand({
			id: 'sync-current-canvas',
			name: 'Sync current canvas',
			checkCallback: (checking) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile?.extension === 'canvas') {
					if (!checking) {
						this.syncCanvas(activeFile);
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: 'sync-all-canvases',
			name: 'Sync all managed canvases',
			callback: () => this.syncAllCanvases(),
		});

		this.addRibbonIcon('refresh-cw', 'Sync all managed canvases', () => {
			this.syncAllCanvases();
		});

		this.statusBarEl = this.addStatusBarItem();
		this.statusBarEl.setText('Canvas Sync: idle');

		this.addSettingTab(new CanvasPropertySyncSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.migrateSettings();
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.debouncedSync = debounce(
			(file: TFile) => this.syncCanvas(file),
			this.settings.debounceMs,
			true
		);
	}

	private migrateSettings(): void {
		const version = this.settings.settingsVersion ?? 0;

		if (version < CURRENT_SETTINGS_VERSION) {
			// Future migrations go here:
			// if (version < 2) { ... migrate v1 → v2 ... }

			this.settings.settingsVersion = CURRENT_SETTINGS_VERSION;
			this.saveData(this.settings);
		}
	}

	private isCanvasManaged(path: string): boolean {
		if (this.settings.managedCanvases.length === 0) return false;
		return this.settings.managedCanvases.some(c => c.path === path);
	}

	private getCanvasConfig(path: string) {
		const config = this.settings.managedCanvases.find(c => c.path === path);
		return {
			property: config?.propertyOverride || this.settings.defaultProperty,
			labelMappings: config?.labelMappings || [],
		};
	}

	async syncCanvas(file: TFile): Promise<number> {
		try {
			const content = await this.app.vault.read(file);
			const canvas = parseCanvas(content);
			const memberships = resolveGroupMemberships(canvas, this.settings.groupPriority);
			const allFileNodes = canvas.nodes
				.filter(n => n.type === 'file' && n.file)
				.map(n => n.file!);

			const { property, labelMappings } = this.getCanvasConfig(file.path);

			const count = await syncFrontmatter(
				this.app,
				memberships,
				allFileNodes,
				property,
				labelMappings,
				this.settings
			);

			if (count > 0) {
				new Notice(`Canvas Property Sync: Updated ${count} note${count === 1 ? '' : 's'}`);
				this.statusBarEl.setText(`Canvas Sync: updated ${count} note${count === 1 ? '' : 's'}`);
			}

			return count;
		} catch (e) {
			console.error('Canvas Property Sync: Failed to sync canvas', e);
			new Notice('Canvas Property Sync: Failed to sync — check console for details');
			this.statusBarEl.setText('Canvas Sync: error');
			return 0;
		}
	}

	private async syncAllCanvases(): Promise<void> {
		const canvasFiles = this.app.vault.getFiles().filter(f => f.extension === 'canvas');
		const syncedFilePaths = new Set<string>();
		let totalUpdated = 0;

		for (const file of canvasFiles) {
			if (!this.isCanvasManaged(file.path)) continue;

			try {
				const content = await this.app.vault.read(file);
				const canvas = parseCanvas(content);
				const memberships = resolveGroupMemberships(canvas, this.settings.groupPriority);

				// Filter out notes already synced by a prior canvas
				const filteredMemberships = memberships.filter(m => {
					if (syncedFilePaths.has(m.filePath)) {
						console.warn(`Canvas Property Sync: note ${m.filePath} appears on multiple canvases, using first match`);
						return false;
					}
					return true;
				});

				const allFileNodes = canvas.nodes
					.filter(n => n.type === 'file' && n.file)
					.map(n => n.file!);

				// Track all file nodes from this canvas as synced
				for (const m of filteredMemberships) {
					syncedFilePaths.add(m.filePath);
				}

				const { property, labelMappings } = this.getCanvasConfig(file.path);
				totalUpdated += await syncFrontmatter(
					this.app,
					filteredMemberships,
					allFileNodes,
					property,
					labelMappings,
					this.settings
				);
			} catch (e) {
				console.error(`Canvas Property Sync: Failed to sync ${file.path}`, e);
			}
		}

		if (totalUpdated > 0) {
			this.statusBarEl.setText(`Canvas Sync: updated ${totalUpdated} note${totalUpdated === 1 ? '' : 's'}`);
		} else {
			this.statusBarEl.setText('Canvas Sync: idle');
		}

		new Notice(
			`Canvas Property Sync: Updated ${totalUpdated} note${totalUpdated === 1 ? '' : 's'} across all canvases`
		);
	}
}
