import { readFileSync } from "node:fs";
import { parseFactoryPlan, Rational, serializeFactoryPlan } from "@satisplanner/domain";
import { describe, expect, it } from "vitest";
import { calculateFactoryPlan } from "./flow-engine";

function loadExample(name: string) {
	const source = readFileSync(new URL(`../../../examples/${name}`, import.meta.url), "utf8");
	const parsed = parseFactoryPlan(source);
	if (!parsed.ok) throw new Error(`${name}: ${JSON.stringify(parsed.issues)}`);
	const canonical = serializeFactoryPlan(parsed.value);
	const canonicalRoundTrip = parseFactoryPlan(canonical);
	if (!canonicalRoundTrip.ok) throw new Error(`${name}: canonical serialization failed`);
	expect(serializeFactoryPlan(canonicalRoundTrip.value)).toBe(canonical);
	return { plan: parsed.value, result: calculateFactoryPlan(parsed.value) };
}

function decimal(value: { readonly numerator: string; readonly denominator: string }): string {
	return Rational.parse(value).toDecimal(4);
}

describe("SatisPlanner v1.0.0 canonical examples", () => {
	it("keeps the Coal Mk.5 1200→780 bottleneck golden", () => {
		const { plan, result } = loadExample("coal-mk5-bottleneck.satisplan.json");
		expect(plan.gameDataSnapshotId).toBe("fallback-graph-catalog-v3");
		expect(plan.gameProfile.version).toBe("1.2");
		expect(result.resolved).toBe(true);
		expect(result.edges[0]).toMatchObject({
			transportTierId: "conveyor-mk5",
			recommendedTierId: "conveyor-mk6",
		});
		expect(result.edges[0]?.deficitReasons).toContain("transport-capacity");
		expect(decimal(result.edges[0]?.requestedRate ?? { numerator: "0", denominator: "1" })).toBe(
			"1200",
		);
		expect(decimal(result.edges[0]?.actualRate ?? { numerator: "0", denominator: "1" })).toBe(
			"780",
		);
		expect(decimal(result.edges[0]?.lostRate ?? { numerator: "0", denominator: "1" })).toBe("420");
	});

	it("keeps Constructor and Assembler settings and outputs instance-local", () => {
		const { plan, result } = loadExample("independent-machines.satisplan.json");
		expect(
			plan.nodes.map((node) =>
				node.kind === "machine"
					? [node.recipeId, node.clockPercent, node.powerShardCount, node.somersloopCount]
					: [],
			),
		).toEqual([
			["Recipe_IronPlate_C", "100.0000", 0, 0],
			["Recipe_IronRod_C", "200.0000", 2, 1],
			["Recipe_IronPlateReinforced_C", "150.0000", 1, 2],
		]);
		const outputs = result.nodes.map((node) =>
			decimal(node.potentialOutputs[0]?.ratePerMinute ?? { numerator: "0", denominator: "1" }),
		);
		expect(outputs).toEqual(["20", "60", "15"]);
	});

	it("keeps the Pipeline Mk.1 600→300 fluid bottleneck golden", () => {
		const { result } = loadExample("fluid-pipeline-capacity.satisplan.json");
		expect(result.resolved).toBe(true);
		expect(result.edges[0]).toMatchObject({
			medium: "pipeline",
			transportTierId: "pipeline-mk1",
			recommendedTierId: "pipeline-mk2",
		});
		expect(result.edges[0]?.deficitReasons).toContain("transport-capacity");
		expect(decimal(result.edges[0]?.requestedRate ?? { numerator: "0", denominator: "1" })).toBe(
			"600",
		);
		expect(decimal(result.edges[0]?.actualRate ?? { numerator: "0", denominator: "1" })).toBe(
			"300",
		);
		expect(decimal(result.edges[0]?.lostRate ?? { numerator: "0", denominator: "1" })).toBe("300");
	});
});
