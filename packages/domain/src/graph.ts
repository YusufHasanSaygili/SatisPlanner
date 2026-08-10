import type {
	FactoryPlanV2,
	MachinePlanNodeV2,
	MachinePlanPortV2,
	TransportEdgeV2,
} from "./plan-schema";

export interface CanvasPosition {
	readonly x: number;
	readonly y: number;
}

export interface NodePortTemplate {
	readonly key: string;
	readonly direction: "input" | "output";
	readonly materialForm: "solid" | "fluid";
	readonly materialId: string;
}

export interface MachineNodeTemplate {
	readonly classId: string;
	readonly displayName: string;
	readonly category: string;
	readonly buildingId: string;
	readonly recipeId: string;
	readonly aliases: readonly string[];
	readonly ports: readonly NodePortTemplate[];
}

export interface NodeIdentitySet {
	readonly nodeId: string;
	readonly portIds: readonly string[];
}

export interface ConnectionIdentity {
	readonly edgeId: string;
	readonly sourceNodeId: string;
	readonly sourcePortId: string;
	readonly targetNodeId: string;
	readonly targetPortId: string;
}

export type ConnectionCandidate = Omit<ConnectionIdentity, "edgeId"> & {
	readonly requestedMedium?: "conveyor" | "pipeline";
};

export type GraphDiagnosticCode =
	| "PORT_NOT_FOUND"
	| "OUTPUT_TO_INPUT_REQUIRED"
	| "SELF_CONNECTION"
	| "MATERIAL_FORM_MISMATCH"
	| "MATERIAL_ID_MISMATCH"
	| "MEDIUM_MISMATCH"
	| "DUPLICATE_CONNECTION";

export interface GraphDiagnostic {
	readonly code: GraphDiagnosticCode;
	readonly message: string;
}

export type ConnectionValidation =
	| {
			readonly ok: true;
			readonly medium: "conveyor" | "pipeline";
			readonly materialId: string;
	  }
	| { readonly ok: false; readonly diagnostic: GraphDiagnostic };

function withUpdatedAt(plan: FactoryPlanV2): Omit<FactoryPlanV2, "updatedAt"> & {
	readonly updatedAt: string;
} {
	return { ...plan, updatedAt: new Date().toISOString() };
}

function findPort(
	plan: FactoryPlanV2,
	portId: string,
): { readonly node: MachinePlanNodeV2; readonly port: MachinePlanPortV2 } | undefined {
	for (const node of plan.nodes) {
		const port = node.ports.find((candidate) => candidate.id === portId);
		if (port) return { node, port };
	}
	return undefined;
}

export function addMachineNode(
	plan: FactoryPlanV2,
	template: MachineNodeTemplate,
	position: CanvasPosition,
	identities: NodeIdentitySet,
): FactoryPlanV2 {
	if (identities.portIds.length !== template.ports.length) {
		throw new Error("Every graph port requires a stable UUID.");
	}
	const node: MachinePlanNodeV2 = {
		kind: "machine",
		id: identities.nodeId,
		buildingId: template.buildingId,
		recipeId: template.recipeId,
		displayName: template.displayName,
		position: { x: position.x, y: position.y },
		clockPercent: "100.0000",
		powerShardCount: 0,
		somersloopCount: 0,
		standby: false,
		ports: template.ports.map((port, index) => ({
			...port,
			id: identities.portIds[index] as string,
		})),
	};
	return { ...withUpdatedAt(plan), nodes: [...plan.nodes, node] };
}

export function moveMachineNode(
	plan: FactoryPlanV2,
	nodeId: string,
	position: CanvasPosition,
): FactoryPlanV2 {
	return {
		...withUpdatedAt(plan),
		nodes: plan.nodes.map((node) =>
			node.id === nodeId ? { ...node, position: { x: position.x, y: position.y } } : node,
		),
	};
}

export function setPlanViewport(
	plan: FactoryPlanV2,
	viewport: FactoryPlanV2["viewport"],
): FactoryPlanV2 {
	return { ...withUpdatedAt(plan), viewport: { ...viewport } };
}

