import { DomainValidationError, type DomainErrorCode } from "./errors";
import { parseUuid } from "./machine";
import { Rational, type RationalJson } from "./rational";
import { ClockPercent } from "./units";

export const FACTORY_PLAN_SCHEMA_VERSION = 1 as const;

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];
export interface JsonObject {
	readonly [key: string]: JsonValue;
}

export interface GameProfileV1 {
	readonly id: string;
	readonly version: string;
}

export interface MachinePlanPortV1 {
	readonly id: string;
	readonly key: string;
	readonly direction: "input" | "output";
	readonly materialForm: "solid" | "fluid";
}

export interface MachinePlanNodeV1 {
	readonly kind: "machine";
	readonly id: string;
	readonly buildingId: string;
	readonly recipeId: string;
	readonly clockPercent: string;
	readonly powerShardCount: number;
	readonly somersloopCount: number;
	readonly standby: boolean;
	readonly ports: readonly MachinePlanPortV1[];
}

export interface TransportEdgeV1 {
	readonly id: string;
	readonly fromPortId: string;
	readonly toPortId: string;
	readonly medium: "conveyor" | "pipeline" | "virtual";
	readonly itemOrFluidId: string;
	readonly requestedRate: RationalJson;
	readonly actualRate: RationalJson;
}

export interface FactoryPlanV1 {
	readonly schemaVersion: typeof FACTORY_PLAN_SCHEMA_VERSION;
	readonly planId: string;
	readonly name: string;
	readonly createdAt: string;
	readonly updatedAt: string;
	readonly gameDataSnapshotId: string;
	readonly gameProfile: GameProfileV1;
	readonly nodes: readonly MachinePlanNodeV1[];
	readonly edges: readonly TransportEdgeV1[];
	readonly viewport: {
		readonly x: number;
		readonly y: number;
		readonly zoom: number;
	};
	readonly userMetadata: Readonly<Record<string, JsonValue>>;
}

export interface PlanValidationIssue {
	readonly code: DomainErrorCode;
	readonly path: string;
	readonly message: string;
}

export type ParseFactoryPlanResult =
	| { readonly ok: true; readonly value: FactoryPlanV1 }
	| { readonly ok: false; readonly issues: readonly PlanValidationIssue[] };

export interface PlanMigration {
	readonly fromVersion: number;
	readonly toVersion: number;
	migrate(plan: JsonObject): JsonObject;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJsonValue(value: unknown): value is JsonValue {
	if (value === null || typeof value === "string" || typeof value === "boolean") return true;
	if (typeof value === "number") return Number.isFinite(value);
	if (Array.isArray(value)) return value.every(isJsonValue);
	if (!isRecord(value)) return false;
	return Object.values(value).every(isJsonValue);
}

function cloneJson<T extends JsonValue>(value: T): T {
	if (Array.isArray(value)) return value.map((entry) => cloneJson(entry)) as unknown as T;
	if (isRecord(value)) {
		return Object.fromEntries(
			Object.entries(value).map(([key, entry]) => [key, cloneJson(entry as JsonValue)]),
		) as T;
	}
	return value;
}

function canonicalJson(value: JsonValue): string {
	if (
		value === null ||
		typeof value === "boolean" ||
		typeof value === "number" ||
		typeof value === "string"
	) {
		return JSON.stringify(value);
	}
	if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
	const objectValue = value as JsonObject;
	return `{${Object.keys(objectValue)
		.sort()
		.map((key) => `${JSON.stringify(key)}:${canonicalJson(objectValue[key] as JsonValue)}`)
		.join(",")}}`;
}

function issue(
	issues: PlanValidationIssue[],
	code: DomainErrorCode,
	path: string,
	message: string,
): void {
	issues.push({ code, path, message });
}

function requireRecord(
	value: unknown,
	path: string,
	issues: PlanValidationIssue[],
): Record<string, unknown> | undefined {
	if (!isRecord(value)) {
		issue(issues, "INVALID_PLAN", path, "Expected an object.");
		return undefined;
	}
	return value;
}

function requireString(
	value: unknown,
	path: string,
	issues: PlanValidationIssue[],
): value is string {
	if (typeof value !== "string" || value.trim().length === 0) {
		issue(issues, "INVALID_PLAN", path, "Expected a non-empty string.");
		return false;
	}
	return true;
}

function requireUuid(value: unknown, path: string, issues: PlanValidationIssue[]): value is string {
	if (typeof value !== "string") {
		issue(issues, "INVALID_PLAN", path, "Expected a UUID string.");
		return false;
	}
	try {
		parseUuid(value, path);
		return true;
	} catch (error) {
		issue(
			issues,
			"INVALID_PLAN",
			path,
			error instanceof Error ? error.message : "Expected a valid UUID.",
		);
		return false;
	}
}

function requireInteger(
	value: unknown,
	path: string,
	issues: PlanValidationIssue[],
	minimum: number,
	maximum?: number,
): value is number {
	if (
		typeof value !== "number" ||
		!Number.isInteger(value) ||
		value < minimum ||
		(maximum !== undefined && value > maximum)
	) {
		const range =
			maximum === undefined ? `at least ${minimum}` : `between ${minimum} and ${maximum}`;
		issue(issues, "INVALID_PLAN", path, `Expected an integer ${range}.`);
		return false;
	}
	return true;
}

function requireFiniteNumber(
	value: unknown,
	path: string,
	issues: PlanValidationIssue[],
): value is number {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		issue(issues, "INVALID_PLAN", path, "Expected a finite number.");
		return false;
	}
	return true;
}

