import { DomainValidationError } from "./errors";
import { ClockPercent } from "./units";

declare const uuidBrand: unique symbol;
export type Uuid = string & { readonly [uuidBrand]: "Uuid" };

export type UuidFactory = () => string;
export type MaterialForm = "solid" | "fluid";
export type PortDirection = "input" | "output";
export type ResourcePurity = "impure" | "normal" | "pure";

export interface MachinePortTemplate {
	readonly key: string;
	readonly direction: PortDirection;
	readonly materialForm: MaterialForm;
}

export interface MachinePort extends MachinePortTemplate {
	readonly id: Uuid;
}

export interface MachineDefinition {
	readonly id: string;
	readonly compatibleRecipeIds: readonly string[];
	readonly somersloopSlots: number;
	readonly powerShardSlots?: number;
	readonly ports: readonly MachinePortTemplate[];
}

export interface MachineSettings {
	readonly clockPercent: ClockPercent;
	readonly powerShardCount: number;
	readonly somersloopCount: number;
	readonly standby: boolean;
}

export interface MachineInstance {
	readonly kind: "machine";
	readonly id: Uuid;
	readonly buildingId: string;
	readonly recipeId: string;
	readonly settings: MachineSettings;
	readonly ports: readonly MachinePort[];
}

export interface CreateMachineInstanceInput {
	readonly id?: string;
	readonly recipeId: string;
	readonly clockPercent?: string;
	readonly powerShardCount?: number;
	readonly somersloopCount?: number;
	readonly standby?: boolean;
}

