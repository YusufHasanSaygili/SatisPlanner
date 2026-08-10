import type { Node } from "@xyflow/react";

export interface FoundationNodeData extends Record<string, unknown> {
	readonly label: string;
	readonly detail: string;
}

export function createFoundationCanvasNodes(): Node<FoundationNodeData>[] {
	return [
		{
			id: "foundation-placeholder",
			position: { x: 40, y: 40 },
			data: {
				label: "Factory canvas ready",
				detail: "Domain nodes arrive in the next technical slice",
			},
			draggable: false,
			selectable: true,
		},
	];
}
