export interface CanvasData {
	nodes: CanvasNodeData[];
	edges: CanvasEdgeData[];
}

export interface CanvasNodeData {
	id: string;
	type: 'file' | 'text' | 'link' | 'group';
	x: number;
	y: number;
	width: number;
	height: number;
	file?: string;
	label?: string;
	text?: string;
	url?: string;
	color?: string;
}

export interface CanvasEdgeData {
	id: string;
	fromNode: string;
	toNode: string;
	fromSide: string;
	toSide: string;
}

export type ExitBehavior = 'clear' | 'remove' | 'none';
export type GroupPriority = 'outermost' | 'innermost';

export interface LabelMapping {
	groupLabel: string;
	propertyValue: string;
}

export interface CanvasPropertySyncSettings {
	settingsVersion: number;
	defaultProperty: string;
	autoSync: boolean;
	debounceMs: number;
	slugifyLabels: boolean;
	exitBehavior: ExitBehavior;
	groupPriority: GroupPriority;
	managedCanvases: ManagedCanvasConfig[];
	labelMappings: LabelMapping[];
}

export interface ManagedCanvasConfig {
	path: string;
	propertyOverride: string;
	labelMappings: LabelMapping[];
}

export const CURRENT_SETTINGS_VERSION = 1;

export const DEFAULT_SETTINGS: CanvasPropertySyncSettings = {
	settingsVersion: CURRENT_SETTINGS_VERSION,
	defaultProperty: 'status',
	autoSync: true,
	debounceMs: 500,
	slugifyLabels: true,
	exitBehavior: 'clear',
	groupPriority: 'outermost',
	managedCanvases: [],
	labelMappings: [],
};

export interface GroupMembership {
	filePath: string;
	groupLabel: string;
}