export interface ExtractorConfig {
	readonly extractorTypeId: string;
	readonly resourceId: string;
	readonly purity: ResourcePurity;
	readonly clockPercent: ClockPercent;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function defaultUuidFactory(): string {
	if (typeof globalThis.crypto?.randomUUID !== "function") {
		throw new DomainValidationError(
			"INVALID_IDENTIFIER",
			"This runtime does not provide crypto.randomUUID().",
		);
	}
	return globalThis.crypto.randomUUID();
}

export function parseUuid(value: string, path = "$.id"): Uuid {
	if (!UUID_PATTERN.test(value)) {
		throw new DomainValidationError(
			"INVALID_IDENTIFIER",
			`Expected an RFC 4122 UUID at ${path}.`,
			path,
		);
	}
	return value.toLowerCase() as Uuid;
}

export function createUuid(factory: UuidFactory = defaultUuidFactory): Uuid {
	return parseUuid(factory());
}

function assertNonEmptyIdentifier(value: string, path: string): void {
	if (value.trim().length === 0) {
		throw new DomainValidationError(
			"INVALID_IDENTIFIER",
			`Expected a non-empty identifier at ${path}.`,
			path,
		);
	}
}

function validateDefinition(definition: MachineDefinition): void {
	assertNonEmptyIdentifier(definition.id, "$.definition.id");
	if (
		!Number.isInteger(definition.somersloopSlots) ||
		definition.somersloopSlots < 0 ||
		definition.somersloopSlots > 4
	) {
		throw new DomainValidationError(
			"INVALID_SOMERSLOOP_COUNT",
			"Machine Somersloop slots must be an integer between 0 and 4.",
			"$.definition.somersloopSlots",
		);
	}
	const shardSlots = definition.powerShardSlots ?? 3;
	if (!Number.isInteger(shardSlots) || shardSlots < 0 || shardSlots > 3) {
		throw new DomainValidationError(
			"INVALID_POWER_SHARD_COUNT",
			"Machine power shard slots must be an integer between 0 and 3.",
			"$.definition.powerShardSlots",
		);
	}
	const recipeIds = new Set<string>();
	for (const [index, recipeId] of definition.compatibleRecipeIds.entries()) {
		assertNonEmptyIdentifier(recipeId, `$.definition.compatibleRecipeIds[${index}]`);
		if (recipeIds.has(recipeId)) {
			throw new DomainValidationError(
				"INCOMPATIBLE_RECIPE",
				`Duplicate compatible recipe id: ${recipeId}`,
				`$.definition.compatibleRecipeIds[${index}]`,
			);
		}
		recipeIds.add(recipeId);
	}

	const portKeys = new Set<string>();
	for (const [index, port] of definition.ports.entries()) {
		assertNonEmptyIdentifier(port.key, `$.definition.ports[${index}].key`);
		if (portKeys.has(port.key)) {
			throw new DomainValidationError(
				"INVALID_PORT",
				`Duplicate machine port key: ${port.key}`,
				`$.definition.ports[${index}].key`,
			);
		}
		portKeys.add(port.key);
		if (port.direction !== "input" && port.direction !== "output") {
			throw new DomainValidationError(
				"INVALID_PORT",
				"Machine port direction must be input or output.",
				`$.definition.ports[${index}].direction`,
			);
		}
		if (port.materialForm !== "solid" && port.materialForm !== "fluid") {
			throw new DomainValidationError(
				"INVALID_PORT",
				"Machine port material form must be solid or fluid.",
				`$.definition.ports[${index}].materialForm`,
			);
		}
	}
}

function assertRecipeCompatibility(recipeId: string, definition: MachineDefinition): void {
	assertNonEmptyIdentifier(recipeId, "$.recipeId");
	if (!definition.compatibleRecipeIds.includes(recipeId)) {
		throw new DomainValidationError(
			"INCOMPATIBLE_RECIPE",
			`Recipe ${recipeId} cannot be produced in ${definition.id}.`,
			"$.recipeId",
		);
	}
}

function assertPowerShardCount(powerShardCount: number, definition: MachineDefinition): void {
	const maximum = definition.powerShardSlots ?? 3;
	if (!Number.isInteger(powerShardCount) || powerShardCount < 0 || powerShardCount > maximum) {
		throw new DomainValidationError(
			"INVALID_POWER_SHARD_COUNT",
			`Power shard count must be an integer between 0 and ${maximum}.`,
			"$.settings.powerShardCount",
		);
	}
}

function assertClockCapacity(clockPercent: ClockPercent, powerShardCount: number): void {
	const maximum = ClockPercent.maximumForShardCount(powerShardCount);
	if (clockPercent.compare(maximum) > 0) {
		throw new DomainValidationError(
			"CLOCK_EXCEEDS_SHARD_CAPACITY",
			`Clock ${clockPercent} exceeds the ${maximum} capacity of ${powerShardCount} power shard(s).`,
			"$.settings.clockPercent",
		);
	}
}

function assertSomersloopCount(somersloopCount: number, definition: MachineDefinition): void {
	if (
		!Number.isInteger(somersloopCount) ||
		somersloopCount < 0 ||
		somersloopCount > definition.somersloopSlots
	) {
		throw new DomainValidationError(
			"INVALID_SOMERSLOOP_COUNT",
			`Somersloop count must be an integer between 0 and ${definition.somersloopSlots}.`,
			"$.settings.somersloopCount",
		);
	}
}

function freezeSettings(settings: MachineSettings): MachineSettings {
	return Object.freeze({ ...settings });
}

function freezeInstance(instance: MachineInstance): MachineInstance {
	return Object.freeze({
		...instance,
		settings: freezeSettings(instance.settings),
		ports: Object.freeze(instance.ports.map((port) => Object.freeze({ ...port }))),
	});
}

export function createMachineInstance(
	definition: MachineDefinition,
	input: CreateMachineInstanceInput,
	uuidFactory: UuidFactory = defaultUuidFactory,
): MachineInstance {
	validateDefinition(definition);
	assertRecipeCompatibility(input.recipeId, definition);
	const powerShardCount = input.powerShardCount ?? 0;
	const somersloopCount = input.somersloopCount ?? 0;
	const clockPercent = ClockPercent.parse(input.clockPercent ?? "100");
	assertPowerShardCount(powerShardCount, definition);
	assertClockCapacity(clockPercent, powerShardCount);
	assertSomersloopCount(somersloopCount, definition);

	const id = input.id === undefined ? createUuid(uuidFactory) : parseUuid(input.id);
	const ports = definition.ports.map((port) =>
		Object.freeze({
			id: createUuid(uuidFactory),
			key: port.key,
			direction: port.direction,
			materialForm: port.materialForm,
		}),
	);

	return freezeInstance({
		kind: "machine",
		id,
		buildingId: definition.id,
		recipeId: input.recipeId,
		settings: {
			clockPercent,
			powerShardCount,
			somersloopCount,
			standby: input.standby ?? false,
		},
		ports,
	});
}

export function setMachineClock(instance: MachineInstance, clockPercent: string): MachineInstance {
	const clock = ClockPercent.parse(clockPercent);
	assertClockCapacity(clock, instance.settings.powerShardCount);
	return freezeInstance({
		...instance,
		settings: { ...instance.settings, clockPercent: clock },
	});
}

export function setMachinePowerShardCount(
	instance: MachineInstance,
	powerShardCount: number,
	definition: MachineDefinition,
): MachineInstance {
	if (definition.id !== instance.buildingId) {
		throw new DomainValidationError(
			"INVALID_IDENTIFIER",
			"Machine definition does not match the instance.",
		);
	}
	assertPowerShardCount(powerShardCount, definition);
	assertClockCapacity(instance.settings.clockPercent, powerShardCount);
	return freezeInstance({
		...instance,
		settings: { ...instance.settings, powerShardCount },
	});
}

export function setMachineSomersloopCount(
	instance: MachineInstance,
	somersloopCount: number,
	definition: MachineDefinition,
): MachineInstance {
	if (definition.id !== instance.buildingId) {
		throw new DomainValidationError(
			"INVALID_IDENTIFIER",
			"Machine definition does not match the instance.",
		);
	}
	assertSomersloopCount(somersloopCount, definition);
	return freezeInstance({
		...instance,
		settings: { ...instance.settings, somersloopCount },
	});
}

export function setMachineRecipe(
	instance: MachineInstance,
	recipeId: string,
	definition: MachineDefinition,
): MachineInstance {
	if (definition.id !== instance.buildingId) {
		throw new DomainValidationError(
			"INVALID_IDENTIFIER",
			"Machine definition does not match the instance.",
		);
	}
	assertRecipeCompatibility(recipeId, definition);
	return freezeInstance({ ...instance, recipeId });
}

export function setMachineStandby(instance: MachineInstance, standby: boolean): MachineInstance {
	return freezeInstance({
		...instance,
		settings: { ...instance.settings, standby },
	});
}

export function createExtractorConfig(input: {
	readonly extractorTypeId: string;
	readonly resourceId: string;
	readonly purity: ResourcePurity;
	readonly clockPercent?: string;
}): ExtractorConfig {
	assertNonEmptyIdentifier(input.extractorTypeId, "$.extractorTypeId");
	assertNonEmptyIdentifier(input.resourceId, "$.resourceId");
	if (!["impure", "normal", "pure"].includes(input.purity)) {
		throw new DomainValidationError(
			"INVALID_EXTRACTOR_CONFIG",
			"Unknown extractor purity.",
			"$.purity",
		);
	}
	return Object.freeze({
		extractorTypeId: input.extractorTypeId,
		resourceId: input.resourceId,
		purity: input.purity,
		clockPercent: ClockPercent.parse(input.clockPercent ?? "100"),
	});
}
