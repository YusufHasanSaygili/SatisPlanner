import {
	DEFAULT_SATISFACTORY_12_PROFILE,
	type FactoryPlanV4,
	type MachinePlanNodeV3,
	Rational,
	type TransportEdgeV4,
} from "@satisplanner/domain";
import { FALLBACK_GRAPH_CATALOG, FALLBACK_GRAPH_CATALOG_VERSION } from "./fallback-graph-catalog";

export const UPSTREAM_FCS_VERSION = 7 as const;
export type AggregateExpansionStrategy = "expand-rounded-up" | "single-aggregate";

export interface UpstreamMigrationStep {
	readonly fromVersion: number;
	readonly toVersion: number;
}

export interface UpstreamNodeConversion {
	readonly sourceNodeIndex: number;
	readonly sourceRecipe: string;
	readonly strategy: AggregateExpansionStrategy;
	readonly aggregateRate: string;
	readonly physicalInstanceCount: number;
	readonly generatedNodeIds: readonly string[];
}

export interface UpstreamConversionReport {
	readonly sourceVersion: number;
	readonly targetVersion: typeof UPSTREAM_FCS_VERSION;
	readonly migrationSteps: readonly UpstreamMigrationStep[];
	readonly gameVersion: string;
	readonly convertedCraftNodes: number;
	readonly generatedPhysicalInstances: number;
	readonly convertedLinks: number;
	readonly unknownRecipes: readonly string[];
	readonly unsupportedNodeKinds: readonly number[];
	readonly droppedLinks: number;
	readonly expansions: readonly UpstreamNodeConversion[];
}

export type UpstreamFcsPreview =
	| {
			readonly ok: true;
			readonly plan: FactoryPlanV4;
			readonly report: UpstreamConversionReport;
			readonly originalText: string;
	  }
	| { readonly ok: false; readonly message: string; readonly originalText: string };

type MutableJson = Record<string, unknown>;

