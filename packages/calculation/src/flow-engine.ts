import {
	type FactoryPlanV3,
	getTransportTier,
	type MachinePlanNodeV3,
	minimumTransportTier,
	type PlanNodeV3,
	Rational,
	type RationalJson,
	type TransportEdgeV3,
} from "@satisplanner/domain";
import {
	calculateMachineFormula,
	type FormulaStrategyRegistry,
	formulaStrategyRegistry,
	type MachineFormulaProvenance,
} from "./formula-engine";
import {
	calculateResourceExtraction,
	type ExtractionProvenance,
	type ExtractionStrategyRegistry,
	extractionStrategyRegistry,
} from "./resource-extraction";

const ZERO = Rational.parse("0");
const ONE = Rational.parse("1");

export const FALLBACK_SOMERSLOOP_SLOTS: Readonly<Record<string, number>> = Object.freeze({
	Build_SmelterMk1_C: 0,
	Build_ConstructorMk1_C: 1,
	Build_FoundryMk1_C: 2,
	Build_AssemblerMk1_C: 2,
	Build_ManufacturerMk1_C: 4,
	Build_OilRefinery_C: 2,
});

export type FlowAllocationPolicy =
	| { readonly mode: "equal" }
	| { readonly mode: "manual"; readonly ratesByEdgeId: Readonly<Record<string, RationalJson>> }
	| { readonly mode: "ratio"; readonly weightsByEdgeId: Readonly<Record<string, RationalJson>> };

export interface FlowSolverOptions {
	readonly formulaRegistry?: FormulaStrategyRegistry;
	readonly extractionRegistry?: ExtractionStrategyRegistry;
	readonly allocationByOutputPortId?: Readonly<Record<string, FlowAllocationPolicy>>;
	readonly somersloopSlotsByBuildingId?: Readonly<Record<string, number>>;
	readonly maxIterations?: number;
	readonly convergenceTolerance?: RationalJson;
}

export type FlowDiagnosticCode =
	| "UNSUPPORTED_FORMULA"
	| "FORMULA_PORT_MISSING"
	| "EXTRACTION_ERROR"
	| "CYCLE_CONVERGED"
	| "NON_CONVERGENT_LOOP"
	| "ITERATION_LIMIT"
	| "CONSERVATION_VIOLATION"
	| "TRANSPORT_BOTTLENECK";

export interface FlowDiagnostic {
	readonly code: FlowDiagnosticCode;
	readonly severity: "info" | "warning" | "error";
	readonly message: string;
	readonly nodeIds: readonly string[];
	readonly edgeId?: string;
}

export interface PortFlowResult {
	readonly portId: string;
	readonly portKey: string;
	readonly materialId: string;
	readonly ratePerMinute: RationalJson;
}

export interface NodeFlowResult {
	readonly nodeId: string;
	readonly kind: PlanNodeV3["kind"];
	readonly status: "resolved" | "unresolved";
	readonly requiredInputs: readonly PortFlowResult[];
	readonly actualInputs: readonly PortFlowResult[];
	readonly potentialOutputs: readonly PortFlowResult[];
	readonly actualOutputs: readonly PortFlowResult[];
	readonly efficiency: RationalJson | null;
	readonly powerMW: number;
	readonly provenance?: MachineFormulaProvenance | ExtractionProvenance;
}

export interface EdgeFlowResult {
	readonly edgeId: string;
	readonly materialId: string;
	readonly medium: TransportEdgeV3["medium"];
	readonly transportTierId: string;
	readonly requestedRate: RationalJson;
	readonly requiredRate: RationalJson;
	readonly capacityRate: RationalJson | null;
	readonly actualRate: RationalJson;
	readonly lostRate: RationalJson;
	readonly deficitReasons: readonly (
		| "transport-capacity"
		| "upstream-supply"
		| "downstream-demand"
	)[];
	readonly recommendedTierId: string | null;
	readonly bottleneckRank: number | null;
}

export interface FlowInstrumentation {
	readonly iterationCount: number;
	readonly recomputedNodeIds: readonly string[];
}

