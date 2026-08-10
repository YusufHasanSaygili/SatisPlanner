import { describe, expect, it } from "vitest";
import type { DomainValidationError } from "./errors";
import {
	createExtractorConfig,
	createMachineInstance,
	type MachineDefinition,
	setMachineClock,
	setMachinePowerShardCount,
	setMachineRecipe,
	setMachineSomersloopCount,
	setMachineStandby,
	type UuidFactory,
} from "./machine";

const constructorDefinition: MachineDefinition = {
	id: "Build_ConstructorMk1_C",
	compatibleRecipeIds: ["Recipe_IronPlate_C", "Recipe_IronRod_C"],
	somersloopSlots: 1,
	powerShardSlots: 3,
	ports: [
		{ key: "input-0", direction: "input", materialForm: "solid" },
		{ key: "output-0", direction: "output", materialForm: "solid" },
	],
};

function sequentialUuidFactory(start = 1): UuidFactory {
	let next = start;
	return () => `00000000-0000-4000-8000-${(next++).toString().padStart(12, "0")}`;
}

describe("MachineInstance invariants", () => {
	it("enforces the complete shard-to-clock boundary matrix", () => {
		for (const [shards, maximum] of [
			[0, "100.0000"],
			[1, "150.0000"],
			[2, "200.0000"],
			[3, "250.0000"],
		] as const) {
			const valid = createMachineInstance(
				constructorDefinition,
				{ recipeId: "Recipe_IronPlate_C", powerShardCount: shards, clockPercent: maximum },
				sequentialUuidFactory(shards * 10 + 1),
			);
			expect(valid.settings.clockPercent.toJSON()).toBe(maximum);
			if (shards < 3) {
				const above = `${100 + shards * 50}.0001`;
				expect(() =>
					createMachineInstance(
						constructorDefinition,
						{ recipeId: "Recipe_IronPlate_C", powerShardCount: shards, clockPercent: above },
						sequentialUuidFactory(shards * 10 + 100),
					),
				).toThrowError(
					expect.objectContaining<Partial<DomainValidationError>>({
						code: "CLOCK_EXCEEDS_SHARD_CAPACITY",
					}),
				);
			}
		}
	});

	it("rejects invalid shard, Somersloop and recipe states at construction", () => {
		for (const invalidShardCount of [-1, 0.5, 4]) {
			expect(() =>
				createMachineInstance(
					constructorDefinition,
					{ recipeId: "Recipe_IronPlate_C", powerShardCount: invalidShardCount },
					sequentialUuidFactory(),
				),
			).toThrowError(
				expect.objectContaining<Partial<DomainValidationError>>({
					code: "INVALID_POWER_SHARD_COUNT",
				}),
			);
		}
		for (const invalidSomersloopCount of [-1, 0.5, 2]) {
			expect(() =>
				createMachineInstance(
					constructorDefinition,
					{ recipeId: "Recipe_IronPlate_C", somersloopCount: invalidSomersloopCount },
					sequentialUuidFactory(),
				),
			).toThrowError(
				expect.objectContaining<Partial<DomainValidationError>>({
					code: "INVALID_SOMERSLOOP_COUNT",
				}),
			);
		}
		expect(() =>
			createMachineInstance(
				constructorDefinition,
				{ recipeId: "Recipe_NotProducedHere_C" },
				sequentialUuidFactory(),
			),
		).toThrowError(
			expect.objectContaining<Partial<DomainValidationError>>({ code: "INCOMPATIBLE_RECIPE" }),
		);
	});

	it("enforces each supported building Somersloop slot boundary", () => {
		for (const slots of [0, 1, 2, 4]) {
			const definition = { ...constructorDefinition, somersloopSlots: slots };
			const valid = createMachineInstance(
				definition,
				{ recipeId: "Recipe_IronPlate_C", somersloopCount: slots },
				sequentialUuidFactory(slots * 10 + 400),
			);
			expect(valid.settings.somersloopCount).toBe(slots);
			expect(() =>
				createMachineInstance(
					definition,
					{ recipeId: "Recipe_IronPlate_C", somersloopCount: slots + 1 },
					sequentialUuidFactory(slots * 10 + 500),
				),
			).toThrowError(
				expect.objectContaining<Partial<DomainValidationError>>({
					code: "INVALID_SOMERSLOOP_COUNT",
				}),
			);
		}
	});

	it("keeps physical instances and their settings isolated", () => {
		const first = createMachineInstance(
			constructorDefinition,
			{ recipeId: "Recipe_IronPlate_C" },
			sequentialUuidFactory(1),
		);
		const second = createMachineInstance(
			constructorDefinition,
			{ recipeId: "Recipe_IronPlate_C" },
			sequentialUuidFactory(100),
		);
		const changed = setMachineClock(
			setMachinePowerShardCount(first, 1, constructorDefinition),
			"150",
		);

		expect(first.id).not.toBe(second.id);
		expect(first.settings).not.toBe(second.settings);
		expect(first.ports).not.toBe(second.ports);
		expect(first.ports[0]?.id).not.toBe(second.ports[0]?.id);
		expect(changed.settings.clockPercent.toJSON()).toBe("150.0000");
		expect(first.settings.clockPercent.toJSON()).toBe("100.0000");
		expect(second.settings.clockPercent.toJSON()).toBe("100.0000");
		expect(Object.isFrozen(changed)).toBe(true);
		expect(Object.isFrozen(changed.settings)).toBe(true);
	});

	it("preserves instance isolation over a deterministic multi-instance property matrix", () => {
		const instances = Array.from({ length: 100 }, (_, index) =>
			createMachineInstance(
				constructorDefinition,
				{ recipeId: index % 2 === 0 ? "Recipe_IronPlate_C" : "Recipe_IronRod_C" },
				sequentialUuidFactory(index * 10 + 1_000),
			),
		);
		const ids = new Set(instances.map((instance) => instance.id));
		const settingObjects = new Set(instances.map((instance) => instance.settings));
		const before = instances.map((instance) => JSON.stringify(instance));
		const selected = instances[37];
		expect(selected).toBeDefined();
		if (!selected) return;
		const updated = setMachineClock(
			setMachinePowerShardCount(selected, 1, constructorDefinition),
			"125.0000",
		);

		expect(ids.size).toBe(instances.length);
		expect(settingObjects.size).toBe(instances.length);
		expect(updated.id).toBe(selected.id);
		for (const [index, instance] of instances.entries()) {
			expect(JSON.stringify(instance), `instance ${index}`).toBe(before[index]);
		}
	});

	it("applies immutable commands while preserving identity and rejecting invalid transitions", () => {
		const original = createMachineInstance(
			constructorDefinition,
			{ recipeId: "Recipe_IronPlate_C", powerShardCount: 2, clockPercent: "200" },
			sequentialUuidFactory(),
		);
		const updated = setMachineStandby(
			setMachineSomersloopCount(
				setMachineRecipe(original, "Recipe_IronRod_C", constructorDefinition),
				1,
				constructorDefinition,
			),
			true,
		);
		expect(updated.id).toBe(original.id);
		expect(updated.recipeId).toBe("Recipe_IronRod_C");
		expect(updated.settings).toMatchObject({ somersloopCount: 1, standby: true });
		expect(original).toMatchObject({
			recipeId: "Recipe_IronPlate_C",
			settings: { somersloopCount: 0 },
		});
		expect(() => setMachinePowerShardCount(original, 1, constructorDefinition)).toThrowError(
			expect.objectContaining<Partial<DomainValidationError>>({
				code: "CLOCK_EXCEEDS_SHARD_CAPACITY",
			}),
		);
	});

	it("constructs validated extractor configuration", () => {
		const config = createExtractorConfig({
			extractorTypeId: "Build_MinerMk3_C",
			resourceId: "Desc_OreIron_C",
			purity: "pure",
			clockPercent: "250",
		});
		expect(config).toMatchObject({ purity: "pure", resourceId: "Desc_OreIron_C" });
		expect(config.clockPercent.toJSON()).toBe("250.0000");
	});
});