function isRecord(value: unknown): value is MutableJson {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function array(value: unknown): MutableJson[] {
	return Array.isArray(value) ? value.filter(isRecord) : [];
}

function migrateUpstreamSave(raw: MutableJson): {
	readonly value: MutableJson;
	readonly sourceVersion: number;
	readonly steps: readonly UpstreamMigrationStep[];
} {
	const sourceVersion = typeof raw.save_version === "number" ? raw.save_version : 0;
	if (!Number.isInteger(sourceVersion) || sourceVersion < 1)
		throw new Error("Missing supported .fcs save_version.");
	if (sourceVersion > UPSTREAM_FCS_VERSION)
		throw new Error(`Future .fcs version ${sourceVersion} is not supported.`);
	const value = clone(raw);
	const steps: UpstreamMigrationStep[] = [];
	while ((value.save_version as number) < UPSTREAM_FCS_VERSION) {
		const fromVersion = value.save_version as number;
		if (fromVersion === 1) {
			for (const link of array(value.links)) {
				for (const endpointName of ["start", "end"]) {
					const endpoint = link[endpointName];
					if (isRecord(endpoint)) delete endpoint.is_out;
				}
			}
		} else if (fromVersion === 2) {
			for (const node of array(value.nodes)) node.num_somersloop = 0;
		} else if (fromVersion === 3) {
			for (const node of array(value.nodes)) if (node.kind === 0) node.built = false;
		} else if (fromVersion === 4) {
			for (const node of array(value.nodes)) node.locked = false;
		} else if (fromVersion === 5) {
			value.production_multiplier_index = 3;
		} else if (fromVersion === 6) {
			value.power_multiplier_index = 3;
		}
		value.save_version = fromVersion + 1;
		steps.push({ fromVersion, toVersion: fromVersion + 1 });
	}
	return { value, sourceVersion, steps };
}

function deterministicUuid(counter: number): string {
	return `10000000-0000-4000-8000-${counter.toString(16).padStart(12, "0")}`;
}

function upstreamRecipeTemplate(recipeName: string) {
	const normalized = recipeName.trim().toLocaleLowerCase();
	return FALLBACK_GRAPH_CATALOG.find((entry) => {
		const displayRecipe = entry.displayName.split("·").at(-1)?.trim().toLocaleLowerCase();
		return (
			entry.recipeId.toLocaleLowerCase() === normalized ||
			displayRecipe === normalized ||
			entry.aliases.some((alias) => alias.toLocaleLowerCase() === normalized)
		);
	});
}

function rationalField(value: unknown): Rational {
	if (!isRecord(value)) return Rational.parse("1");
	const numerator = typeof value.num === "number" ? value.num : 1;
	const denominator = typeof value.den === "number" && value.den !== 0 ? value.den : 1;
	return Rational.create(BigInt(Math.trunc(numerator)), BigInt(Math.trunc(denominator)));
}

interface GeneratedInstance {
	readonly node: MachinePlanNodeV3;
	readonly inputPortIds: readonly string[];
	readonly outputPortIds: readonly string[];
}

export function previewUpstreamFcsImport(
	originalText: string,
	strategy: AggregateExpansionStrategy = "expand-rounded-up",
): UpstreamFcsPreview {
	let raw: unknown;
	try {
		raw = JSON.parse(originalText);
	} catch {
		return { ok: false, message: "The .fcs file is not valid JSON.", originalText };
	}
	if (!isRecord(raw))
		return { ok: false, message: "The .fcs root must be an object.", originalText };
	let migrated: ReturnType<typeof migrateUpstreamSave>;
	try {
		migrated = migrateUpstreamSave(raw);
	} catch (error) {
		return {
			ok: false,
			message: error instanceof Error ? error.message : "Unsupported .fcs file.",
			originalText,
		};
	}

	let idCounter = 1;
	const nextId = () => deterministicUuid(idCounter++);
	const planId = nextId();
	const nodes: MachinePlanNodeV3[] = [];
	const generatedBySource = new Map<number, GeneratedInstance[]>();
	const unknownRecipes = new Set<string>();
	const unsupportedNodeKinds = new Set<number>();
	const expansions: UpstreamNodeConversion[] = [];
	let convertedCraftNodes = 0;
	for (const [sourceNodeIndex, sourceNode] of array(migrated.value.nodes).entries()) {
		const kind = typeof sourceNode.kind === "number" ? sourceNode.kind : -1;
		if (kind !== 0) {
			unsupportedNodeKinds.add(kind);
			continue;
		}
		convertedCraftNodes += 1;
		const sourceRecipe =
			typeof sourceNode.recipe === "string" ? sourceNode.recipe : "Unknown recipe";
		const template = upstreamRecipeTemplate(sourceRecipe);
		const aggregateRate = rationalField(sourceNode.rate);
		const roundedCount = Math.max(1, Math.min(100, Math.ceil(Number(aggregateRate.toDecimal(6)))));
		const physicalInstanceCount = strategy === "single-aggregate" ? 1 : roundedCount;
		const generated: GeneratedInstance[] = [];
		for (let instanceIndex = 0; instanceIndex < physicalInstanceCount; instanceIndex += 1) {
			const nodeId = nextId();
			const position = isRecord(sourceNode.pos)
				? {
						x: Number(sourceNode.pos.x ?? 0) + instanceIndex * 36,
						y: Number(sourceNode.pos.y ?? 0) + instanceIndex * 36,
					}
				: { x: sourceNodeIndex * 280, y: 80 };
			const ports = (template?.ports ?? []).map((port) => ({ ...port, id: nextId() }));
			const perInstanceRate = aggregateRate.divide(Rational.parse(String(physicalInstanceCount)));
			const clockPercent = Math.max(
				1,
				Math.min(250, Number(perInstanceRate.multiply(Rational.parse("100")).toDecimal(4))),
			);
			const node: MachinePlanNodeV3 = {
				kind: "machine",
				id: nodeId,
				buildingId: template?.buildingId ?? "unresolved:upstream-building",
				recipeId: template?.recipeId ?? `unresolved:${sourceRecipe}`,
				displayName: template?.displayName ?? `Unresolved · ${sourceRecipe}`,
				position,
				clockPercent: clockPercent.toFixed(4),
				powerShardCount:
					clockPercent > 200 ? 3 : clockPercent > 150 ? 2 : clockPercent > 100 ? 1 : 0,
				somersloopCount: Math.max(0, Math.min(4, Number(sourceNode.num_somersloop ?? 0))),
				standby: false,
				ports,
			};
			if (!template) unknownRecipes.add(sourceRecipe);
			nodes.push(node);
			generated.push({
				node,
				inputPortIds: ports.filter((port) => port.direction === "input").map((port) => port.id),
				outputPortIds: ports.filter((port) => port.direction === "output").map((port) => port.id),
			});
		}
		generatedBySource.set(sourceNodeIndex, generated);
		expansions.push({
			sourceNodeIndex,
			sourceRecipe,
			strategy,
			aggregateRate: aggregateRate.toString(),
			physicalInstanceCount,
			generatedNodeIds: generated.map((entry) => entry.node.id),
		});
	}

	const edges: TransportEdgeV4[] = [];
	let droppedLinks = 0;
	for (const link of array(migrated.value.links)) {
		const start = isRecord(link.start) ? link.start : {};
		const end = isRecord(link.end) ? link.end : {};
		const sourceInstances = generatedBySource.get(Number(start.node));
		const targetInstances = generatedBySource.get(Number(end.node));
		const sourcePin = Number(start.pin);
		const targetPin = Number(end.pin);
		if (!sourceInstances || !targetInstances) {
			droppedLinks += 1;
			continue;
		}
		const pairCount = Math.max(sourceInstances.length, targetInstances.length);
		let generatedForLink = 0;
		for (let index = 0; index < pairCount; index += 1) {
			const source = sourceInstances[index % sourceInstances.length];
			const target = targetInstances[index % targetInstances.length];
			const fromPortId = source?.outputPortIds[sourcePin];
			const toPortId = target?.inputPortIds[targetPin];
			const sourcePort = source?.node.ports.find((port) => port.id === fromPortId);
			const targetPort = target?.node.ports.find((port) => port.id === toPortId);
			if (
				!fromPortId ||
				!toPortId ||
				!sourcePort ||
				!targetPort ||
				sourcePort.materialId !== targetPort.materialId
			)
				continue;
			const medium = sourcePort.materialForm === "fluid" ? "pipeline" : "conveyor";
			edges.push({
				id: nextId(),
				fromPortId,
				toPortId,
				medium,
				transportTierId: medium === "pipeline" ? "pipeline-mk2" : "conveyor-mk6",
				itemOrFluidId: sourcePort.materialId,
				requestedRate: Rational.parse("0").toJSON(),
				actualRate: Rational.parse("0").toJSON(),
			});
			generatedForLink += 1;
		}
		if (generatedForLink === 0) droppedLinks += 1;
	}
	const now = "2026-08-11T00:00:00.000Z";
	const plan: FactoryPlanV4 = {
		schemaVersion: 5,
		planId,
		name: "Imported upstream factory",
		createdAt: now,
		updatedAt: now,
		gameDataSnapshotId: FALLBACK_GRAPH_CATALOG_VERSION,
		gameProfile: DEFAULT_SATISFACTORY_12_PROFILE,
		localization: { uiLocale: "en", gameDataLocale: "en-US", gameDataFallbackLocale: "en-US" },
		nodes,
		edges,
		viewport: { x: 0, y: 0, zoom: 1 },
		userMetadata: {
			upstreamFcsVersion: migrated.sourceVersion,
			upstreamOriginalPreserved: true,
			aggregateExpansionStrategy: strategy,
		},
	};
	return {
		ok: true,
		plan,
		report: {
			sourceVersion: migrated.sourceVersion,
			targetVersion: UPSTREAM_FCS_VERSION,
			migrationSteps: migrated.steps,
			gameVersion: String(migrated.value.game_version ?? "unknown"),
			convertedCraftNodes,
			generatedPhysicalInstances: nodes.length,
			convertedLinks: edges.length,
			unknownRecipes: [...unknownRecipes].sort(),
			unsupportedNodeKinds: [...unsupportedNodeKinds].sort((left, right) => left - right),
			droppedLinks,
			expansions,
		},
		originalText,
	};
}
