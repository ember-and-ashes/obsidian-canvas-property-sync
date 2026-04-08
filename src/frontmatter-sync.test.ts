import { describe, it, expect } from 'vitest';
import { slugify, resolvePropertyValue } from './frontmatter-sync';
import { LabelMapping } from './types';

describe('slugify', () => {
	it('converts to lowercase and replaces spaces with hyphens', () => {
		expect(slugify('In Progress')).toBe('in-progress');
	});

	it('handles multiple spaces', () => {
		expect(slugify('To   Do')).toBe('to-do');
	});

	it('removes special characters', () => {
		expect(slugify('Done! (Final)')).toBe('done-final');
	});

	it('trims leading and trailing whitespace', () => {
		expect(slugify('  hello  ')).toBe('hello');
	});

	it('removes leading and trailing hyphens', () => {
		expect(slugify('--hello--')).toBe('hello');
	});

	it('handles underscores as separators', () => {
		expect(slugify('work_in_progress')).toBe('work-in-progress');
	});

	it('collapses multiple hyphens', () => {
		expect(slugify('a---b')).toBe('a-b');
	});

	it('returns empty string for empty input', () => {
		expect(slugify('')).toBe('');
	});

	it('returns empty string for only special characters', () => {
		expect(slugify('!@#$%')).toBe('');
	});
});

describe('resolvePropertyValue', () => {
	const canvasMappings: LabelMapping[] = [
		{ groupLabel: 'In Progress', propertyValue: 'wip' },
	];
	const globalMappings: LabelMapping[] = [
		{ groupLabel: 'In Progress', propertyValue: 'in-progress-global' },
		{ groupLabel: 'Done', propertyValue: 'completed' },
	];

	it('uses canvas mapping when available', () => {
		expect(resolvePropertyValue('In Progress', canvasMappings, globalMappings, true)).toBe('wip');
	});

	it('falls back to global mapping when no canvas mapping', () => {
		expect(resolvePropertyValue('Done', canvasMappings, globalMappings, true)).toBe('completed');
	});

	it('falls back to slugified label when no mapping exists', () => {
		expect(resolvePropertyValue('To Do', [], [], true)).toBe('to-do');
	});

	it('falls back to original label when slugify is disabled', () => {
		expect(resolvePropertyValue('To Do', [], [], false)).toBe('To Do');
	});

	it('canvas mapping takes priority over global mapping for same label', () => {
		expect(resolvePropertyValue('In Progress', canvasMappings, globalMappings, false)).toBe('wip');
	});

	it('returns empty string for empty label with slugify', () => {
		expect(resolvePropertyValue('', [], [], true)).toBe('');
	});
});