function requireIsoTimestamp(
	value: unknown,
	path: string,
	issues: PlanValidationIssue[],
): value is string {
	if (typeof value !== "string") {
		issue(issues, "INVALID_PLAN", path, "Expected an ISO-8601 UTC timestamp.");
		return false;
	}
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
		issue(issues, "INVALID_PLAN", path, "Expected a canonical ISO-8601 UTC timestamp.");
		return false;
	}
	return true;
}

function validateRate(value: unknown, path: string, issues: PlanValidationIssue[]): void {
	const rate = requireRecord(value, path, issues);
	if (!rate) return;
	if (typeof rate.numerator !== "string" || typeof rate.denominator !== "string") {
		issue(issues, "INVALID_PLAN", path, "Expected string numerator and denominator fields.");
		return;
	}
	try {
		Rational.parse({ numerator: rate.numerator, denominator: rate.denominator });
	} catch (error) {
		issue(
			issues,
			"INVALID_PLAN",
			path,
			error instanceof Error ? error.message : "Invalid rational rate.",
		);
	}
}

function validateMachineNode(
	value: unknown,
	index: number,
	issues: PlanValidationIssue[],
	entityIds: Set<string>,
	portIds: Set<string>,
): void {
	const path = `$.nodes[${index}]`;
	const node = requireRecord(value, path, issues);
	if (!node) return;
	if (node.kind !== "machine") issue(issues, "INVALID_PLAN", `${path}.kind`, "Expected machine.");
	if (requireUuid(node.id, `${path}.id`, issues)) {
		if (entityIds.has(node.id) || portIds.has(node.id))
			issue(issues, "INVALID_PLAN", `${path}.id`, "Duplicate plan UUID.");
		entityIds.add(node.id);
	}
	requireString(node.buildingId, `${path}.buildingId`, issues);
	requireString(node.recipeId, `${path}.recipeId`, issues);

	let clock: ClockPercent | undefined;
	if (typeof node.clockPercent !== "string") {
		issue(issues, "INVALID_PLAN", `${path}.clockPercent`, "Expected a clock percent string.");
	} else {
		try {
			clock = ClockPercent.parse(node.clockPercent);
		} catch (error) {
			issue(
				issues,
				"INVALID_PLAN",
				`${path}.clockPercent`,
				error instanceof Error ? error.message : "Invalid clock percent.",
			);
		}
	}
	if (requireInteger(node.powerShardCount, `${path}.powerShardCount`, issues, 0, 3) && clock) {
		const maximum = ClockPercent.maximumForShardCount(node.powerShardCount);
		if (clock.compare(maximum) > 0) {
			issue(
				issues,
				"INVALID_PLAN",
				`${path}.clockPercent`,
				"Clock percent exceeds the saved power shard capacity.",
			);
		}
	}
	requireInteger(node.somersloopCount, `${path}.somersloopCount`, issues, 0, 4);
	if (typeof node.standby !== "boolean") {
		issue(issues, "INVALID_PLAN", `${path}.standby`, "Expected a boolean.");
	}

	if (!Array.isArray(node.ports)) {
		issue(issues, "INVALID_PLAN", `${path}.ports`, "Expected an array.");
		return;
	}
	const portKeys = new Set<string>();
	for (const [portIndex, rawPort] of node.ports.entries()) {
		const portPath = `${path}.ports[${portIndex}]`;
		const port = requireRecord(rawPort, portPath, issues);
		if (!port) continue;
		if (requireUuid(port.id, `${portPath}.id`, issues)) {
			if (portIds.has(port.id) || entityIds.has(port.id))
				issue(issues, "INVALID_PLAN", `${portPath}.id`, "Duplicate plan UUID.");
			portIds.add(port.id);
		}
		if (requireString(port.key, `${portPath}.key`, issues)) {
			if (portKeys.has(port.key))
				issue(issues, "INVALID_PLAN", `${portPath}.key`, "Duplicate port key.");
			portKeys.add(port.key);
		}
		if (port.direction !== "input" && port.direction !== "output") {
			issue(issues, "INVALID_PLAN", `${portPath}.direction`, "Expected input or output.");
		}
		if (port.materialForm !== "solid" && port.materialForm !== "fluid") {
			issue(issues, "INVALID_PLAN", `${portPath}.materialForm`, "Expected solid or fluid.");
		}
	}
}

