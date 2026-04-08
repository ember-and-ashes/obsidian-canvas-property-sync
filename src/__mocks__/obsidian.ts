export class App {}
export class TFile {
	path: string;
	extension: string;
	constructor(path = '') {
		this.path = path;
		this.extension = path.split('.').pop() || '';
	}
}
export class Plugin {}
export class PluginSettingTab {}
export class Notice {}
export class Setting {}
export function debounce(fn: Function, ms: number) { return fn; }