export interface FactoryFlowResult {
	readonly resolved: boolean;
	readonly nodes: readonly NodeFlowResult[];
	readonly edges: readonly EdgeFlowResult[];
	readonly diagnostics: readonly FlowDiagnostic[];
	readonly totalPowerMW: number;
	readonly instrumentation: FlowInstrumentation;
}

interface CalculationNodeModel {
	readonly node: PlanNodeV3;
	readonly requiredInputs: ReadonlyMap<string, Rational>;
	readonly potentialOutputs: ReadonlyMap<string, Rational>;
	readonly powerMW: number;
	readonly provenance?: MachineFormulaProvenance | ExtractionProvenance;
	readonly valid: boolean;
}

interface IterationState {
	readonly outputs: ReadonlyMap<string, Rational>;
	readonly inputs: ReadonlyMap<string, Rational>;
	readonly edges: ReadonlyMap<string, Rational>;
}

interface WeightedAllocationEntry {
	readonly edgeId: string;
	readonly cap: Rational;
	readonly weight: Rational;
}

function minimum(left: Rational, right: Rational): Rational {
	return left.compare(right) <= 0 ? left : right;
}

function maximumZero(value: Rational): Rational {
	return value.compare(ZERO) < 0 ? ZERO : value;
}

function sum(values: Iterable<Rational>): Rational {
	let result = ZERO;
	for (const value of values) result = result.add(value);
	return result;
}

function mapEquals(
	left: ReadonlyMap<string, Rational>,
	right: ReadonlyMap<string, Rational>,
): boolean {
	if (left.size !== right.size) return false;
	for (const [key, value] of left) {
		if (!value.equals(right.get(key) ?? ZERO)) return false;
	}
	return true;
}

function absoluteRational(value: Rational): Rational {
	return value.numerator < 0n ? Rational.create(-value.numerator, value.denominator) : value;
}

function mapClose(
	left: ReadonlyMap<string, Rational>,
	right: ReadonlyMap<string, Rational>,
	tolerance: Rational,
): boolean {
	if (left.size !== right.size) return false;
	for (const [key, value] of left) {
		if (absoluteRational(value.subtract(right.get(key) ?? ZERO)).compare(tolerance) > 0)
			return false;
	}
	return true;
}

function allocateWeighted(
	supply: Rational,
	entries: readonly WeightedAllocationEntry[],
): ReadonlyMap<string, Rational> {
	const allocations = new Map(entries.map((entry) => [entry.edgeId, ZERO] as const));
	let remainingSupply = maximumZero(supply);
	let active = entries
		.filter((entry) => entry.cap.compare(ZERO) > 0 && entry.weight.compare(ZERO) > 0)
		.sort((left, right) => left.edgeId.localeCompare(right.edgeId));
	while (remainingSupply.compare(ZERO) > 0 && active.length > 0) {
		const totalWeight = sum(active.map((entry) => entry.weight));
		if (totalWeight.equals(ZERO)) break;
		const capped = active.filter((entry) => {
			const available = entry.cap.subtract(allocations.get(entry.edgeId) ?? ZERO);
			const share = remainingSupply.multiply(entry.weight).divide(totalWeight);
			return share.compare(available) >= 0;
		});
		if (capped.length === 0) {
			for (const entry of active) {
				const share = remainingSupply.multiply(entry.weight).divide(totalWeight);
				allocations.set(entry.edgeId, (allocations.get(entry.edgeId) ?? ZERO).add(share));
			}
			remainingSupply = ZERO;
			break;
		}
		for (const entry of capped) {
			const current = allocations.get(entry.edgeId) ?? ZERO;
			const available = maximumZero(entry.cap.subtract(current));
			allocations.set(entry.edgeId, current.add(available));
			remainingSupply = maximumZero(remainingSupply.subtract(available));
		}
		const cappedIds = new Set(capped.map((entry) => entry.edgeId));
		active = active.filter((entry) => !cappedIds.has(entry.edgeId));
	}
	return allocations;
}

