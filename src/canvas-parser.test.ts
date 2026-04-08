import { describe, it, expect } from 'vitest';
import { isNodeInsideGroup, resolveGroupMemberships } from './canvas-parser';
import { CanvasNodeData, CanvasData } from './types';

function makeNode(overrides: Partial<CanvasNodeData> & { id: string }): CanvasNodeData {
	return {
		type: 'file',
		x: 0,
		y: 0,
		width: 100,
		height: 50,
		...overrides,
	};
}

function makeGroup(overrides: Partial<CanvasNodeData> & { id: string }): CanvasNodeData {
	return {
		type: 'group',
		x: 0,
		y: 0,
		width: 500,
		height: 500,
		...overrides,
	};
}

describe('isNodeInsideGroup', () => {
	const group = makeGroup({ id: 'g1', x: 0, y: 0, width: 500, height: 500 });

	it('returns true when node is fully inside group', () => {
		const node = makeNode({ id: 'n1', x: 50, y: 50, width: 100, height: 50 });
		expect(isNodeInsideGroup(node, group)).toBe(true);
	});

	it('returns false when node is fully outside group', () => {
		const node = makeNode({ id: 'n1', x: 600, y: 600, width: 100, height: 50 });
		expect(isNodeInsideGroup(node, group)).toBe(false);
	});

	it('returns true when node is at group boundary within tolerance', () => {
		// Node at x=-3 is within 5px tolerance of group x=0
		const node = makeNode({ id: 'n1', x: -3, y: 0, width: 100, height: 50 });
		expect(isNodeInsideGroup(node, group)).toBe(true);
	});

	it('returns false when node exceeds tolerance', () => {
		// Node at x=-10 is outside 5px tolerance
		const node = makeNode({ id: 'n1', x: -10, y: 0, width: 100, height: 50 });
		expect(isNodeInsideGroup(node, group)).toBe(false);
	});

	it('returns true when node right edge is within tolerance of group right edge', () => {
		// node right edge: 450 + 100 = 550, group right: 500+5=505 tolerance → false
		const node = makeNode({ id: 'n1', x: 450, y: 0, width: 100, height: 50 });
		expect(isNodeInsideGroup(node, group)).toBe(false);
	});

	it('returns true when node right edge just fits within tolerance', () => {
		// node right edge: 400 + 100 = 500, group right: 500+5=505 → true
		const node = makeNode({ id: 'n1', x: 400, y: 0, width: 100, height: 50 });
		expect(isNodeInsideGroup(node, group)).toBe(true);
	});
});

describe('resolveGroupMemberships', () => {
	it('returns empty array when no groups exist', () => {
		const canvas: CanvasData = {
			nodes: [makeNode({ id: 'n1', file: 'note.md' })],
			edges: [],
		};
		expect(resolveGroupMemberships(canvas, 'outermost')).toEqual([]);
	});

	it('assigns node to its containing group', () => {
		const canvas: CanvasData = {
			nodes: [
				makeGroup({ id: 'g1', x: 0, y: 0, width: 500, height: 500, label: 'In Progress' }),
				makeNode({ id: 'n1', x: 50, y: 50, width: 100, height: 50, file: 'note.md' }),
			],
			edges: [],
		};
		const result = resolveGroupMemberships(canvas, 'outermost');
		expect(result).toEqual([{ filePath: 'note.md', groupLabel: 'In Progress' }]);
	});

	it('skips groups without labels', () => {
		const canvas: CanvasData = {
			nodes: [
				makeGroup({ id: 'g1', x: 0, y: 0, width: 500, height: 500 }), // no label
				makeNode({ id: 'n1', x: 50, y: 50, width: 100, height: 50, file: 'note.md' }),
			],
			edges: [],
		};
		const result = resolveGroupMemberships(canvas, 'outermost');
		expect(result).toEqual([]);
	});

	it('picks outermost group when priority is outermost', () => {
		const canvas: CanvasData = {
			nodes: [
				makeGroup({ id: 'outer', x: 0, y: 0, width: 1000, height: 1000, label: 'Outer' }),
				makeGroup({ id: 'inner', x: 10, y: 10, width: 200, height: 200, label: 'Inner' }),
				makeNode({ id: 'n1', x: 20, y: 20, width: 50, height: 30, file: 'note.md' }),
			],
			edges: [],
		};
		const result = resolveGroupMemberships(canvas, 'outermost');
		expect(result).toEqual([{ filePath: 'note.md', groupLabel: 'Outer' }]);
	});

	it('picks innermost group when priority is innermost', () => {
		const canvas: CanvasData = {
			nodes: [
				makeGroup({ id: 'outer', x: 0, y: 0, width: 1000, height: 1000, label: 'Outer' }),
				makeGroup({ id: 'inner', x: 10, y: 10, width: 200, height: 200, label: 'Inner' }),
				makeNode({ id: 'n1', x: 20, y: 20, width: 50, height: 30, file: 'note.md' }),
			],
			edges: [],
		};
		const result = resolveGroupMemberships(canvas, 'innermost');
		expect(result).toEqual([{ filePath: 'note.md', groupLabel: 'Inner' }]);
	});

	it('skips nodes not inside any group', () => {
		const canvas: CanvasData = {
			nodes: [
				makeGroup({ id: 'g1', x: 0, y: 0, width: 100, height: 100, label: 'Group' }),
				makeNode({ id: 'n1', x: 500, y: 500, width: 50, height: 30, file: 'outside.md' }),
			],
			edges: [],
		};
		const result = resolveGroupMemberships(canvas, 'outermost');
		expect(result).toEqual([]);
	});
});
