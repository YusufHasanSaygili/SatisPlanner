import type { FactoryPlanV3, PlanPortV3, RationalJson } from "@satisplanner/domain";
import type { Edge, Node } from "@xyflow/react";

export * from "./layout";

export interface MachineCanvasNodeData extends Record<string, unknown> {
	readonly kind: "machine";
	readonly label: string;
	readonly buildingId: string;
	readonly recipeId: string;
	readonly clockPercent: string;
	readonly powerShardCount: number;
	readonly somersloopCount: number;
	readonly standby: boolean;
	readonly inputs: readonly PlanPortV3[];
	readonly outputs: readonly PlanPortV3[];
	readonly flow?: ProjectedNodeFlow;
}

export interface ResourceCanvasNodeData extends Record<string, unknown> {
	readonly kind: "resource";
	readonly label: string;
	readonly resourceId: string;
	readonly purity: "impure" | "normal" | "pure";
	readonly extractorTierId: string;
	readonly clockPercent: string;
	readonly output: PlanPortV3;
	readonly flow?: ProjectedNodeFlow;
}

export interface JunctionCanvasNodeData extends Record<string, unknown> {
	readonly kind: "junction";
	readonly label: string;
	readonly junctionType: "splitter" | "merger";
	readonly input: PlanPortV3;
	readonly output: PlanPortV3;
	readonly flow?: ProjectedNodeFlow;
}

export interface ProjectedPortFlow {
	readonly portId: string;
	readonly ratePerMinute: RationalJson;
}

export interface ProjectedNodeFlow {
	readonly requiredInputs: readonly ProjectedPortFlow[];
	readonly actualInputs: readonly ProjectedPortFlow[];
	readonly potentialOutputs: readonly ProjectedPortFlow[];
	readonly actualOutputs: readonly ProjectedPortFlow[];
	readonly transportedOutputs: readonly ProjectedPortFlow[];
}

export type MachineCanvasNode = Node<MachineCanvasNodeData, "machine">;
export type ResourceCanvasNode = Node<ResourceCanvasNodeData, "resource">;
export type JunctionCanvasNode = Node<JunctionCanvasNodeData, "junction">;
export type GraphCanvasNode = MachineCanvasNode | ResourceCanvasNode | JunctionCanvasNode;

export interface GraphProjection {
	readonly nodes: readonly GraphCanvasNode[];
	readonly edges: readonly Edge[];
}

export function projectFactoryPlan(
	plan: FactoryPlanV3,
	selectedNodeIds: ReadonlySet<string> = new Set(),
	selectedEdgeIds: ReadonlySet<string> = new Set(),
	flowByNodeId: ReadonlyMap<string, ProjectedNodeFlow> = new Map(),
): GraphProjection {
	return {
		nodes: plan.nodes.map((node): GraphCanvasNode => {
			if (node.kind === "resource") {
				return {
					id: node.id,
					type: "resource",
					ariaLabel: `${node.displayName}, resource source, ${node.purity} purity, active`,
					position: { ...node.position },
					selected: selectedNodeIds.has(node.id),
					data: {
						kind: "resource",
						label: node.displayName,
						resourceId: node.resourceId,
						purity: node.purity,
						extractorTierId: node.extractorTierId,
						clockPercent: node.clockPercent,
						output: node.ports[0] as PlanPortV3,
						flow: flowByNodeId.get(node.id),
					},
				};
			}
			if (node.kind === "junction") {
				return {
					id: node.id,
					type: "junction",
					ariaLabel: `${node.displayName}, ${node.junctionType}, active`,
					position: { ...node.position },
					selected: selectedNodeIds.has(node.id),
					data: {
						kind: "junction",
						label: node.displayName,
						junctionType: node.junctionType,
						input: node.ports[0] as PlanPortV3,
						output: node.ports[1] as PlanPortV3,
						flow: flowByNodeId.get(node.id),
					},
				};
			}
			return {
				id: node.id,
				type: "machine",
				ariaLabel: `${node.displayName}, production machine, ${node.standby ? "standby" : "active"}`,
				position: { ...node.position },
				selected: selectedNodeIds.has(node.id),
				data: {
					kind: "machine",
					label: node.displayName,
					buildingId: node.buildingId,
					recipeId: node.recipeId,
					clockPercent: node.clockPercent,
					powerShardCount: node.powerShardCount,
					somersloopCount: node.somersloopCount,
					standby: node.standby,
					inputs: node.ports.filter((port) => port.direction === "input"),
					outputs: node.ports.filter((port) => port.direction === "output"),
					flow: flowByNodeId.get(node.id),
				},
			};
		}),
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
			ariaLabel: `${edge.medium} connection carrying ${edge.itemOrFluidId}, active`,
		})),
	};
}