function allocationEntries(
	edges: readonly TransportEdgeV3[],
	demands: ReadonlyMap<string, Rational>,
	policy: FlowAllocationPolicy | undefined,
): readonly WeightedAllocationEntry[] {
	return edges.map((edge) => {
		const explicitRequest = Rational.parse(edge.requestedRate);
		const demandCap =
			explicitRequest.compare(ZERO) > 0 ? explicitRequest : (demands.get(edge.toPortId) ?? ZERO);
		const tierCapacity = getTransportTier(edge.transportTierId)?.capacityPerMinute;
		const cap = tierCapacity ? minimum(demandCap, Rational.parse(tierCapacity)) : demandCap;
		if (policy?.mode === "manual") {
			const requested = policy.ratesByEdgeId[edge.id];
			const manualCap = requested ? minimum(cap, maximumZero(Rational.parse(requested))) : ZERO;
			return { edgeId: edge.id, cap: manualCap, weight: manualCap };
		}
		if (policy?.mode === "ratio") {
			const configured = policy.weightsByEdgeId[edge.id];
			return {
				edgeId: edge.id,
				cap,
				weight: configured ? maximumZero(Rational.parse(configured)) : ZERO,
			};
		}
		return { edgeId: edge.id, cap, weight: ONE };
	});
}

function diagnosticSortKey(diagnostic: FlowDiagnostic): string {
	return `${diagnostic.code}\u0000${diagnostic.nodeIds.join(",")}\u0000${diagnostic.edgeId ?? ""}`;
}

function resolveFormulaPorts(
	node: MachinePlanNodeV3,
	rates: readonly {
		readonly portKey: string;
		readonly materialId: string;
		readonly ratePerMinute: RationalJson;
	}[],
	direction: "input" | "output",
	diagnostics: FlowDiagnostic[],
): ReadonlyMap<string, Rational> {
	const result = new Map<string, Rational>();
	for (const rate of rates) {
		const port = node.ports.find(
			(candidate) =>
				candidate.key === rate.portKey &&
				candidate.direction === direction &&
				candidate.materialId === rate.materialId,
		);
		if (!port) {
			diagnostics.push({
				code: "FORMULA_PORT_MISSING",
				severity: "error",
				message: `${node.displayName} is missing ${direction} port ${rate.portKey}/${rate.materialId}.`,
				nodeIds: [node.id],
			});
			continue;
		}
		result.set(port.id, Rational.parse(rate.ratePerMinute));
	}
	return result;
}

function buildModels(
	plan: FactoryPlanV3,
	options: FlowSolverOptions,
): {
	readonly models: ReadonlyMap<string, CalculationNodeModel>;
	readonly diagnostics: FlowDiagnostic[];
} {
	const diagnostics: FlowDiagnostic[] = [];
	const models = new Map<string, CalculationNodeModel>();
	const formulaRegistry = options.formulaRegistry ?? formulaStrategyRegistry;
	const extractionRegistry = options.extractionRegistry ?? extractionStrategyRegistry;
	const slotsByBuilding = options.somersloopSlotsByBuildingId ?? FALLBACK_SOMERSLOOP_SLOTS;
	for (const node of [...plan.nodes].sort((left, right) => left.id.localeCompare(right.id))) {
		if (node.kind === "resource") {
			const output = node.ports.find((port) => port.direction === "output");
			const extraction = calculateResourceExtraction(
				{
					strategyId: node.extractorStrategyId,
					tierId: node.extractorTierId,
					resourceId: node.resourceId,
					materialForm: output?.materialForm ?? "solid",
					purity: node.purity,
					clockPercent: node.clockPercent,
					powerShardCount: node.powerShardCount,
				},
				extractionRegistry,
			);
			if (!extraction.ok || !output) {
				diagnostics.push({
					code: "EXTRACTION_ERROR",
					severity: "error",
					message: extraction.ok
						? `${node.displayName} has no output port.`
						: extraction.diagnostic.message,
					nodeIds: [node.id],
				});
				models.set(node.id, {
					node,
					requiredInputs: new Map(),
					potentialOutputs: new Map(),
					powerMW: 0,
					valid: false,
				});
				continue;
			}
			models.set(node.id, {
				node,
				requiredInputs: new Map(),
				potentialOutputs: new Map([[output.id, Rational.parse(extraction.ratePerMinute)]]),
				powerMW: extraction.powerMW,
				provenance: extraction.provenance,
				valid: true,
			});
			continue;
		}
		const formula = calculateMachineFormula(
			{
				buildingId: node.buildingId,
				recipeId: node.recipeId,
				clockPercent: node.clockPercent,
				powerShardCount: node.powerShardCount,
				somersloopCount: node.somersloopCount,
				somersloopSlots: slotsByBuilding[node.buildingId] ?? 0,
				standby: node.standby,
			},
			formulaRegistry,
		);
		if (!formula.ok) {
			diagnostics.push({
				code: "UNSUPPORTED_FORMULA",
				severity: "error",
				message: formula.diagnostic.message,
				nodeIds: [node.id],
			});
			models.set(node.id, {
				node,
				requiredInputs: new Map(),
				potentialOutputs: new Map(),
				powerMW: 0,
				valid: false,
			});
			continue;
		}
		const diagnosticCount = diagnostics.length;
		const requiredInputs = resolveFormulaPorts(node, formula.requiredInputs, "input", diagnostics);
		const potentialOutputs = resolveFormulaPorts(
			node,
			formula.potentialOutputs,
			"output",
			diagnostics,
		);
		models.set(node.id, {
			node,
			requiredInputs,
			potentialOutputs,
			powerMW: formula.powerMW,
			provenance: formula.provenance,
			valid: diagnostics.length === diagnosticCount,
		});
	}
	return { models, diagnostics };
}

