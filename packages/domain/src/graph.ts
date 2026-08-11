import { DomainValidationError } from "./errors";
import { ClockPercent } from "./units";
import type {
	FactoryPlanV3,
	MachinePlanNodeV3,
	PlanNodeV3,
	PlanPortV3,
	ResourcePlanNodeV3,
	TransportEdgeV3,
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

export interface MachineBuildingDefinition {
	readonly buildingId: string;
	readonly displayName: string;
	readonly compatibleRecipeIds: readonly string[];
	readonly powerShardSlots: number;
	readonly somersloopSlots: number;
}

export interface ResourceNodeTemplate {
	readonly classId: string;
	readonly displayName: string;
	readonly category: "Resources";
	readonly resourceId: string;
	readonly materialForm: "solid" | "fluid";
	readonly extractorStrategyId: string;
	readonly defaultTierId: string;
	readonly availableTierIds: readonly string[];
	readonly aliases: readonly string[];
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

function withUpdatedAt(plan: FactoryPlanV3): Omit<FactoryPlanV3, "updatedAt"> & {
	readonly updatedAt: string;
} {
	return { ...plan, updatedAt: new Date().toISOString() };
}

function findPort(
	plan: FactoryPlanV3,
	portId: string,
): { readonly node: PlanNodeV3; readonly port: PlanPortV3 } | undefined {
	for (const node of plan.nodes) {
		const port = node.ports.find((candidate) => candidate.id === portId);
		if (port) return { node, port };
	}
	return undefined;
}

export function addMachineNode(
	plan: FactoryPlanV3,
	template: MachineNodeTemplate,
	position: CanvasPosition,
	identities: NodeIdentitySet,
): FactoryPlanV3 {
	if (identities.portIds.length !== template.ports.length) {
		throw new Error("Every graph port requires a stable UUID.");
	}
	const node: MachinePlanNodeV3 = {
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

export function addResourceNode(
	plan: FactoryPlanV3,
	template: ResourceNodeTemplate,
	position: CanvasPosition,
	identities: NodeIdentitySet,
): FactoryPlanV3 {
	if (identities.portIds.length !== 1) {
		throw new Error("A resource graph node requires one stable output-port UUID.");
	}
	if (!template.availableTierIds.includes(template.defaultTierId)) {
		throw new DomainValidationError(
			"INVALID_EXTRACTOR_CONFIG",
			"Default extractor tier must exist in the resource template.",
		);
	}
	const node: ResourcePlanNodeV3 = {
		kind: "resource",
		id: identities.nodeId,
		resourceId: template.resourceId,
		displayName: template.displayName,
		purity: "normal",
		extractorStrategyId: template.extractorStrategyId,
		extractorTierId: template.defaultTierId,
		clockPercent: "100.0000",
		powerShardCount: 0,
		position: { ...position },
		ports: [
			{
				id: identities.portIds[0] as string,
				key: "output-0",
				direction: "output",
				materialForm: template.materialForm,
				materialId: template.resourceId,
			},
		],
	};
	return { ...withUpdatedAt(plan), nodes: [...plan.nodes, node] };
}

export function movePlanNode(
	plan: FactoryPlanV3,
	nodeId: string,
	position: CanvasPosition,
): FactoryPlanV3 {
	return {
		...withUpdatedAt(plan),
		nodes: plan.nodes.map((node) =>
			node.id === nodeId ? { ...node, position: { x: position.x, y: position.y } } : node,
		),
	};
}

export function setPlanViewport(
	plan: FactoryPlanV3,
	viewport: FactoryPlanV3["viewport"],
): FactoryPlanV3 {
	return { ...withUpdatedAt(plan), viewport: { ...viewport } };
}

export function validateConnection(
	plan: FactoryPlanV3,
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
	plan: FactoryPlanV3,
	identity: ConnectionIdentity,
): { readonly plan: FactoryPlanV3; readonly validation: ConnectionValidation } {
	const validation = validateConnection(plan, identity);
	if (!validation.ok) return { plan, validation };
	const edge: TransportEdgeV3 = {
		id: identity.edgeId,
		fromPortId: identity.sourcePortId,
		toPortId: identity.targetPortId,
		medium: validation.medium,
		transportTierId: validation.medium === "pipeline" ? "pipeline-mk1" : "conveyor-mk1",
		itemOrFluidId: validation.materialId,
		requestedRate: { numerator: "0", denominator: "1" },
		actualRate: { numerator: "0", denominator: "1" },
	};
	return { plan: { ...withUpdatedAt(plan), edges: [...plan.edges, edge] }, validation };
}

export function deletePlanEntities(
	plan: FactoryPlanV3,
	nodeIds: readonly string[],
	edgeIds: readonly string[],
): FactoryPlanV3 {
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
	plan: FactoryPlanV3,
	nodeId: string,
	identities: NodeIdentitySet,
): FactoryPlanV3 {
	const source = plan.nodes.find((node) => node.id === nodeId);
	if (source?.kind !== "machine") return plan;
	if (identities.portIds.length !== source.ports.length) {
		throw new Error("Every duplicated graph port requires a stable UUID.");
	}
	const duplicate: MachinePlanNodeV3 = {
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

export interface BatchMachineIdentitySet extends NodeIdentitySet {
	readonly labelSuffix?: string;
}

export function duplicateMachineNodes(
	plan: FactoryPlanV3,
	nodeId: string,
	identitySets: readonly BatchMachineIdentitySet[],
): FactoryPlanV3 {
	const source = plan.nodes.find((node) => node.id === nodeId);
	if (source?.kind !== "machine") return plan;
	const duplicates = identitySets.map((identities, index): MachinePlanNodeV3 => {
		if (identities.portIds.length !== source.ports.length) {
			throw new Error("Every duplicated graph port requires a stable UUID.");
		}
		return {
			...source,
			id: identities.nodeId,
			displayName: identities.labelSuffix
				? `${source.displayName} ${identities.labelSuffix}`
				: source.displayName,
			position: {
				x: source.position.x + 280 * (index + 1),
				y: source.position.y + 36 * (index + 1),
			},
			ports: source.ports.map((port, portIndex) => ({
				...port,
				id: identities.portIds[portIndex] as string,
			})),
		};
	});
	return { ...withUpdatedAt(plan), nodes: [...plan.nodes, ...duplicates] };
}

export interface MachineSettingsPatch {
	readonly clockPercent?: string;
	readonly powerShardCount?: number;
	readonly somersloopCount?: number;
	readonly standby?: boolean;
}

function assertMachineDefinition(
	source: MachinePlanNodeV3,
	definition: MachineBuildingDefinition,
	requireCurrentRecipe = true,
): void {
	if (definition.buildingId !== source.buildingId) {
		throw new DomainValidationError(
			"INVALID_IDENTIFIER",
			"Machine definition does not match the selected instance.",
		);
	}
	if (requireCurrentRecipe && !definition.compatibleRecipeIds.includes(source.recipeId)) {
		throw new DomainValidationError(
			"INCOMPATIBLE_RECIPE",
			`Recipe ${source.recipeId} is unresolved for ${definition.displayName}.`,
		);
	}
	if (
		!Number.isInteger(definition.powerShardSlots) ||
		definition.powerShardSlots < 0 ||
		definition.powerShardSlots > 3
	) {
		throw new DomainValidationError(
			"INVALID_POWER_SHARD_COUNT",
			"Machine power shard slots must be between 0 and 3.",
		);
	}
	if (
		!Number.isInteger(definition.somersloopSlots) ||
		definition.somersloopSlots < 0 ||
		definition.somersloopSlots > 4
	) {
		throw new DomainValidationError(
			"INVALID_SOMERSLOOP_COUNT",
			"Machine Somersloop slots must be between 0 and 4.",
		);
	}
}

export function updateMachineNodeSettings(
	plan: FactoryPlanV3,
	nodeId: string,
	definition: MachineBuildingDefinition,
	patch: MachineSettingsPatch,
): FactoryPlanV3 {
	const source = plan.nodes.find((node) => node.id === nodeId);
	if (source?.kind !== "machine") {
		throw new DomainValidationError(
			"INVALID_IDENTIFIER",
			"Selected machine instance is no longer available.",
		);
	}
	assertMachineDefinition(source, definition);
	const powerShardCount = patch.powerShardCount ?? source.powerShardCount;
	if (
		!Number.isInteger(powerShardCount) ||
		powerShardCount < 0 ||
		powerShardCount > definition.powerShardSlots
	) {
		throw new DomainValidationError(
			"INVALID_POWER_SHARD_COUNT",
			`Power shard count must be between 0 and ${definition.powerShardSlots}.`,
		);
	}
	const somersloopCount = patch.somersloopCount ?? source.somersloopCount;
	if (
		!Number.isInteger(somersloopCount) ||
		somersloopCount < 0 ||
		somersloopCount > definition.somersloopSlots
	) {
		throw new DomainValidationError(
			"INVALID_SOMERSLOOP_COUNT",
			`Somersloop count must be between 0 and ${definition.somersloopSlots}.`,
		);
	}
	const clock = ClockPercent.parse(patch.clockPercent ?? source.clockPercent);
	if (clock.compare(ClockPercent.maximumForShardCount(powerShardCount)) > 0) {
		throw new DomainValidationError(
			"CLOCK_EXCEEDS_SHARD_CAPACITY",
			`Clock ${clock} exceeds the capacity of ${powerShardCount} power shard(s).`,
		);
	}
	if (patch.standby !== undefined && typeof patch.standby !== "boolean") {
		throw new DomainValidationError("INVALID_PLAN", "Standby must be a boolean value.");
	}
	const updated: MachinePlanNodeV3 = {
		...source,
		clockPercent: clock.toJSON(),
		powerShardCount,
		somersloopCount,
		standby: patch.standby ?? source.standby,
	};
	return {
		...withUpdatedAt(plan),
		nodes: plan.nodes.map((node) => (node.id === nodeId ? updated : node)),
	};
}

export type RecipeRebindDiagnosticCode = "CONNECTED_PORT_REMOVAL" | "EDGE_REQUIRES_REVIEW";

export interface RecipeRebindDiagnostic {
	readonly code: RecipeRebindDiagnosticCode;
	readonly message: string;
	readonly edgeId: string;
	readonly portId: string;
}

export interface RecipeRebindResult {
	readonly plan: FactoryPlanV3;
	readonly applied: boolean;
	readonly diagnostics: readonly RecipeRebindDiagnostic[];
}

export function rebindMachineRecipe(
	plan: FactoryPlanV3,
	nodeId: string,
	definition: MachineBuildingDefinition,
	recipe: MachineNodeTemplate,
	newPortIds: readonly string[],
): RecipeRebindResult {
	const source = plan.nodes.find((node) => node.id === nodeId);
	if (source?.kind !== "machine") {
		throw new DomainValidationError(
			"INVALID_IDENTIFIER",
			"Selected machine instance is no longer available.",
		);
	}
	assertMachineDefinition(source, definition, false);
	if (
		recipe.buildingId !== definition.buildingId ||
		!definition.compatibleRecipeIds.includes(recipe.recipeId)
	) {
		throw new DomainValidationError(
			"INCOMPATIBLE_RECIPE",
			`Recipe ${recipe.recipeId} cannot be produced in ${definition.displayName}.`,
		);
	}
	const nextKeys = new Set(recipe.ports.map((port) => port.key));
	const removedPorts = source.ports.filter((port) => !nextKeys.has(port.key));
	const removalDiagnostics = removedPorts.flatMap((port) =>
		plan.edges
			.filter((edge) => edge.fromPortId === port.id || edge.toPortId === port.id)
			.map(
				(edge): RecipeRebindDiagnostic => ({
					code: "CONNECTED_PORT_REMOVAL",
					edgeId: edge.id,
					portId: port.id,
					message: `Recipe change would remove connected port ${port.key}; edge ${edge.id} was preserved.`,
				}),
			),
	);
	if (removalDiagnostics.length > 0) {
		return { plan, applied: false, diagnostics: removalDiagnostics };
	}
	let identityIndex = 0;
	const ports: PlanPortV3[] = recipe.ports.map((port) => {
		const existing = source.ports.find((candidate) => candidate.key === port.key);
		const id = existing?.id ?? newPortIds[identityIndex++];
		if (!id) throw new Error("Every new recipe port requires a stable UUID.");
		return { ...port, id };
	});
	if (identityIndex !== newPortIds.length) {
		throw new Error("Unexpected recipe port UUID count.");
	}
	const reviewDiagnostics = ports.flatMap((port) => {
		const existing = source.ports.find((candidate) => candidate.key === port.key);
		if (
			!existing ||
			(existing.direction === port.direction &&
				existing.materialForm === port.materialForm &&
				existing.materialId === port.materialId)
		) {
			return [];
		}
		return plan.edges
			.filter((edge) => edge.fromPortId === port.id || edge.toPortId === port.id)
			.map(
				(edge): RecipeRebindDiagnostic => ({
					code: "EDGE_REQUIRES_REVIEW",
					edgeId: edge.id,
					portId: port.id,
					message: `Edge ${edge.id} remains connected to changed ${port.key} and requires review.`,
				}),
			);
	});
	const updated: MachinePlanNodeV3 = {
		...source,
		recipeId: recipe.recipeId,
		displayName: recipe.displayName,
		ports,
	};
	return {
		plan: {
			...withUpdatedAt(plan),
			nodes: plan.nodes.map((node) => (node.id === nodeId ? updated : node)),
		},
		applied: true,
		diagnostics: reviewDiagnostics,
	};
}

export interface ResourceSettingsPatch {
	readonly purity?: ResourcePlanNodeV3["purity"];
	readonly extractorTierId?: string;
	readonly clockPercent?: string;
	readonly powerShardCount?: number;
}

export function updateResourceNodeSettings(
	plan: FactoryPlanV3,
	nodeId: string,
	patch: ResourceSettingsPatch,
): FactoryPlanV3 {
	const source = plan.nodes.find((node) => node.id === nodeId);
	if (source?.kind !== "resource") {
		throw new DomainValidationError(
			"INVALID_EXTRACTOR_CONFIG",
			"Selected resource instance is no longer available.",
		);
	}
	const purity = patch.purity ?? source.purity;
	if (!["impure", "normal", "pure"].includes(purity)) {
		throw new DomainValidationError("INVALID_EXTRACTOR_CONFIG", "Unknown resource purity.");
	}
	const extractorTierId = patch.extractorTierId ?? source.extractorTierId;
	if (extractorTierId.trim().length === 0) {
		throw new DomainValidationError("INVALID_EXTRACTOR_CONFIG", "Extractor tier is required.");
	}
	const powerShardCount = patch.powerShardCount ?? source.powerShardCount;
	if (!Number.isInteger(powerShardCount) || powerShardCount < 0 || powerShardCount > 3) {
		throw new DomainValidationError(
			"INVALID_POWER_SHARD_COUNT",
			"Power shard count must be an integer between 0 and 3.",
		);
	}
	const clock = ClockPercent.parse(patch.clockPercent ?? source.clockPercent);
	if (clock.compare(ClockPercent.maximumForShardCount(powerShardCount)) > 0) {
		throw new DomainValidationError(
			"CLOCK_EXCEEDS_SHARD_CAPACITY",
			`Clock ${clock} exceeds the capacity of ${powerShardCount} power shard(s).`,
		);
	}
	const updated: ResourcePlanNodeV3 = {
		...source,
		purity,
		extractorTierId,
		clockPercent: clock.toJSON(),
		powerShardCount,
	};
	return {
		...withUpdatedAt(plan),
		nodes: plan.nodes.map((node) => (node.id === nodeId ? updated : node)),
	};
}
