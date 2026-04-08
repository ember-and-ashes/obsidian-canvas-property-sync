import { CanvasData, CanvasNodeData, GroupMembership, GroupPriority } from './types';

export function parseCanvas(json: string): CanvasData {
	return JSON.parse(json) as CanvasData;
}

export function resolveGroupMemberships(canvas: CanvasData, groupPriority: GroupPriority): GroupMembership[] {
	const groups = canvas.nodes.filter(n => n.type === 'group');
	const fileNodes = canvas.nodes.filter(n => n.type === 'file' && n.file);

	const memberships: GroupMembership[] = [];

	for (const node of fileNodes) {
		const containingGroups = groups.filter(g => isNodeInsideGroup(node, g));

		if (containingGroups.length === 0) continue;

		const winner = containingGroups.reduce((current, g) => {
			const currentArea = current.width * current.height;
			const gArea = g.width * g.height;
			if (groupPriority === 'outermost') {
				return gArea > currentArea ? g : current;
			} else {
				return gArea < currentArea ? g : current;
			}
		});

		if (winner.label) {
			memberships.push({
				filePath: node.file!,
				groupLabel: winner.label,
			});
		}
	}

	return memberships;
}

export function isNodeInsideGroup(node: CanvasNodeData, group: CanvasNodeData): boolean {
	const tolerance = 5;
	return (
		node.x >= group.x - tolerance &&
		node.y >= group.y - tolerance &&
		node.x + node.width <= group.x + group.width + tolerance &&
		node.y + node.height <= group.y + group.height + tolerance
	);
}
