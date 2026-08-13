import { readFileSync } from "node:fs";
import { parseFactoryPlan } from "@satisplanner/domain";
import { describe, expect, it } from "vitest";
import { previewUpstreamFcsImport } from "./upstream-fcs";

const v7Fixture = readFileSync(
	new URL("../../../tests/fixtures/upstream-fcs/simple-chain-v7.fcs", import.meta.url),
	"utf8",
);

describe("upstream .fcs import preview", () => {
	it("expands the representative v7 aggregate chain into physical instances and links", () => {
		const preview = previewUpstreamFcsImport(v7Fixture, "expand-rounded-up");
		expect(preview.ok).toBe(true);
		if (!preview.ok) return;
		expect(preview.report).toMatchObject({
			sourceVersion: 7,
			targetVersion: 7,
			convertedCraftNodes: 2,
			generatedPhysicalInstances: 4,
			convertedLinks: 2,
			droppedLinks: 0,
			unknownRecipes: [],
		});
		expect(preview.report.expansions.map((entry) => entry.physicalInstanceCount)).toEqual([2, 2]);
		expect(parseFactoryPlan(preview.plan).ok).toBe(true);
		expect(preview.originalText).toBe(v7Fixture);
	});

	it("migrates v1 through v6 one version at a time without touching the source text", () => {
		const base = JSON.parse(v7Fixture) as Record<string, unknown>;
		for (let version = 1; version <= 6; version += 1) {
			const fixture = structuredClone(base);
			fixture.save_version = version;
			const original = JSON.stringify(fixture);
			const preview = previewUpstreamFcsImport(original);
			expect(preview.ok, `v${version}`).toBe(true);
			if (!preview.ok) continue;
			expect(preview.report.migrationSteps).toHaveLength(7 - version);
			expect(preview.report.migrationSteps[0]).toEqual({
				fromVersion: version,
				toVersion: version + 1,
			});
			expect(preview.originalText).toBe(original);
		}
	});

	it("reports unknown recipes, unsupported node kinds and dropped links", () => {
		const fixture = JSON.parse(v7Fixture) as {
			nodes: Array<Record<string, unknown>>;
			links: Array<Record<string, unknown>>;
		};
		if (fixture.nodes[0]) fixture.nodes[0].recipe = "Removed Alternate Recipe";
		fixture.nodes.push({ kind: 5, pos: { x: 0, y: 0 }, ins: [] });
		fixture.links.push({ start: { node: 2, pin: 0 }, end: { node: 1, pin: 0 } });
		const preview = previewUpstreamFcsImport(JSON.stringify(fixture));
		expect(preview.ok).toBe(true);
		if (!preview.ok) return;
		expect(preview.report.unknownRecipes).toEqual(["Removed Alternate Recipe"]);
		expect(preview.report.unsupportedNodeKinds).toEqual([5]);
		expect(preview.report.droppedLinks).toBeGreaterThan(0);
		expect(
			preview.plan.nodes.some(
				(node) => node.kind === "machine" && node.recipeId.startsWith("unresolved:"),
			),
		).toBe(true);
	});

	it("supports a cancellable single-aggregate preview and rejects future files", () => {
		const preview = previewUpstreamFcsImport(v7Fixture, "single-aggregate");
		expect(preview.ok).toBe(true);
		if (preview.ok) {
			expect(preview.report.generatedPhysicalInstances).toBe(2);
			expect(
				preview.plan.nodes.every(
					(node) => node.kind === "junction" || node.clockPercent === "200.0000",
				),
			).toBe(true);
		}
		const future = JSON.parse(v7Fixture) as Record<string, unknown>;
		future.save_version = 8;
		const rejected = previewUpstreamFcsImport(JSON.stringify(future));
		expect(rejected).toMatchObject({
			ok: false,
			message: "Future .fcs version 8 is not supported.",
		});
	});
});
