import { App, TFile } from 'obsidian';
import { GroupMembership, LabelMapping, CanvasPropertySyncSettings } from './types';

export function slugify(label: string): string {
	return label
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

function findMapping(mappings: LabelMapping[], groupLabel: string): string | null {
	const match = mappings.find(m => m.groupLabel === groupLabel);
	return match ? match.propertyValue : null;
}

export function resolvePropertyValue(
	groupLabel: string,
	canvasMappings: LabelMapping[],
	globalMappings: LabelMapping[],
	slugifyLabels: boolean
): string {
	// Per-canvas mappings take priority over global
	return findMapping(canvasMappings, groupLabel)
		?? findMapping(globalMappings, groupLabel)
		?? (slugifyLabels ? slugify(groupLabel) : groupLabel);
}

export async function syncFrontmatter(
	app: App,
	memberships: GroupMembership[],
	allFileNodes: string[],
	property: string,
	canvasMappings: LabelMapping[],
	settings: CanvasPropertySyncSettings
): Promise<number> {
	let updatedCount = 0;

	const fileToGroup = new Map<string, string>();
	for (const m of memberships) {
		fileToGroup.set(m.filePath, m.groupLabel);
	}

	for (const [filePath, groupLabel] of fileToGroup) {
		const file = app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile)) continue;

		const newValue = resolvePropertyValue(groupLabel, canvasMappings, settings.labelMappings, settings.slugifyLabels);

		await app.fileManager.processFrontMatter(file, (fm) => {
			if (fm[property] !== newValue) {
				fm[property] = newValue;
				updatedCount++;
			}
		});
	}

	if (settings.exitBehavior !== 'none') {
		for (const filePath of allFileNodes) {
			if (fileToGroup.has(filePath)) continue;

			const file = app.vault.getAbstractFileByPath(filePath);
			if (!(file instanceof TFile)) continue;

			await app.fileManager.processFrontMatter(file, (fm) => {
				if (fm[property] === undefined) return;

				switch (settings.exitBehavior) {
					case 'clear':
						if (fm[property] !== '') {
							fm[property] = '';
							updatedCount++;
						}
						break;
					case 'remove':
						delete fm[property];
						updatedCount++;
						break;
				}
			});
		}
	}

	return updatedCount;
}