function nodeByPortId(plan: FactoryPlanV3): ReadonlyMap<string, string> {
	const result = new Map<string, string>();
	for (const node of plan.nodes) {
		for (const port of node.ports) result.set(port.id, node.id);
	}
	return result;
}

function findStronglyConnectedComponents(plan: FactoryPlanV3): readonly (readonly string[])[] {
	const owner = nodeByPortId(plan);
	const adjacency = new Map(plan.nodes.map((node) => [node.id, new Set<string>()] as const));
	for (const edge of plan.edges) {
		const from = owner.get(edge.fromPortId);
		const to = owner.get(edge.toPortId);
		if (from && to) adjacency.get(from)?.add(to);
	}
	let nextIndex = 0;
	const indices = new Map<string, number>();
	const lowLinks = new Map<string, number>();
	const stack: string[] = [];
	const onStack = new Set<string>();
	const components: string[][] = [];
	const visit = (nodeId: string): void => {
		indices.set(nodeId, nextIndex);
		lowLinks.set(nodeId, nextIndex);
		nextIndex += 1;
		stack.push(nodeId);
		onStack.add(nodeId);
		for (const target of [...(adjacency.get(nodeId) ?? [])].sort()) {
			if (!indices.has(target)) {
				visit(target);
				lowLinks.set(nodeId, Math.min(lowLinks.get(nodeId) ?? 0, lowLinks.get(target) ?? 0));
			} else if (onStack.has(target)) {
				lowLinks.set(nodeId, Math.min(lowLinks.get(nodeId) ?? 0, indices.get(target) ?? 0));
			}
		}
		if (lowLinks.get(nodeId) !== indices.get(nodeId)) return;
		const component: string[] = [];
		while (stack.length > 0) {
			const member = stack.pop();
			if (!member) break;
			onStack.delete(member);
			component.push(member);
			if (member === nodeId) break;
		}
		components.push(component.sort());
	};
	for (const nodeId of [...adjacency.keys()].sort()) {
		if (!indices.has(nodeId)) visit(nodeId);
	}
	return components
		.filter((component) => {
			if (component.length > 1) return true;
			const only = component[0];
			return only !== undefined && adjacency.get(only)?.has(only) === true;
		})
		.sort((left, right) => (left[0] ?? "").localeCompare(right[0] ?? ""));
}

function machineEfficiency(
	model: CalculationNodeModel,
	inputs: ReadonlyMap<string, Rational>,
): Rational {
	if (!model.valid) return ZERO;
	const demands = [...model.requiredInputs.entries()].filter(
		([, demand]) => demand.compare(ZERO) > 0,
	);
	if (demands.length === 0) return ONE;
	let efficiency = ONE;
	for (const [portId, demand] of demands) {
		const ratio = minimum(ONE, (inputs.get(portId) ?? ZERO).divide(demand));
		if (ratio.compare(efficiency) < 0) efficiency = ratio;
	}
	return efficiency;
}

