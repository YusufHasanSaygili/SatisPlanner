import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	FACTORY_PLAN_SCHEMA_VERSION,
	MAX_FACTORY_PLAN_JSON_BYTES,
	parseFactoryPlan,
	PlanMigrationRegistry,
	serializeFactoryPlan,
	type FactoryPlanV3,
	type JsonObject,
	validateFactoryPlan,
} from "./plan-schema";

const fixtureJson = readFileSync(
	new URL("./fixtures/factory-plan-v4.json", import.meta.url),
	"utf8",
);

function validFixture(): Record<string, unknown> {
	const parsed = parseFactoryPlan(fixtureJson);
	if (!parsed.ok) throw new Error("The canonical fixture must migrate to the current schema.");
	return JSON.parse(serializeFactoryPlan(parsed.value)) as Record<string, unknown>;
}

function firstNode(fixture: Record<string, unknown>): Record<string, unknown> {
	const node = (fixture.nodes as Record<string, unknown>[]).find(
		(entry) => entry.kind === "machine",
	);
	if (!node) throw new Error("The canonical fixture must contain a machine node.");
	return node;
}

describe("FactoryPlan v6 schema", () => {
	it("ships a versioned JSON Schema artifact", () => {
		const schema = JSON.parse(
			readFileSync(new URL("../schema/factory-plan-v6.schema.json", import.meta.url), "utf8"),
		) as Record<string, unknown>;
		expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
		expect(schema.$id).toBe("https://satisplanner.dev/schema/factory-plan-v6.schema.json");
		expect(FACTORY_PLAN_SCHEMA_VERSION).toBe(6);
	});

	it("round-trips to byte-stable canonical JSON and preserves unknown fields", () => {
		const parsed = parseFactoryPlan(fixtureJson);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		const first = serializeFactoryPlan(parsed.value);
		const reparsed = parseFactoryPlan(first);
		expect(reparsed.ok).toBe(true);
		if (!reparsed.ok) return;
		const second = serializeFactoryPlan(reparsed.value);
		expect(second).toBe(first);
		const exported = JSON.parse(first) as Record<string, unknown>;
		expect(exported.futureTopLevelField).toEqual({ preserved: true });
		expect(
			(exported.nodes as Record<string, unknown>[]).find((entry) => entry.kind === "machine")
				?.futureNodeField,
		).toEqual({
			preserved: true,
		});
	});

	it("returns field-specific issues for an invalid-state matrix", () => {
		const cases: Array<[string, (fixture: Record<string, unknown>) => void]> = [
			["$.planId", (fixture) => (fixture.planId = "not-a-uuid")],
			["$.updatedAt", (fixture) => (fixture.updatedAt = "yesterday")],
			[
				"$.nodes[1].clockPercent",
				(fixture) => {
					firstNode(fixture).clockPercent = "150.0000";
				},
			],
			[
				"$.nodes[1].somersloopCount",
				(fixture) => {
					firstNode(fixture).somersloopCount = -1;
				},
			],
			[
				"$.viewport.zoom",
				(fixture) => {
					(fixture.viewport as Record<string, unknown>).zoom = 0;
				},
			],
			[
				"$.nodes[1].id",
				(fixture) => {
					firstNode(fixture).id = fixture.planId;
				},
			],
		];
		for (const [expectedPath, mutate] of cases) {
			const fixture = validFixture();
			mutate(fixture);
			const result = parseFactoryPlan(fixture);
			expect(result.ok, expectedPath).toBe(false);
			if (!result.ok)
				expect(
					result.issues.map((entry) => entry.path),
					expectedPath,
				).toContain(expectedPath);
		}
	});

	it("exposes validation without parsing or serialization side effects", () => {
		const fixture = validFixture();
		const before = JSON.stringify(fixture);
		expect(validateFactoryPlan(fixture)).toEqual([]);
		expect(JSON.stringify(fixture)).toBe(before);
		expect(validateFactoryPlan({ ...fixture, name: "" })).toContainEqual(
			expect.objectContaining({ code: "INVALID_PLAN", path: "$.name" }),
		);
	});

	it("rejects malformed, legacy-without-migration and future plans safely", () => {
		expect(parseFactoryPlan("{broken")).toEqual({
			ok: false,
			issues: [{ code: "INVALID_PLAN", path: "$", message: "Plan is not valid JSON." }],
		});
		for (const [version, code] of [
			[0, "MISSING_MIGRATION"],
			[7, "UNSUPPORTED_SCHEMA_VERSION"],
		] as const) {
			const fixture = validFixture();
			fixture.schemaVersion = version;
			const result = parseFactoryPlan(fixture);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.issues[0]?.code).toBe(code);
		}
	});

	it("bounds oversized, deeply nested and cyclic inputs without throwing", () => {
		expect(parseFactoryPlan(" ".repeat(MAX_FACTORY_PLAN_JSON_BYTES + 1))).toMatchObject({
			ok: false,
			issues: [expect.objectContaining({ message: expect.stringContaining("size limit") })],
		});
		let nested: Record<string, unknown> = {};
		for (let depth = 0; depth < 140; depth += 1) nested = { child: nested };
		expect(() => parseFactoryPlan(nested)).not.toThrow();
		expect(parseFactoryPlan(nested).ok).toBe(false);
		const cyclic: Record<string, unknown> = {};
		cyclic.self = cyclic;
		expect(() => parseFactoryPlan(cyclic)).not.toThrow();
		expect(parseFactoryPlan(cyclic).ok).toBe(false);
	});

	it("rejects deterministic malformed fuzz samples without throwing", () => {
		let seed = 0x13_500_800;
		const random = (): number => {
			seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
			return seed;
		};
		for (let sample = 0; sample < 128; sample += 1) {
			const length = 1 + (random() % 1024);
			const text = Array.from({ length }, () => String.fromCharCode(32 + (random() % 95))).join("");
			expect(() => parseFactoryPlan(text), `seed=0x13500800 sample=${sample}`).not.toThrow();
		}
	});

	it("migrates the canonical v1 fixture with deterministic graph defaults", () => {
		const legacy = readFileSync(
			new URL("./fixtures/factory-plan-v1.json", import.meta.url),
			"utf8",
		);
		const result = parseFactoryPlan(legacy);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.schemaVersion).toBe(6);
		expect(result.value.nodes[0]?.position).toEqual({ x: 80, y: 80 });
		expect(result.value.nodes[0]?.ports[0]?.materialId).toBe("unresolved:input-0");
	});

	it("migrates v2 without changing graph identity or position", () => {
		const legacy = readFileSync(
			new URL("./fixtures/factory-plan-v2.json", import.meta.url),
			"utf8",
		);
		const result = parseFactoryPlan(legacy);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.schemaVersion).toBe(6);
		expect(result.value.nodes[0]).toMatchObject({
			id: "00000000-0000-4000-8000-000000000002",
			position: { x: 80, y: 80 },
		});
	});

	it("migrates v3 edges to medium-safe default tiers", () => {
		const legacy = JSON.parse(
			readFileSync(new URL("./fixtures/factory-plan-v3.json", import.meta.url), "utf8"),
		) as Record<string, unknown>;
		legacy.edges = [
			{
				id: "00000000-0000-4000-8000-000000000030",
				fromPortId: "00000000-0000-4000-8000-000000000011",
				toPortId: "00000000-0000-4000-8000-000000000003",
				medium: "conveyor",
				itemOrFluidId: "Desc_OreIron_C",
				requestedRate: { numerator: "0", denominator: "1" },
				actualRate: { numerator: "0", denominator: "1" },
			},
		];
		const result = parseFactoryPlan(legacy);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.edges[0]?.transportTierId).toBe("conveyor-mk1");
	});

	it("round-trips exact resource purity and extraction selection", () => {
		const result = parseFactoryPlan(fixtureJson);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const resource = result.value.nodes.find((node) => node.kind === "resource");
		expect(resource).toMatchObject({
			purity: "pure",
			extractorStrategyId: "miner",
			extractorTierId: "miner-mk3",
			clockPercent: "250.0000",
			powerShardCount: 3,
		});
		expect(parseFactoryPlan(serializeFactoryPlan(result.value))).toEqual(result);
	});

	it("normalizes the legacy v1.0 Iron Ingot recipe identity", () => {
		const fixture = validFixture();
		firstNode(fixture).recipeId = "Recipe_IronIngot_C";
		const parsed = parseFactoryPlan(fixture);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		const machine = parsed.value.nodes.find((node) => node.kind === "machine");
		expect(machine?.kind === "machine" ? machine.recipeId : undefined).toBe("Recipe_IngotIron_C");
	});

	it("persists a custom 1.2 profile and independent locales", () => {
		const fixture = validFixture();
		fixture.gameProfile = {
			...(fixture.gameProfile as Record<string, unknown>),
			id: "satisfactory-1.2-custom",
			kind: "custom",
			recipePartsCostMultiplier: "1.75",
			powerConsumptionMultiplier: "5",
			resourceNodeRandomization: "random",
			resourceNodePurity: "mostly-pure",
			worldSeed: "947221",
		};
		fixture.localization = {
			uiLocale: "tr",
			gameDataLocale: "en-US",
			gameDataFallbackLocale: "en-US",
		};
		const parsed = parseFactoryPlan(fixture);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(parseFactoryPlan(serializeFactoryPlan(parsed.value))).toEqual(parsed);
		expect(parsed.value.localization).toEqual({
			uiLocale: "tr",
			gameDataLocale: "en-US",
			gameDataFallbackLocale: "en-US",
		});
	});

	it("provides a sequential migration registry with fixture-friendly registration", () => {
		const registry = new PlanMigrationRegistry(2).register({
			fromVersion: 1,
			toVersion: 2,
			migrate(plan) {
				return { ...plan, schemaVersion: 2, migratedByTest: true } as JsonObject;
			},
		});
		const legacy = validFixture();
		legacy.schemaVersion = 1;
		const migrated = registry.migrate(legacy as JsonObject);
		expect(migrated.schemaVersion).toBe(2);
		expect(migrated.migratedByTest).toBe(true);
	});

	it("rejects serialization of invalid typed input", () => {
		const fixture = validFixture() as unknown as FactoryPlanV3;
		(fixture as unknown as Record<string, unknown>).name = "";
		expect(() => serializeFactoryPlan(fixture)).toThrowError(
			expect.objectContaining({ code: "INVALID_PLAN", path: "$.name" }),
		);
	});
});