function validateEdge(
	value: unknown,
	index: number,
	issues: PlanValidationIssue[],
	entityIds: Set<string>,
	portIds: Set<string>,
): void {
	const path = `$.edges[${index}]`;
	const edge = requireRecord(value, path, issues);
	if (!edge) return;
	if (requireUuid(edge.id, `${path}.id`, issues)) {
		if (entityIds.has(edge.id) || portIds.has(edge.id))
			issue(issues, "INVALID_PLAN", `${path}.id`, "Duplicate plan UUID.");
		entityIds.add(edge.id);
	}
	for (const field of ["fromPortId", "toPortId"] as const) {
		if (requireUuid(edge[field], `${path}.${field}`, issues) && !portIds.has(edge[field])) {
			issue(issues, "INVALID_PLAN", `${path}.${field}`, "Edge references an unknown port UUID.");
		}
	}
	if (!["conveyor", "pipeline", "virtual"].includes(edge.medium as string)) {
		issue(issues, "INVALID_PLAN", `${path}.medium`, "Unknown transport medium.");
	}
	requireString(edge.itemOrFluidId, `${path}.itemOrFluidId`, issues);
	validateRate(edge.requestedRate, `${path}.requestedRate`, issues);
	validateRate(edge.actualRate, `${path}.actualRate`, issues);
}

function collectFactoryPlanIssues(value: JsonObject): readonly PlanValidationIssue[] {
	const issues: PlanValidationIssue[] = [];
	if (value.schemaVersion !== FACTORY_PLAN_SCHEMA_VERSION) {
		issue(
			issues,
			"INVALID_PLAN",
			"$.schemaVersion",
			`Expected schema version ${FACTORY_PLAN_SCHEMA_VERSION}.`,
		);
	}
	const planIdValid = requireUuid(value.planId, "$.planId", issues);
	requireString(value.name, "$.name", issues);
	const createdValid = requireIsoTimestamp(value.createdAt, "$.createdAt", issues);
	const updatedValid = requireIsoTimestamp(value.updatedAt, "$.updatedAt", issues);
	if (
		createdValid &&
		updatedValid &&
		typeof value.updatedAt === "string" &&
		typeof value.createdAt === "string" &&
		value.updatedAt < value.createdAt
	) {
		issue(issues, "INVALID_PLAN", "$.updatedAt", "updatedAt cannot be earlier than createdAt.");
	}
	requireString(value.gameDataSnapshotId, "$.gameDataSnapshotId", issues);

	const profile = requireRecord(value.gameProfile, "$.gameProfile", issues);
	if (profile) {
		requireString(profile.id, "$.gameProfile.id", issues);
		requireString(profile.version, "$.gameProfile.version", issues);
	}

	const entityIds = new Set<string>();
	const portIds = new Set<string>();
	if (planIdValid && typeof value.planId === "string") entityIds.add(value.planId);
	if (!Array.isArray(value.nodes)) {
		issue(issues, "INVALID_PLAN", "$.nodes", "Expected an array.");
	} else {
		for (const [index, node] of value.nodes.entries()) {
			validateMachineNode(node, index, issues, entityIds, portIds);
		}
	}
	if (!Array.isArray(value.edges)) {
		issue(issues, "INVALID_PLAN", "$.edges", "Expected an array.");
	} else {
		for (const [index, edge] of value.edges.entries()) {
			validateEdge(edge, index, issues, entityIds, portIds);
		}
	}

	const viewport = requireRecord(value.viewport, "$.viewport", issues);
	if (viewport) {
		requireFiniteNumber(viewport.x, "$.viewport.x", issues);
		requireFiniteNumber(viewport.y, "$.viewport.y", issues);
		if (requireFiniteNumber(viewport.zoom, "$.viewport.zoom", issues) && viewport.zoom <= 0) {
			issue(issues, "INVALID_PLAN", "$.viewport.zoom", "Viewport zoom must be greater than zero.");
		}
	}
	requireRecord(value.userMetadata, "$.userMetadata", issues);
	return issues;
}

