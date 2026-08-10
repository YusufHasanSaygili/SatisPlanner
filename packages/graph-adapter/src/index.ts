import type { FactoryPlanV2, MachinePlanPortV2 } from "@satisplanner/domain";
import type { Edge, Node } from "@xyflow/react";

export interface MachineCanvasNodeData extends Record<string, unknown> {
	readonly label: string;
	readonly buildingId: string;
	readonly recipeId: string;
	readonly inputs: readonly MachinePlanPortV2[];
	readonly outputs: readonly MachinePlanPortV2[];
}

export type MachineCanvasNode = Node<MachineCanvasNodeData, "machine">;

export interface GraphProjection {
	readonly nodes: readonly MachineCanvasNode[];
	readonly edges: readonly Edge[];
}

export function projectFactoryPlan(
	plan: FactoryPlanV2,
	selectedNodeIds: ReadonlySet<string> = new Set(),
	selectedEdgeIds: ReadonlySet<string> = new Set(),
): GraphProjection {
	return {
		nodes: plan.nodes.map((node) => ({
			id: node.id,
			type: "machine",
			position: { ...node.position },
			selected: selectedNodeIds.has(node.id),
			data: {
				label: node.displayName,
				buildingId: node.buildingId,
				recipeId: node.recipeId,
				inputs: node.ports.filter((port) => port.direction === "input"),
				outputs: node.ports.filter((port) => port.direction === "output"),
			},
		})),
		edges: plan.edges.map((edge) => ({
			id: edge.id,
			source: plan.nodes.find((node) => node.ports.some((port) => port.id === edge.fromPortId))
				?.id as string,
			target: plan.nodes.find((node) => node.ports.some((port) => port.id === edge.toPortId))
				?.id as string,
			sourceHandle: edge.fromPortId,
			targetHandle: edge.toPortId,
			label: edge.itemOrFluidId,
			selected: selectedEdgeIds.has(edge.id),
			ariaLabel: `${edge.medium} carrying ${edge.itemOrFluidId}`,
		})),
	};
}
