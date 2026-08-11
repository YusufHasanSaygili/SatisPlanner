import {
	type FactoryPlanV3,
	type MachinePlanNodeV3,
	type PlanNodeV3,
	type PlanPortV3,
	Rational,
	type ResourcePlanNodeV3,
	type TransportEdgeV3,
} from "@satisplanner/domain";
import { describe, expect, it } from "vitest";
import { calculateFactoryPlan, type FactoryFlowResult, IncrementalFlowEngine } from "./flow-engine";
import { FormulaStrategyRegistry, type ProductionFormulaDescriptor } from "./formula-engine";

function port(
	id: string,
	key: string,
	direction: "input" | "output",
	materialId: string,
): PlanPortV3 {
	return { id, key, direction, materialForm: "solid", materialId };
}

function resource(
	id: string,
	outputPortId: string,
	purity: ResourcePlanNodeV3["purity"] = "normal",
): ResourcePlanNodeV3 {
	return {
		kind: "resource",
		id,
		resourceId: "Desc_OreIron_C",
		displayName: `Iron ${id}`,
		purity,
		extractorStrategyId: "miner",
		extractorTierId: "miner-mk1",
		clockPercent: "100.0000",
		powerShardCount: 0,
		position: { x: 0, y: 0 },
		ports: [port(outputPortId, "output-0", "output", "Desc_OreIron_C")],
	};
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

function connection(
	id: string,
	fromPortId: string,
	toPortId: string,
	materialId: string,
): TransportEdgeV3 {
	return {
		id,
		fromPortId,
		toPortId,
		medium: "conveyor",
		itemOrFluidId: materialId,
		requestedRate: Rational.parse("0").toJSON(),
		actualRate: Rational.parse("0").toJSON(),
	};
}

function plan(nodes: readonly PlanNodeV3[], edges: readonly TransportEdgeV3[]): FactoryPlanV3 {
	return {
		schemaVersion: 3,
		planId: "flow-test",
		name: "Flow test",
		createdAt: "2026-08-11T00:00:00.000Z",
		updatedAt: "2026-08-11T00:00:00.000Z",
		gameDataSnapshotId: "flow-fixture-v1",
		gameProfile: { id: "satisfactory", version: "1.2" },
		nodes,
		edges,
		viewport: { x: 0, y: 0, zoom: 1 },
		userMetadata: {},
	};
}

function resultRate(
	result: FactoryFlowResult,
	kind: "node-output" | "node-input" | "edge",
	id: string,
): Rational {
	if (kind === "edge") {
		return Rational.parse(result.edges.find((edge) => edge.edgeId === id)?.actualRate ?? "0");
	}
	const node = result.nodes.find((entry) =>
		(kind === "node-output" ? entry.actualOutputs : entry.actualInputs).some(
			(rate) => rate.portId === id,
		),
	);
	const rates = kind === "node-output" ? node?.actualOutputs : node?.actualInputs;
	return Rational.parse(rates?.find((rate) => rate.portId === id)?.ratePerMinute ?? "0");
}

function realIronChain(prefix: string): {
	readonly nodes: readonly PlanNodeV3[];
	readonly edges: readonly TransportEdgeV3[];
} {
	const source = resource(`${prefix}-resource`, `${prefix}-ore-out`);
	const smelter = machine(`${prefix}-smelter`, "Build_SmelterMk1_C", "Recipe_IronIngot_C", [
		port(`${prefix}-smelter-in`, "input-0", "input", "Desc_OreIron_C"),
		port(`${prefix}-smelter-out`, "output-0", "output", "Desc_IronIngot_C"),
	]);
	const constructorMachine = machine(
		`${prefix}-constructor`,
		"Build_ConstructorMk1_C",
		"Recipe_IronPlate_C",
		[
			port(`${prefix}-constructor-in`, "input-0", "input", "Desc_IronIngot_C"),
			port(`${prefix}-constructor-out`, "output-0", "output", "Desc_IronPlate_C"),
		],
	);
	return {
		nodes: [source, smelter, constructorMachine],
		edges: [
			connection(
				`${prefix}-ore-edge`,
				source.ports[0]?.id ?? "",
				smelter.ports[0]?.id ?? "",
				"Desc_OreIron_C",
			),
			connection(
				`${prefix}-ingot-edge`,
				smelter.ports[1]?.id ?? "",
				constructorMachine.ports[0]?.id ?? "",
				"Desc_IronIngot_C",
			),
		],
	};
}

describe("deterministic material flow", () => {
	it("propagates a known Miner -> Smelter -> Constructor chain", () => {
		const chain = realIronChain("known");
		const result = calculateFactoryPlan(plan(chain.nodes, chain.edges));
		expect(result.resolved).toBe(true);
		expect(resultRate(result, "edge", "known-ore-edge").toString()).toBe("30");
		expect(resultRate(result, "edge", "known-ingot-edge").toString()).toBe("30");
		expect(resultRate(result, "node-output", "known-constructor-out").toString()).toBe("20");
		expect(
			Rational.parse(
				result.nodes.find((node) => node.nodeId === "known-constructor")?.efficiency ?? "0",
			).toString(),
		).toBe("1");
	});

	it("returns explicit zero actual rates for disconnected required ports", () => {
		const disconnected = machine("disconnected", "Build_ConstructorMk1_C", "Recipe_IronPlate_C", [
			port("disconnected-in", "input-0", "input", "Desc_IronIngot_C"),
			port("disconnected-out", "output-0", "output", "Desc_IronPlate_C"),
		]);
		const result = calculateFactoryPlan(plan([disconnected], []));
		const node = result.nodes[0];
		expect(node?.actualInputs).toEqual([
			expect.objectContaining({
				portId: "disconnected-in",
				ratePerMinute: { numerator: "0", denominator: "1" },
			}),
		]);
		expect(node?.efficiency).toEqual({ numerator: "0", denominator: "1" });
	});

	it("conserves supply through equal, manual and ratio split policies", () => {
		const source = resource("source", "source-out");
		const left = machine("left", "Build_SmelterMk1_C", "Recipe_IronIngot_C", [
			port("left-in", "input-0", "input", "Desc_OreIron_C"),
			port("left-out", "output-0", "output", "Desc_IronIngot_C"),
		]);
		const right = machine("right", "Build_SmelterMk1_C", "Recipe_IronIngot_C", [
			port("right-in", "input-0", "input", "Desc_OreIron_C"),
			port("right-out", "output-0", "output", "Desc_IronIngot_C"),
		]);
		const edges = [
			connection("left-edge", "source-out", "left-in", "Desc_OreIron_C"),
			connection("right-edge", "source-out", "right-in", "Desc_OreIron_C"),
		];
		const equal = calculateFactoryPlan(plan([source, left, right], edges));
		expect(equal.edges.map((edge) => Rational.parse(edge.actualRate).toString())).toEqual([
			"30",
			"30",
		]);

		const manual = calculateFactoryPlan(plan([source, left, right], edges), {
			allocationByOutputPortId: {
				"source-out": {
					mode: "manual",
					ratesByEdgeId: {
						"left-edge": Rational.parse("10").toJSON(),
						"right-edge": Rational.parse("30").toJSON(),
					},
				},
			},
		});
		expect(manual.edges.map((edge) => Rational.parse(edge.actualRate).toString())).toEqual([
			"10",
			"30",
		]);

		const impureSource = resource("source", "source-out", "impure");
		const ratio = calculateFactoryPlan(plan([impureSource, left, right], edges), {
			allocationByOutputPortId: {
				"source-out": {
					mode: "ratio",
					weightsByEdgeId: {
						"left-edge": Rational.parse("1").toJSON(),
						"right-edge": Rational.parse("2").toJSON(),
					},
				},
			},
		});
		expect(ratio.edges.map((edge) => Rational.parse(edge.actualRate).toString())).toEqual([
			"10",
			"20",
		]);
		for (const result of [equal, manual, ratio]) {
			expect(
				result.edges
					.reduce((total, edge) => total.add(Rational.parse(edge.actualRate)), Rational.parse("0"))
					.compare(resultRate(result, "node-output", "source-out")),
			).toBeLessThanOrEqual(0);
			expect(
				result.diagnostics.some((diagnostic) => diagnostic.code === "CONSERVATION_VIOLATION"),
			).toBe(false);
		}
	});

	it("caps merger input demand without creating material", () => {
		const left = resource("left-source", "left-source-out");
		const right = resource("right-source", "right-source-out");
		const target = machine("target", "Build_SmelterMk1_C", "Recipe_IronIngot_C", [
			port("target-in", "input-0", "input", "Desc_OreIron_C"),
			port("target-out", "output-0", "output", "Desc_IronIngot_C"),
		]);
		const result = calculateFactoryPlan(
			plan(
				[right, target, left],
				[
					connection("right-merge", "right-source-out", "target-in", "Desc_OreIron_C"),
					connection("left-merge", "left-source-out", "target-in", "Desc_OreIron_C"),
				].reverse(),
			),
		);
		expect(
			result.edges
				.reduce((total, edge) => total.add(Rational.parse(edge.actualRate)), Rational.parse("0"))
				.toString(),
		).toBe("30");
		expect(resultRate(result, "node-input", "target-in").toString()).toBe("30");
		expect(resultRate(result, "node-output", "target-out").toString()).toBe("30");
	});

	it("is invariant to node and edge input order", () => {
		const chain = realIronChain("stable");
		const forward = calculateFactoryPlan(plan(chain.nodes, chain.edges));
		const reversed = calculateFactoryPlan(
			plan([...chain.nodes].reverse(), [...chain.edges].reverse()),
		);
		expect(reversed.nodes).toEqual(forward.nodes);
		expect(reversed.edges).toEqual(forward.edges);
		expect(reversed.diagnostics).toEqual(forward.diagnostics);
	});

	it("preserves conservation across randomized DAG fan-outs", () => {
		let seed = 0x5a71_5008;
		const random = (): number => {
			seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
			return seed / 0x1_0000_0000;
		};
		for (let sample = 0; sample < 40; sample += 1) {
			const source = resource(
				`resource-${sample}`,
				`source-${sample}`,
				random() < 0.5 ? "impure" : "normal",
			);
			const count = 2 + Math.floor(random() * 5);
			const machines = Array.from({ length: count }, (_, index) =>
				machine(`machine-${sample}-${index}`, "Build_SmelterMk1_C", "Recipe_IronIngot_C", [
					port(`input-${sample}-${index}`, "input-0", "input", "Desc_OreIron_C"),
					port(`output-${sample}-${index}`, "output-0", "output", "Desc_IronIngot_C"),
				]),
			);
			const edges = machines.map((_, index) =>
				connection(
					`edge-${sample}-${index}`,
					`source-${sample}`,
					`input-${sample}-${index}`,
					"Desc_OreIron_C",
				),
			);
			const result = calculateFactoryPlan(
				plan(
					[source, ...machines].sort(() => random() - 0.5),
					edges,
				),
			);
			const total = result.edges.reduce(
				(accumulator, edge) => accumulator.add(Rational.parse(edge.actualRate)),
				Rational.parse("0"),
			);
			expect(
				total.compare(resultRate(result, "node-output", `source-${sample}`)),
			).toBeLessThanOrEqual(0);
		}
	});
});

function customRate(portKey: string, materialId: string, value: string) {
	return { portKey, materialId, ratePerMinute: Rational.parse(value).toJSON() };
}

function customRegistry(
	descriptors: readonly ProductionFormulaDescriptor[],
): FormulaStrategyRegistry {
	return descriptors.reduce(
		(registry, descriptor) => registry.register(descriptor),
		new FormulaStrategyRegistry(),
	);
}

describe("loops and incremental compute", () => {
	it("converges a simple recycle loop and emits stable cycle provenance", () => {
		const registry = customRegistry([
			{
				id: "seed",
				buildingId: "Build_Seed_C",
				recipeId: "Recipe_Seed_C",
				displayName: "Seed",
				basePowerMW: 0,
				powerExponent: 1,
				inputs: [],
				outputs: [customRate("output-0", "X", "1")],
			},
			{
				id: "recycle-a",
				buildingId: "Build_A_C",
				recipeId: "Recipe_A_C",
				displayName: "Recycle A",
				basePowerMW: 1,
				powerExponent: 1,
				inputs: [customRate("input-0", "X", "2")],
				outputs: [customRate("output-0", "Y", "1")],
			},
			{
				id: "recycle-b",
				buildingId: "Build_B_C",
				recipeId: "Recipe_B_C",
				displayName: "Recycle B",
				basePowerMW: 1,
				powerExponent: 1,
				inputs: [customRate("input-0", "Y", "1")],
				outputs: [customRate("output-0", "X", "1")],
			},
		]);
		const seed = machine("seed", "Build_Seed_C", "Recipe_Seed_C", [
			port("seed-out", "output-0", "output", "X"),
		]);
		const a = machine("a", "Build_A_C", "Recipe_A_C", [
			port("a-in", "input-0", "input", "X"),
			port("a-out", "output-0", "output", "Y"),
		]);
		const b = machine("b", "Build_B_C", "Recipe_B_C", [
			port("b-in", "input-0", "input", "Y"),
			port("b-out", "output-0", "output", "X"),
		]);
		const recyclePlan = plan(
			[seed, a, b],
			[
				connection("seed-a", "seed-out", "a-in", "X"),
				connection("a-b", "a-out", "b-in", "Y"),
				connection("b-a", "b-out", "a-in", "X"),
			],
		);
		const result = calculateFactoryPlan(recyclePlan, { formulaRegistry: registry });
		expect(result.resolved).toBe(true);
		expect(result.diagnostics).toContainEqual(
			expect.objectContaining({ code: "CYCLE_CONVERGED", nodeIds: ["a", "b"] }),
		);
		expect(Number(resultRate(result, "node-output", "b-out").toDecimal(8))).toBeCloseTo(1, 7);

		const bounded = calculateFactoryPlan(recyclePlan, {
			formulaRegistry: registry,
			maxIterations: 4,
		});
		expect(bounded.resolved).toBe(false);
		expect(bounded.diagnostics).toContainEqual(
			expect.objectContaining({ code: "NON_CONVERGENT_LOOP", nodeIds: ["a", "b"] }),
		);
		expect(
			bounded.nodes
				.filter((node) => ["a", "b"].includes(node.nodeId))
				.every((node) => node.status === "unresolved"),
		).toBe(true);
	});

	it("recomputes only the connected component touched by an edit", () => {
		const left = realIronChain("left");
		const right = realIronChain("right");
		const initial = plan([...left.nodes, ...right.nodes], [...left.edges, ...right.edges]);
		const engine = new IncrementalFlowEngine();
		expect(engine.compute(initial).instrumentation.recomputedNodeIds).toHaveLength(6);
		const updated = {
			...initial,
			nodes: initial.nodes.map((node) =>
				node.id === "left-resource" && node.kind === "resource"
					? { ...node, purity: "impure" as const }
					: node,
			),
		};
		const result = engine.compute(updated, ["left-resource"]);
		expect(result.instrumentation.recomputedNodeIds).toEqual([
			"left-constructor",
			"left-resource",
			"left-smelter",
		]);
		expect(result.instrumentation.recomputedNodeIds).not.toContain("right-resource");
		expect(resultRate(result, "edge", "right-ore-edge").toString()).toBe("30");
		expect(engine.compute(updated, []).instrumentation).toEqual({
			iterationCount: 0,
			recomputedNodeIds: [],
		});
	});

	it("solves a 50-node deterministic chain as a benchmark smoke", () => {
		const registry = customRegistry([
			{
				id: "source",
				buildingId: "Build_Source_C",
				recipeId: "Recipe_Source_C",
				displayName: "Source",
				basePowerMW: 0,
				powerExponent: 1,
				inputs: [],
				outputs: [customRate("output-0", "X", "60")],
			},
			{
				id: "pass",
				buildingId: "Build_Pass_C",
				recipeId: "Recipe_Pass_C",
				displayName: "Pass",
				basePowerMW: 1,
				powerExponent: 1,
				inputs: [customRate("input-0", "X", "60")],
				outputs: [customRate("output-0", "X", "60")],
			},
		]);
		const nodes: MachinePlanNodeV3[] = [
			machine("node-000", "Build_Source_C", "Recipe_Source_C", [
				port("output-000", "output-0", "output", "X"),
			]),
		];
		const edges: TransportEdgeV3[] = [];
		for (let index = 1; index < 50; index += 1) {
			const id = index.toString().padStart(3, "0");
			const previous = (index - 1).toString().padStart(3, "0");
			nodes.push(
				machine(`node-${id}`, "Build_Pass_C", "Recipe_Pass_C", [
					port(`input-${id}`, "input-0", "input", "X"),
					port(`output-${id}`, "output-0", "output", "X"),
				]),
			);
			edges.push(connection(`edge-${id}`, `output-${previous}`, `input-${id}`, "X"));
		}
		const started = performance.now();
		const result = calculateFactoryPlan(plan(nodes, edges), { formulaRegistry: registry });
		const elapsed = performance.now() - started;
		expect(result.resolved).toBe(true);
		expect(resultRate(result, "node-output", "output-049").toString()).toBe("60");
		expect(result.instrumentation.iterationCount).toBeLessThanOrEqual(52);
		expect(elapsed).toBeLessThan(2_000);
	});
});