export function validateConnection(
	plan: FactoryPlanV2,
	identity: ConnectionCandidate,
): ConnectionValidation {
	const source = findPort(plan, identity.sourcePortId);
	const target = findPort(plan, identity.targetPortId);
	if (!source || !target) {
		return {
			ok: false,
			diagnostic: { code: "PORT_NOT_FOUND", message: "Connection port is no longer available." },
		};
	}
	if (source.port.direction !== "output" || target.port.direction !== "input") {
		return {
			ok: false,
			diagnostic: {
				code: "OUTPUT_TO_INPUT_REQUIRED",
				message: "Connections must run from an output port to an input port.",
			},
		};
	}
	if (source.node.id === target.node.id) {
		return {
			ok: false,
			diagnostic: { code: "SELF_CONNECTION", message: "A machine cannot connect to itself." },
		};
	}
	if (source.port.materialForm !== target.port.materialForm) {
		return {
			ok: false,
			diagnostic: {
				code: "MATERIAL_FORM_MISMATCH",
				message: "Solid and fluid ports cannot be connected.",
			},
		};
	}
	if (source.port.materialId !== target.port.materialId) {
		return {
			ok: false,
			diagnostic: {
				code: "MATERIAL_ID_MISMATCH",
				message: `Material mismatch: ${source.port.materialId} cannot feed ${target.port.materialId}.`,
			},
		};
	}
	const medium = source.port.materialForm === "fluid" ? "pipeline" : "conveyor";
	if (identity.requestedMedium && identity.requestedMedium !== medium) {
		return {
			ok: false,
			diagnostic: {
				code: "MEDIUM_MISMATCH",
				message:
					medium === "conveyor"
						? "Solid materials require a conveyor connection."
						: "Fluids require a pipeline connection.",
			},
		};
	}
	if (
		plan.edges.some(
			(edge) =>
				edge.fromPortId === identity.sourcePortId && edge.toPortId === identity.targetPortId,
		)
	) {
		return {
			ok: false,
			diagnostic: {
				code: "DUPLICATE_CONNECTION",
				message: "This connection already exists.",
			},
		};
	}
	return { ok: true, medium, materialId: source.port.materialId };
}

export function connectMachinePorts(
	plan: FactoryPlanV2,
	identity: ConnectionIdentity,
): { readonly plan: FactoryPlanV2; readonly validation: ConnectionValidation } {
	const validation = validateConnection(plan, identity);
	if (!validation.ok) return { plan, validation };
	const edge: TransportEdgeV2 = {
		id: identity.edgeId,
		fromPortId: identity.sourcePortId,
		toPortId: identity.targetPortId,
		medium: validation.medium,
		itemOrFluidId: validation.materialId,
		requestedRate: { numerator: "0", denominator: "1" },
		actualRate: { numerator: "0", denominator: "1" },
	};
	return { plan: { ...withUpdatedAt(plan), edges: [...plan.edges, edge] }, validation };
}

export function deletePlanEntities(
	plan: FactoryPlanV2,
	nodeIds: readonly string[],
	edgeIds: readonly string[],
): FactoryPlanV2 {
	const removedNodeIds = new Set(nodeIds);
	const removedPortIds = new Set(
		plan.nodes
			.filter((node) => removedNodeIds.has(node.id))
			.flatMap((node) => node.ports.map((port) => port.id)),
	);
	return {
		...withUpdatedAt(plan),
		nodes: plan.nodes.filter((node) => !removedNodeIds.has(node.id)),
		edges: plan.edges.filter(
			(edge) =>
				!edgeIds.includes(edge.id) &&
				!removedPortIds.has(edge.fromPortId) &&
				!removedPortIds.has(edge.toPortId),
		),
	};
}

export function duplicateMachineNode(
	plan: FactoryPlanV2,
	nodeId: string,
	identities: NodeIdentitySet,
): FactoryPlanV2 {
	const source = plan.nodes.find((node) => node.id === nodeId);
	if (!source) return plan;
	if (identities.portIds.length !== source.ports.length) {
		throw new Error("Every duplicated graph port requires a stable UUID.");
	}
	const duplicate: MachinePlanNodeV2 = {
		...source,
		id: identities.nodeId,
		position: { x: source.position.x + 48, y: source.position.y + 48 },
		ports: source.ports.map((port, index) => ({
			...port,
			id: identities.portIds[index] as string,
		})),
	};
	return { ...withUpdatedAt(plan), nodes: [...plan.nodes, duplicate] };
}
