import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	FACTORY_PLAN_SCHEMA_VERSION,
	parseFactoryPlan,
	PlanMigrationRegistry,
	serializeFactoryPlan,
	type FactoryPlanV1,
	type JsonObject,
	validateFactoryPlan,
} from "./plan-schema";

const fixtureJson = readFileSync(
	new URL("./fixtures/factory-plan-v1.json", import.meta.url),
	"utf8",
);

function validFixture(): Record<string, unknown> {
	return JSON.parse(fixtureJson) as Record<string, unknown>;
}

function firstNode(fixture: Record<string, unknown>): Record<string, unknown> {
	const node = (fixture.nodes as Record<string, unknown>[])[0];
	if (!node) throw new Error("The canonical fixture must contain a machine node.");
	return node;
}

describe("FactoryPlan v1 schema", () => {
	it("ships a versioned JSON Schema artifact", () => {
		const schema = JSON.parse(
			readFileSync(new URL("../schema/factory-plan-v1.schema.json", import.meta.url), "utf8"),
		) as Record<string, unknown>;
		expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
		expect(schema.$id).toBe("https://satisplanner.dev/schema/factory-plan-v1.schema.json");
		expect(FACTORY_PLAN_SCHEMA_VERSION).toBe(1);
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
		expect((exported.nodes as Record<string, unknown>[])[0]?.futureNodeField).toEqual({
			preserved: true,
		});
	});

	it("returns field-specific issues for an invalid-state matrix", () => {
		const cases: Array<[string, (fixture: Record<string, unknown>) => void]> = [
			["$.planId", (fixture) => (fixture.planId = "not-a-uuid")],
			["$.updatedAt", (fixture) => (fixture.updatedAt = "yesterday")],
			[
				"$.nodes[0].clockPercent",
				(fixture) => {
					firstNode(fixture).clockPercent = "150.0000";
				},
			],
			[
				"$.nodes[0].somersloopCount",
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
				"$.nodes[0].id",
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
			[2, "UNSUPPORTED_SCHEMA_VERSION"],
		] as const) {
			const fixture = validFixture();
			fixture.schemaVersion = version;
			const result = parseFactoryPlan(fixture);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.issues[0]?.code).toBe(code);
		}
	});

	it("provides a sequential migration registry with fixture-friendly registration", () => {
		const registry = new PlanMigrationRegistry(2).register({
			fromVersion: 1,
			toVersion: 2,
			migrate(plan) {
				return { ...plan, schemaVersion: 2, migratedByTest: true } as JsonObject;
			},
		});
		const migrated = registry.migrate(validFixture() as JsonObject);
		expect(migrated.schemaVersion).toBe(2);
		expect(migrated.migratedByTest).toBe(true);
	});

	it("rejects serialization of invalid typed input", () => {
		const fixture = validFixture() as unknown as FactoryPlanV1;
		(fixture as unknown as Record<string, unknown>).name = "";
		expect(() => serializeFactoryPlan(fixture)).toThrowError(
			expect.objectContaining({ code: "INVALID_PLAN", path: "$.name" }),
		);
	});
});
