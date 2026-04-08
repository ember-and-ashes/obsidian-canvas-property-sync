import { App, PluginSettingTab, Setting } from 'obsidian';
import CanvasPropertySyncPlugin from './main';

export class CanvasPropertySyncSettingTab extends PluginSettingTab {
	plugin: CanvasPropertySyncPlugin;

	constructor(app: App, plugin: CanvasPropertySyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Canvas Property Sync' });

		new Setting(containerEl)
			.setName('Default property')
			.setDesc('The frontmatter property to update (e.g., "status", "stage", "priority")')
			.addText(text => text
				.setPlaceholder('status')
				.setValue(this.plugin.settings.defaultProperty)
				.onChange(async (value) => {
					this.plugin.settings.defaultProperty = value || 'status';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto-sync')
			.setDesc('Automatically sync properties when a canvas is modified')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoSync)
				.onChange(async (value) => {
					this.plugin.settings.autoSync = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Debounce delay (ms)')
			.setDesc('Wait this long after the last canvas change before syncing')
			.addText(text => text
				.setPlaceholder('500')
				.setValue(String(this.plugin.settings.debounceMs))
				.onChange(async (value) => {
					const num = parseInt(value, 10);
					if (!isNaN(num) && num >= 0) {
						this.plugin.settings.debounceMs = num;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Slugify group labels')
			.setDesc('Convert group labels to lowercase slugs (e.g., "In Progress" → "in-progress")')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.slugifyLabels)
				.onChange(async (value) => {
					this.plugin.settings.slugifyLabels = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Nested group priority')
			.setDesc('When a note is inside nested groups, which group should set the property value')
			.addDropdown(dropdown => dropdown
				.addOption('outermost', 'Outermost group')
				.addOption('innermost', 'Innermost group')
				.setValue(this.plugin.settings.groupPriority)
				.onChange(async (value) => {
					this.plugin.settings.groupPriority = value as 'outermost' | 'innermost';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('When note leaves all groups')
			.setDesc('What to do with the property when a note is no longer inside any group')
			.addDropdown(dropdown => dropdown
				.addOption('clear', 'Clear value (keep property)')
				.addOption('remove', 'Remove property entirely')
				.addOption('none', 'Do nothing')
				.setValue(this.plugin.settings.exitBehavior)
				.onChange(async (value) => {
					this.plugin.settings.exitBehavior = value as 'clear' | 'remove' | 'none';
					await this.plugin.saveSettings();
				}));

		// Managed canvases section
		containerEl.createEl('h3', { text: 'Managed canvases' });
		containerEl.createEl('p', {
			text: 'Add canvases here to enable property syncing.',
			cls: 'setting-item-description',
		});

		const canvasFiles = this.app.vault.getFiles()
			.filter(f => f.extension === 'canvas')
			.map(f => f.path)
			.sort();

		const existingPaths = new Set(
			this.plugin.settings.managedCanvases.map(c => c.path)
		);

		new Setting(containerEl)
			.setName('Add canvas')
			.addDropdown(dropdown => {
				dropdown.addOption('', 'Select a canvas...');
				for (const path of canvasFiles) {
					if (!existingPaths.has(path)) {
						dropdown.addOption(path, path);
					}
				}
				dropdown.onChange(async (value) => {
					if (!value) return;
					this.plugin.settings.managedCanvases.push({
						path: value,
						propertyOverride: '',
						labelMappings: [],
					});
					await this.plugin.saveSettings();
					this.display();
				});
			});

		for (let i = 0; i < this.plugin.settings.managedCanvases.length; i++) {
			const config = this.plugin.settings.managedCanvases[i];

			// Canvas header with property override and remove button
			new Setting(containerEl)
				.setName(config.path)
				.setDesc('Property override (leave blank for default)')
				.addText(text => text
					.setPlaceholder(this.plugin.settings.defaultProperty)
					.setValue(config.propertyOverride)
					.onChange(async (value) => {
						this.plugin.settings.managedCanvases[i].propertyOverride = value;
						await this.plugin.saveSettings();
					}))
				.addExtraButton(button => button
					.setIcon('trash')
					.setTooltip('Remove canvas')
					.onClick(async () => {
						this.plugin.settings.managedCanvases.splice(i, 1);
						await this.plugin.saveSettings();
						this.display();
					}));

			// Per-canvas label mappings
			const mappingContainer = containerEl.createDiv({ cls: 'canvas-property-sync-mappings' });
			mappingContainer.style.marginLeft = '24px';
			mappingContainer.style.marginBottom = '12px';

			new Setting(mappingContainer)
				.setName('Label mappings')
				.setDesc('Map group labels to property values for this canvas')
				.addButton(button => button
					.setButtonText('Add')
					.setTooltip('Add mapping')
					.onClick(async () => {
						if (!this.plugin.settings.managedCanvases[i].labelMappings) {
							this.plugin.settings.managedCanvases[i].labelMappings = [];
						}
						this.plugin.settings.managedCanvases[i].labelMappings.push({
							groupLabel: '',
							propertyValue: '',
						});
						await this.plugin.saveSettings();
						this.display();
					}));

			const canvasMappings = config.labelMappings || [];
			for (let j = 0; j < canvasMappings.length; j++) {
				const mapping = canvasMappings[j];
				new Setting(mappingContainer)
					.addText(text => text
						.setPlaceholder('Group label')
						.setValue(mapping.groupLabel)
						.onChange(async (value) => {
							this.plugin.settings.managedCanvases[i].labelMappings[j].groupLabel = value;
							await this.plugin.saveSettings();
						}))
					.addText(text => text
						.setPlaceholder('Property value')
						.setValue(mapping.propertyValue)
						.onChange(async (value) => {
							this.plugin.settings.managedCanvases[i].labelMappings[j].propertyValue = value;
							await this.plugin.saveSettings();
						}))
					.addExtraButton(button => button
						.setIcon('trash')
						.setTooltip('Remove mapping')
						.onClick(async () => {
							this.plugin.settings.managedCanvases[i].labelMappings.splice(j, 1);
							await this.plugin.saveSettings();
							this.display();
						}));
			}
		}

		// Global label mappings (fallback)
		containerEl.createEl('h3', { text: 'Global label mappings' });
		containerEl.createEl('p', {
			text: 'Fallback mappings used when a canvas does not define its own mapping for a group label.',
			cls: 'setting-item-description',
		});

		new Setting(containerEl)
			.addButton(button => button
				.setButtonText('Add mapping')
				.onClick(async () => {
					this.plugin.settings.labelMappings.push({
						groupLabel: '',
						propertyValue: '',
					});
					await this.plugin.saveSettings();
					this.display();
				}));

		for (let i = 0; i < this.plugin.settings.labelMappings.length; i++) {
			const mapping = this.plugin.settings.labelMappings[i];
			new Setting(containerEl)
				.addText(text => text
					.setPlaceholder('Group label')
					.setValue(mapping.groupLabel)
					.onChange(async (value) => {
						this.plugin.settings.labelMappings[i].groupLabel = value;
						await this.plugin.saveSettings();
					}))
				.addText(text => text
					.setPlaceholder('Property value')
					.setValue(mapping.propertyValue)
					.onChange(async (value) => {
						this.plugin.settings.labelMappings[i].propertyValue = value;
						await this.plugin.saveSettings();
					}))
				.addExtraButton(button => button
					.setIcon('trash')
					.setTooltip('Remove')
					.onClick(async () => {
						this.plugin.settings.labelMappings.splice(i, 1);
						await this.plugin.saveSettings();
						this.display();
					}));
		}
	}
}