export function validateFactoryPlan(input: unknown): readonly PlanValidationIssue[] {
	if (!isJsonValue(input) || !isRecord(input)) {
		return [{ code: "INVALID_PLAN", path: "$", message: "Plan must be a finite JSON object." }];
	}
	return collectFactoryPlanIssues(input as JsonObject);
}

export class PlanMigrationRegistry {
	readonly currentVersion: number;
	readonly #migrations = new Map<number, PlanMigration>();

	constructor(currentVersion: number = FACTORY_PLAN_SCHEMA_VERSION) {
		if (!Number.isInteger(currentVersion) || currentVersion < 1) {
			throw new DomainValidationError(
				"UNSUPPORTED_SCHEMA_VERSION",
				"Current schema version must be positive.",
			);
		}
		this.currentVersion = currentVersion;
	}

	register(migration: PlanMigration): this {
		if (migration.toVersion !== migration.fromVersion + 1 || migration.fromVersion < 1) {
			throw new DomainValidationError(
				"UNSUPPORTED_SCHEMA_VERSION",
				"Plan migrations must advance exactly one positive schema version.",
			);
		}
		if (this.#migrations.has(migration.fromVersion)) {
			throw new DomainValidationError(
				"UNSUPPORTED_SCHEMA_VERSION",
				`A migration from version ${migration.fromVersion} is already registered.`,
			);
		}
		this.#migrations.set(migration.fromVersion, migration);
		return this;
	}

	migrate(plan: JsonObject): JsonObject {
		if (!Number.isInteger(plan.schemaVersion)) {
			throw new DomainValidationError(
				"UNSUPPORTED_SCHEMA_VERSION",
				"Plan schemaVersion must be an integer.",
			);
		}
		let version = plan.schemaVersion as number;
		if (version > this.currentVersion) {
			throw new DomainValidationError(
				"UNSUPPORTED_SCHEMA_VERSION",
				`Plan schema version ${version} is newer than supported version ${this.currentVersion}.`,
				"$.schemaVersion",
			);
		}
		let migrated = cloneJson(plan);
		while (version < this.currentVersion) {
			const migration = this.#migrations.get(version);
			if (!migration) {
				throw new DomainValidationError(
					"MISSING_MIGRATION",
					`No migration is registered from schema version ${version}.`,
					"$.schemaVersion",
				);
			}
			migrated = cloneJson(migration.migrate(migrated));
			if (migrated.schemaVersion !== migration.toVersion) {
				throw new DomainValidationError(
					"UNSUPPORTED_SCHEMA_VERSION",
					`Migration ${version}→${migration.toVersion} did not set schemaVersion correctly.`,
					"$.schemaVersion",
				);
			}
			version = migration.toVersion;
		}
		return migrated;
	}
}

export const planMigrationRegistry = new PlanMigrationRegistry();

export function parseFactoryPlan(
	input: string | unknown,
	registry: PlanMigrationRegistry = planMigrationRegistry,
): ParseFactoryPlanResult {
	let raw: unknown = input;
	if (typeof input === "string") {
		try {
			raw = JSON.parse(input);
		} catch {
			return {
				ok: false,
				issues: [{ code: "INVALID_PLAN", path: "$", message: "Plan is not valid JSON." }],
			};
		}
	}
	if (!isJsonValue(raw) || !isRecord(raw)) {
		return {
			ok: false,
			issues: [{ code: "INVALID_PLAN", path: "$", message: "Plan must be a finite JSON object." }],
		};
	}

	let migrated: JsonObject;
	try {
		migrated = registry.migrate(raw as JsonObject);
	} catch (error) {
		if (error instanceof DomainValidationError) {
			return {
				ok: false,
				issues: [{ code: error.code, path: error.path, message: error.message }],
			};
		}
		throw error;
	}
	const issues = validateFactoryPlan(migrated);
	if (issues.length > 0) return { ok: false, issues };
	return { ok: true, value: cloneJson(migrated) as unknown as FactoryPlanV1 };
}

export function serializeFactoryPlan(plan: FactoryPlanV1): string {
	const result = parseFactoryPlan(plan);
	if (!result.ok) {
		const first = result.issues[0];
		throw new DomainValidationError(
			first?.code ?? "INVALID_PLAN",
			first?.message ?? "Invalid factory plan.",
			first?.path ?? "$",
		);
	}
	return `${canonicalJson(result.value as unknown as JsonObject)}\n`;
}