function runIteration(
	plan: FactoryPlanV3,
	models: ReadonlyMap<string, CalculationNodeModel>,
	previousOutputs: ReadonlyMap<string, Rational>,
	options: FlowSolverOptions,
): IterationState {
	const edgeRates = new Map(plan.edges.map((edge) => [edge.id, ZERO] as const));
	const inputRates = new Map<string, Rational>();
	const remainingDemand = new Map<string, Rational>();
	for (const model of models.values()) {
		for (const [portId, demand] of model.requiredInputs) remainingDemand.set(portId, demand);
	}
	const byOutput = new Map<string, TransportEdgeV3[]>();
	for (const edge of [...plan.edges].sort((left, right) => left.id.localeCompare(right.id))) {
		const edges = byOutput.get(edge.fromPortId) ?? [];
		edges.push(edge);
		byOutput.set(edge.fromPortId, edges);
	}
	for (const sourcePortId of [...byOutput.keys()].sort()) {
		const edges = byOutput.get(sourcePortId) ?? [];
		const allocations = allocateWeighted(
			previousOutputs.get(sourcePortId) ?? ZERO,
			allocationEntries(edges, remainingDemand, options.allocationByOutputPortId?.[sourcePortId]),
		);
		for (const edge of edges) {
			const rate = allocations.get(edge.id) ?? ZERO;
			edgeRates.set(edge.id, rate);
			inputRates.set(edge.toPortId, (inputRates.get(edge.toPortId) ?? ZERO).add(rate));
			remainingDemand.set(
				edge.toPortId,
				maximumZero((remainingDemand.get(edge.toPortId) ?? ZERO).subtract(rate)),
			);
		}
	}
	const nextOutputs = new Map<string, Rational>();
	for (const model of models.values()) {
		const efficiency = model.node.kind === "resource" ? ONE : machineEfficiency(model, inputRates);
		for (const [portId, potential] of model.potentialOutputs) {
			nextOutputs.set(portId, potential.multiply(efficiency));
		}
	}
	return { outputs: nextOutputs, inputs: inputRates, edges: edgeRates };
}

function toPortResults(
	node: PlanNodeV3,
	rates: ReadonlyMap<string, Rational>,
): readonly PortFlowResult[] {
	return node.ports
		.filter((port) => rates.has(port.id))
		.map((port) => ({
			portId: port.id,
			portKey: port.key,
			materialId: port.materialId,
			ratePerMinute: (rates.get(port.id) ?? ZERO).toJSON(),
		}))
		.sort((left, right) => left.portId.localeCompare(right.portId));
}

function ratesWithDefaults(
	keys: ReadonlyMap<string, Rational>,
	values: ReadonlyMap<string, Rational>,
): ReadonlyMap<string, Rational> {
	return new Map([...keys.keys()].map((key) => [key, values.get(key) ?? ZERO] as const));
}

function requiredEdgeRate(
	edge: TransportEdgeV3,
	modelByInputPort: ReadonlyMap<string, Rational>,
	incomingCountByPort: ReadonlyMap<string, number>,
): Rational {
	const explicit = Rational.parse(edge.requestedRate);
	if (explicit.compare(ZERO) > 0) return explicit;
	const count = incomingCountByPort.get(edge.toPortId) ?? 1;
	return (modelByInputPort.get(edge.toPortId) ?? ZERO).divide(Rational.parse(String(count)));
}

