import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	createPlanExportBundle,
	previewFactoryPlanImport,
	serializePlanExportBundle,
} from "./persistence";
import { parseFactoryPlan, serializeFactoryPlan } from "./plan-schema";

const fixtureV4 = readFileSync(new URL("./fixtures/factory-plan-v4.json", import.meta.url), "utf8");

describe("plan import/export and migration reports", () => {
	it("round-trips a canonical export bundle with a versioned manifest", () => {
		const parsed = parseFactoryPlan(fixtureV4);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		const bundle = createPlanExportBundle(parsed.value, "2026-08-11T20:00:00.000Z");
		expect(bundle.manifest).toMatchObject({
			formatVersion: 1,
			planSchemaVersion: 4,
			gameDataSnapshotId: "fallback-graph-catalog-v2",
		});
		const preview = previewFactoryPlanImport(
			serializePlanExportBundle(bundle),
			"fallback-graph-catalog-v2",
			new Set(["Recipe_TestSink_C"]),
		);
		expect(preview.ok).toBe(true);
		if (!preview.ok) return;
		expect(serializeFactoryPlan(preview.plan)).toBe(serializeFactoryPlan(parsed.value));
		expect(preview.report).toMatchObject({
			sourceSchemaVersion: 4,
			targetSchemaVersion: 4,
			appliedVersions: [],
			snapshotStatus: "match",
			unresolvedRecipeIds: [],
		});
	});

	it("migrates every legacy version through the sequential registry without mutating input", () => {
		for (const version of [1, 2, 3] as const) {
			const original = readFileSync(
				new URL(`./fixtures/factory-plan-v${version}.json`, import.meta.url),
				"utf8",
			);
			const preview = previewFactoryPlanImport(original, "different-snapshot");
			expect(preview.ok, `v${version}`).toBe(true);
			if (!preview.ok) continue;
			expect(preview.plan.schemaVersion).toBe(4);
			expect(preview.report.appliedVersions).toHaveLength(4 - version);
			expect(preview.report.snapshotStatus).toBe("mismatch");
			expect(preview.originalText).toBe(original);
		}
	});

	it("reports removed recipes as unresolved and rejects future schemas safely", () => {
		const removed = previewFactoryPlanImport(fixtureV4, "fallback-graph-catalog-v2", new Set());
		expect(removed.ok).toBe(true);
		if (removed.ok) expect(removed.report.unresolvedRecipeIds).toEqual([]);

		const knownOnly = previewFactoryPlanImport(
			fixtureV4,
			"fallback-graph-catalog-v2",
			new Set(["Recipe_Other_C"]),
		);
		expect(knownOnly.ok).toBe(true);
		if (knownOnly.ok) expect(knownOnly.report.unresolvedRecipeIds).toEqual(["Recipe_TestSink_C"]);

		const future = JSON.parse(fixtureV4) as Record<string, unknown>;
		future.schemaVersion = 99;
		const rejected = previewFactoryPlanImport(JSON.stringify(future), "fallback-graph-catalog-v2");
		expect(rejected.ok).toBe(false);
		if (!rejected.ok) expect(rejected.issues[0]?.message).toContain("newer than supported");
	});
});
