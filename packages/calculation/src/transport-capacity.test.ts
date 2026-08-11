import {
	type FactoryPlanV3,
	type MachinePlanNodeV3,
	type PlanPortV3,
	Rational,
	type TransportEdgeV3,
} from "@satisplanner/domain";
import { describe, expect, it } from "vitest";
import { calculateFactoryPlan, IncrementalFlowEngine } from "./flow-engine";
import { FormulaStrategyRegistry, type ProductionFormulaDescriptor } from "./formula-engine";

const rate = (value: string) => Rational.parse(value).toJSON();

function port(id: string, direction: "input" | "output"): PlanPortV3 {
	return { id, key: `${direction}-0`, direction, materialForm: "solid", materialId: "Desc_Coal_C" };
}

function machine(
	id: string,
	buildingId: string,
	recipeId: string,
	ports: readonly PlanPortV3[],
): MachinePlanNodeV3 {
	return {
		kind: "machine",
		id,
		buildingId,
		recipeId,
		displayName: id,
		position: { x: 0, y: 0 },
		clockPercent: "100.0000",
		powerShardCount: 0,
		somersloopCount: 0,
		standby: false,
		ports,
	};
}

function edge(
	id: string,
	fromPortId: string,
	toPortId: string,
	transportTierId: string,
): TransportEdgeV3 {
	return {
		id,
		fromPortId,
		toPortId,
		medium: "conveyor",
		transportTierId,
		itemOrFluidId: "Desc_Coal_C",
		requestedRate: rate("0"),
		actualRate: rate("0"),
	};
}

function fixture(
	tierIds: readonly string[],
	sourceRate = "1200",
	targetRate = "1200",
): { plan: FactoryPlanV3; registry: FormulaStrategyRegistry } {
	const descriptors: ProductionFormulaDescriptor[] = [
		{
			id: "coal-source",
			buildingId: "Build_CoalSource_C",
			recipeId: "Recipe_CoalSource_C",
			displayName: "Coal source",
			basePowerMW: 0,
			powerExponent: 1,
			inputs: [],
			outputs: [
				{ portKey: "output-0", materialId: "Desc_Coal_C", ratePerMinute: rate(sourceRate) },
			],
		},
		{
			id: "coal-sink",
			buildingId: "Build_CoalSink_C",
			recipeId: "Recipe_CoalSink_C",
			displayName: "Coal sink",
			basePowerMW: 1,
			powerExponent: 1,
			inputs: [{ portKey: "input-0", materialId: "Desc_Coal_C", ratePerMinute: rate(targetRate) }],
			outputs: [],
		},
	];
	const registry = new FormulaStrategyRegistry();
	for (const descriptor of descriptors) registry.register(descriptor);
	const source = machine("source", "Build_CoalSource_C", "Recipe_CoalSource_C", [
		port("source-out", "output"),
	]);
	const sink = machine("sink", "Build_CoalSink_C", "Recipe_CoalSink_C", [port("sink-in", "input")]);
	return {
		registry,
		plan: {
			schemaVersion: 4,
			planId: "capacity-plan",
			name: "Capacity fixture",
			createdAt: "2026-08-11T00:00:00.000Z",
			updatedAt: "2026-08-11T00:00:00.000Z",
			gameDataSnapshotId: "test",
			gameProfile: { id: "satisfactory", version: "1.2" },
			nodes: [source, sink],
			edges: tierIds.map((tierId, index) => edge(`edge-${index}`, "source-out", "sink-in", tierId)),
			viewport: { x: 0, y: 0, zoom: 1 },
			userMetadata: {},
		},
	};
}

describe("capacity-aware transport solver", () => {
	it("caps 1200/min at Mk.5 to 780 actual and 420 lost, then clears at Mk.6", () => {
		const mk5 = fixture(["conveyor-mk5"]);
		const constrained = calculateFactoryPlan(mk5.plan, { formulaRegistry: mk5.registry });
		expect(constrained.edges[0]).toMatchObject({
			transportTierId: "conveyor-mk5",
			actualRate: rate("780"),
			lostRate: rate("420"),
			deficitReasons: ["transport-capacity"],
			recommendedTierId: "conveyor-mk6",
			bottleneckRank: 1,
		});
		expect(
			Rational.parse(
				constrained.nodes.find((node) => node.nodeId === "sink")?.efficiency ?? "0",
			).toString(),
		).toBe("13/20");
		expect(constrained.diagnostics).toContainEqual(
			expect.objectContaining({ code: "TRANSPORT_BOTTLENECK", edgeId: "edge-0" }),
		);

		const mk5Edge = mk5.plan.edges[0];
		if (!mk5Edge) throw new Error("Expected the Mk.5 edge fixture.");
		const mk6Plan = {
			...mk5.plan,
			edges: [{ ...mk5Edge, transportTierId: "conveyor-mk6" }],
		};
		const unconstrained = calculateFactoryPlan(mk6Plan, { formulaRegistry: mk5.registry });
		expect(unconstrained.edges[0]).toMatchObject({
			actualRate: rate("1200"),
			lostRate: rate("0"),
			bottleneckRank: null,
		});
		expect(unconstrained.diagnostics.some((entry) => entry.code === "TRANSPORT_BOTTLENECK")).toBe(
			false,
		);
	});

	it("keeps supply-limited, demand-limited and parallel capacity causes explicit", () => {
		const supply = fixture(["conveyor-mk6"], "500", "1200");
		const supplyResult = calculateFactoryPlan(supply.plan, { formulaRegistry: supply.registry });
		expect(supplyResult.edges[0]).toMatchObject({
			actualRate: rate("500"),
			lostRate: rate("700"),
			deficitReasons: ["upstream-supply"],
		});

		const demand = fixture(["conveyor-mk1"], "1200", "50");
		const demandResult = calculateFactoryPlan(demand.plan, { formulaRegistry: demand.registry });
		expect(demandResult.edges[0]).toMatchObject({
			requiredRate: rate("50"),
			actualRate: rate("50"),
			lostRate: rate("0"),
			deficitReasons: [],
		});

		const parallel = fixture(["conveyor-mk4", "conveyor-mk4"]);
		const parallelResult = calculateFactoryPlan(parallel.plan, {
			formulaRegistry: parallel.registry,
		});
		expect(
			parallelResult.edges.map((entry) => Rational.parse(entry.actualRate).toString()),
		).toEqual(["480", "480"]);
		expect(parallelResult.edges.map((entry) => Rational.parse(entry.lostRate).toString())).toEqual([
			"120",
			"120",
		]);
		expect(parallelResult.edges.map((entry) => entry.bottleneckRank)).toEqual([1, 2]);
	});

	it("incrementally recomputes the connected component when only an edge tier changes", () => {
		const setup = fixture(["conveyor-mk5"]);
		const engine = new IncrementalFlowEngine({ formulaRegistry: setup.registry });
		engine.compute(setup.plan);
		const constrainedEdge = setup.plan.edges[0];
		if (!constrainedEdge) throw new Error("Expected the constrained edge fixture.");
		const upgraded = {
			...setup.plan,
			edges: [{ ...constrainedEdge, transportTierId: "conveyor-mk6" }],
		};
		const result = engine.compute(upgraded, [], ["edge-0"]);
		expect(result.instrumentation.recomputedNodeIds).toEqual(["sink", "source"]);
		expect(result.edges[0]?.actualRate).toEqual(rate("1200"));
	});
});