export function calculateFactoryPlan(
	plan: FactoryPlanV3,
	options: FlowSolverOptions = {},
): FactoryFlowResult {
	const built = buildModels(plan, options);
	const diagnostics = [...built.diagnostics];
	const cycles = findStronglyConnectedComponents(plan);
	const outputs = new Map<string, Rational>();
	for (const model of built.models.values()) {
		for (const [portId, potential] of model.potentialOutputs) {
			outputs.set(portId, model.node.kind === "resource" ? potential : ZERO);
		}
	}
	let state: IterationState = { outputs, inputs: new Map(), edges: new Map() };
	const maxIterations = options.maxIterations ?? Math.max(64, plan.nodes.length + 2);
	const convergenceTolerance = Rational.parse(
		options.convergenceTolerance ?? { numerator: "1", denominator: "1000000000" },
	);
	let converged = plan.nodes.length === 0;
	let iterationCount = 0;
	for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
		const next = runIteration(plan, built.models, state.outputs, options);
		iterationCount = iteration;
		if (
			(mapEquals(next.outputs, state.outputs) ||
				mapClose(next.outputs, state.outputs, convergenceTolerance)) &&
			(mapEquals(next.edges, state.edges) ||
				mapClose(next.edges, state.edges, convergenceTolerance))
		) {
			state = next;
			converged = true;
			break;
		}
		state = next;
	}
	const unresolvedNodeIds = new Set<string>();
	if (converged) {
		for (const component of cycles) {
			diagnostics.push({
				code: "CYCLE_CONVERGED",
				severity: "info",
				message: `Recycle loop converged for ${component.join(", ")}.`,
				nodeIds: component,
			});
		}
	} else if (cycles.length > 0) {
		for (const component of cycles) {
			for (const nodeId of component) unresolvedNodeIds.add(nodeId);
			diagnostics.push({
				code: "NON_CONVERGENT_LOOP",
				severity: "error",
				message: `Recycle loop did not converge within ${maxIterations} iterations.`,
				nodeIds: component,
			});
		}
	} else {
		for (const node of plan.nodes) unresolvedNodeIds.add(node.id);
		diagnostics.push({
			code: "ITERATION_LIMIT",
			severity: "error",
			message: `Flow propagation did not settle within ${maxIterations} iterations.`,
			nodeIds: [...unresolvedNodeIds].sort(),
		});
	}
	const requiredByInputPort = new Map<string, Rational>();
	for (const model of built.models.values()) {
		for (const [portId, demand] of model.requiredInputs) requiredByInputPort.set(portId, demand);
	}
	const incomingCountByPort = new Map<string, number>();
	for (const edge of plan.edges) {
		incomingCountByPort.set(edge.toPortId, (incomingCountByPort.get(edge.toPortId) ?? 0) + 1);
	}
	for (const edge of plan.edges) {
		const sourceTotal = sum(
			plan.edges
				.filter((candidate) => candidate.fromPortId === edge.fromPortId)
				.map((candidate) => state.edges.get(candidate.id) ?? ZERO),
		);
		if (sourceTotal.compare(state.outputs.get(edge.fromPortId) ?? ZERO) > 0) {
			diagnostics.push({
				code: "CONSERVATION_VIOLATION",
				severity: "error",
				message: `Outgoing flow exceeds supply at ${edge.fromPortId}.`,
				nodeIds: [],
				edgeId: edge.id,
			});
		}
	}
	const nodes = [...built.models.values()]
		.map((model): NodeFlowResult => {
			const issue = !model.valid || unresolvedNodeIds.has(model.node.id);
			return {
				nodeId: model.node.id,
				kind: model.node.kind,
				status: issue ? "unresolved" : "resolved",
				requiredInputs: toPortResults(model.node, model.requiredInputs),
				actualInputs: toPortResults(
					model.node,
					ratesWithDefaults(model.requiredInputs, state.inputs),
				),
				potentialOutputs: toPortResults(model.node, model.potentialOutputs),
				actualOutputs: toPortResults(model.node, state.outputs),
				efficiency:
					model.node.kind === "resource"
						? ONE.toJSON()
						: machineEfficiency(model, state.inputs).toJSON(),
				powerMW: issue ? 0 : model.powerMW,
				...(model.provenance ? { provenance: model.provenance } : {}),
			};
		})
		.sort((left, right) => left.nodeId.localeCompare(right.nodeId));
	const edges = [...plan.edges]
		.map((edge): EdgeFlowResult => {
			const required = requiredEdgeRate(edge, requiredByInputPort, incomingCountByPort);
			const requested =
				Rational.parse(edge.requestedRate).compare(ZERO) > 0
					? Rational.parse(edge.requestedRate)
					: required;
			const tier = getTransportTier(edge.transportTierId);
			const capacity = tier?.capacityPerMinute ? Rational.parse(tier.capacityPerMinute) : null;
			const actual = state.edges.get(edge.id) ?? ZERO;
			const lost = maximumZero(required.subtract(actual));
			const targetDemand = requiredByInputPort.get(edge.toPortId) ?? ZERO;
			const reasons: Array<"transport-capacity" | "upstream-supply" | "downstream-demand"> = [];
			if (capacity && required.compare(capacity) > 0 && actual.compare(capacity) >= 0) {
				reasons.push("transport-capacity");
			}
			if (lost.compare(ZERO) > 0 && (!capacity || actual.compare(capacity) < 0)) {
				reasons.push("upstream-supply");
			}
			if (requested.compare(targetDemand) > 0) reasons.push("downstream-demand");
			return {
				edgeId: edge.id,
				materialId: edge.itemOrFluidId,
				medium: edge.medium,
				transportTierId: edge.transportTierId,
				requestedRate: requested.toJSON(),
				requiredRate: required.toJSON(),
				capacityRate: capacity?.toJSON() ?? null,
				actualRate: actual.toJSON(),
				lostRate: lost.toJSON(),
				deficitReasons: reasons,
				recommendedTierId: minimumTransportTier(edge.medium, required.toJSON())?.id ?? null,
				bottleneckRank: null,
			};
		})
		.sort((left, right) => left.edgeId.localeCompare(right.edgeId));
	const rankedBottlenecks = edges
		.filter((edge) => edge.deficitReasons.includes("transport-capacity"))
		.sort((left, right) => {
			const lostComparison = Rational.parse(right.lostRate).compare(Rational.parse(left.lostRate));
			return lostComparison === 0 ? left.edgeId.localeCompare(right.edgeId) : lostComparison;
		});
	const rankByEdgeId = new Map(rankedBottlenecks.map((edge, index) => [edge.edgeId, index + 1]));
	const rankedEdges = edges.map((edge) => ({
		...edge,
		bottleneckRank: rankByEdgeId.get(edge.edgeId) ?? null,
	}));
	const portOwners = nodeByPortId(plan);
	for (const edge of rankedBottlenecks) {
		const planEdge = plan.edges.find((candidate) => candidate.id === edge.edgeId);
		if (!planEdge) continue;
		diagnostics.push({
			code: "TRANSPORT_BOTTLENECK",
			severity: "warning",
			message: `${edge.transportTierId} limits ${edge.materialId}: ${Rational.parse(edge.actualRate).toDecimal(4)}/min actual, ${Rational.parse(edge.lostRate).toDecimal(4)}/min lost.${edge.recommendedTierId ? ` Upgrade to ${edge.recommendedTierId}.` : " No available tier meets the requested rate."}`,
			nodeIds: [portOwners.get(planEdge.fromPortId), portOwners.get(planEdge.toPortId)].filter(
				(nodeId): nodeId is string => nodeId !== undefined,
			),
			edgeId: edge.edgeId,
		});
	}
	const sortedDiagnostics = diagnostics.sort((left, right) =>
		diagnosticSortKey(left).localeCompare(diagnosticSortKey(right)),
	);
	return {
		resolved: converged && nodes.every((node) => node.status === "resolved"),
		nodes,
		edges: rankedEdges,
		diagnostics: sortedDiagnostics,
		totalPowerMW: nodes.reduce((total, node) => total + node.powerMW, 0),
		instrumentation: {
			iterationCount,
			recomputedNodeIds: nodes.map((node) => node.nodeId),
		},
	};
}

function connectedNodeIds(plan: FactoryPlanV3, seeds: readonly string[]): ReadonlySet<string> {
	const owner = nodeByPortId(plan);
	const adjacency = new Map(plan.nodes.map((node) => [node.id, new Set<string>()] as const));
	for (const edge of plan.edges) {
		const from = owner.get(edge.fromPortId);
		const to = owner.get(edge.toPortId);
		if (!from || !to) continue;
		adjacency.get(from)?.add(to);
		adjacency.get(to)?.add(from);
	}
	const visited = new Set<string>();
	const queue = [...seeds].sort();
	while (queue.length > 0) {
		const current = queue.shift();
		if (!current || visited.has(current) || !adjacency.has(current)) continue;
		visited.add(current);
		for (const neighbor of [...(adjacency.get(current) ?? [])].sort()) {
			if (!visited.has(neighbor)) queue.push(neighbor);
		}
	}
	return visited;
}

export class IncrementalFlowEngine {
	readonly #options: FlowSolverOptions;
	#previousPlan: FactoryPlanV3 | undefined;
	#previousResult: FactoryFlowResult | undefined;

	constructor(options: FlowSolverOptions = {}) {
		this.#options = options;
	}

	compute(
		plan: FactoryPlanV3,
		changedNodeIds?: readonly string[],
		changedEdgeIds: readonly string[] = [],
	): FactoryFlowResult {
		if (
			!this.#previousPlan ||
			!this.#previousResult ||
			(!changedNodeIds && changedEdgeIds.length === 0)
		) {
			const result = calculateFactoryPlan(plan, this.#options);
			this.#previousPlan = plan;
			this.#previousResult = result;
			return result;
		}
		if ((changedNodeIds?.length ?? 0) === 0 && changedEdgeIds.length === 0) {
			return {
				...this.#previousResult,
				instrumentation: { iterationCount: 0, recomputedNodeIds: [] },
			};
		}
		const edgeSeedNodes = (candidatePlan: FactoryPlanV3): string[] => {
			const owners = nodeByPortId(candidatePlan);
			return candidatePlan.edges
				.filter((edge) => changedEdgeIds.includes(edge.id))
				.flatMap((edge) => [owners.get(edge.fromPortId), owners.get(edge.toPortId)])
				.filter((nodeId): nodeId is string => nodeId !== undefined);
		};
		const seeds = [
			...(changedNodeIds ?? []),
			...edgeSeedNodes(plan),
			...edgeSeedNodes(this.#previousPlan),
		];
		const affected = new Set([
			...connectedNodeIds(plan, seeds),
			...connectedNodeIds(this.#previousPlan, seeds),
		]);
		const affectedPortIds = new Set(
			plan.nodes
				.filter((node) => affected.has(node.id))
				.flatMap((node) => node.ports.map((port) => port.id)),
		);
		const subPlan: FactoryPlanV3 = {
			...plan,
			nodes: plan.nodes.filter((node) => affected.has(node.id)),
			edges: plan.edges.filter(
				(edge) => affectedPortIds.has(edge.fromPortId) && affectedPortIds.has(edge.toPortId),
			),
		};
		const partial = calculateFactoryPlan(subPlan, this.#options);
		const partialNodeIds = new Set(partial.nodes.map((node) => node.nodeId));
		const partialEdgeIds = new Set(partial.edges.map((edge) => edge.edgeId));
		const nodes = [
			...this.#previousResult.nodes.filter((node) => !partialNodeIds.has(node.nodeId)),
			...partial.nodes,
		].sort((left, right) => left.nodeId.localeCompare(right.nodeId));
		const edges = [
			...this.#previousResult.edges.filter((edge) => !partialEdgeIds.has(edge.edgeId)),
			...partial.edges,
		].sort((left, right) => left.edgeId.localeCompare(right.edgeId));
		const diagnostics = [
			...this.#previousResult.diagnostics.filter(
				(diagnostic) =>
					diagnostic.nodeIds.every((nodeId) => !affected.has(nodeId)) &&
					(diagnostic.edgeId === undefined || !partialEdgeIds.has(diagnostic.edgeId)),
			),
			...partial.diagnostics,
		].sort((left, right) => diagnosticSortKey(left).localeCompare(diagnosticSortKey(right)));
		const result: FactoryFlowResult = {
			resolved: nodes.every((node) => node.status === "resolved"),
			nodes,
			edges,
			diagnostics,
			totalPowerMW: nodes.reduce((total, node) => total + node.powerMW, 0),
			instrumentation: {
				iterationCount: partial.instrumentation.iterationCount,
				recomputedNodeIds: [...affected].filter((nodeId) => partialNodeIds.has(nodeId)).sort(),
			},
		};
		this.#previousPlan = plan;
		this.#previousResult = result;
		return result;
	}
}
