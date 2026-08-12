import {
	DEFAULT_SATISFACTORY_12_PROFILE,
	type FactoryPlanV3,
	type MachinePlanNodeV3,
	Rational,
	type ResourcePlanNodeV3,
	type TransportEdgeV3,
} from "@satisplanner/domain";
import { mkdirSync, writeFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { calculateFactoryPlan, IncrementalFlowEngine } from "./flow-engine";

const counts = [100, 500, 1000] as const;
const metrics: Array<Record<string, number | string>> = [];

afterAll(() => {
	const artifacts = new URL("../../../artifacts/", import.meta.url);
	mkdirSync(artifacts, { recursive: true });
	writeFileSync(
		new URL("calculation-performance.json", artifacts),
		`${JSON.stringify(metrics, null, 2)}\n`,
	);
});

function syntheticPlan(nodeCount: number): FactoryPlanV3 {
	const nodes: Array<ResourcePlanNodeV3 | MachinePlanNodeV3> = [];
	const edges: TransportEdgeV3[] = [];
	for (let index = 0; index < nodeCount / 2; index += 1) {
		const suffix = index.toString().padStart(4, "0");
		const sourcePort = `source-port-${suffix}`;
		const machineInput = `machine-input-${suffix}`;
		nodes.push({
			kind: "resource",
			id: `source-${suffix}`,
			resourceId: "Desc_OreIron_C",
			displayName: `Source ${suffix}`,
			purity: "normal",
			extractorStrategyId: "miner",
			extractorTierId: "miner-mk1",
			clockPercent: "100.0000",
			powerShardCount: 0,
			position: { x: 0, y: index * 40 },
			ports: [
				{
					id: sourcePort,
					key: "output-0",
					direction: "output",
					materialForm: "solid",
					materialId: "Desc_OreIron_C",
				},
			],
		});
		nodes.push({
			kind: "machine",
			id: `machine-${suffix}`,
			buildingId: "Build_SmelterMk1_C",
			recipeId: "Recipe_IronIngot_C",
			displayName: `Smelter ${suffix}`,
			position: { x: 300, y: index * 40 },
			clockPercent: "100.0000",
			powerShardCount: 0,
			somersloopCount: 0,
			standby: false,
			ports: [
				{
					id: machineInput,
					key: "input-0",
					direction: "input",
					materialForm: "solid",
					materialId: "Desc_OreIron_C",
				},
				{
					id: `machine-output-${suffix}`,
					key: "output-0",
					direction: "output",
					materialForm: "solid",
					materialId: "Desc_IronIngot_C",
				},
			],
		});
		edges.push({
			id: `edge-${suffix}`,
			fromPortId: sourcePort,
			toPortId: machineInput,
			medium: "conveyor",
			transportTierId: "conveyor-mk6",
			itemOrFluidId: "Desc_OreIron_C",
			requestedRate: Rational.parse("0").toJSON(),
			actualRate: Rational.parse("0").toJSON(),
		});
	}
	return {
		schemaVersion: 5,
		planId: "performance-plan",
		name: `Synthetic ${nodeCount}`,
		createdAt: "2026-08-12T00:00:00.000Z",
		updatedAt: "2026-08-12T00:00:00.000Z",
		gameDataSnapshotId: "performance-v1",
		gameProfile: DEFAULT_SATISFACTORY_12_PROFILE,
		localization: { uiLocale: "en", gameDataLocale: "en-US", gameDataFallbackLocale: "en-US" },
		nodes,
		edges,
		viewport: { x: 0, y: 0, zoom: 1 },
		userMetadata: { synthetic: true },
	};
}

function percentile95(samples: readonly number[]): number {
	const sorted = [...samples].sort((left, right) => left - right);
	return sorted[Math.ceil(sorted.length * 0.95) - 1] ?? 0;
}

function heapUsed(): number {
	const runtime = globalThis as typeof globalThis & {
		readonly process: { memoryUsage(): { readonly heapUsed: number } };
	};
	return runtime.process.memoryUsage().heapUsed;
}

describe("calculation performance baseline", () => {
	it("records deterministic 100/500/1000-node full calculation baselines", () => {
		for (const nodeCount of counts) {
			const plan = syntheticPlan(nodeCount);
			const started = performance.now();
			const result = calculateFactoryPlan(plan);
			const durationMs = performance.now() - started;
			expect(result.resolved).toBe(true);
			expect(result.nodes).toHaveLength(nodeCount);
			expect(durationMs, `${nodeCount}-node full calculation`).toBeLessThan(2_000);
			metrics.push({ metric: "calculate-full", nodeCount, durationMs });
		}
	});

	it("keeps a normal 500-node incremental edit below the 100 ms p95 budget", () => {
		let plan = syntheticPlan(500);
		const engine = new IncrementalFlowEngine();
		engine.compute(plan);
		const samples: number[] = [];
		for (let sample = 0; sample < 25; sample += 1) {
			const sourceId = `source-${(sample % 250).toString().padStart(4, "0")}`;
			plan = {
				...plan,
				nodes: plan.nodes.map((node) =>
					node.id === sourceId && node.kind === "resource"
						? { ...node, purity: node.purity === "normal" ? "pure" : "normal" }
						: node,
				),
			};
			const started = performance.now();
			const result = engine.compute(plan, [sourceId]);
			samples.push(performance.now() - started);
			expect(result.instrumentation.recomputedNodeIds).toHaveLength(2);
		}
		const p95Ms = percentile95(samples);
		metrics.push({ metric: "calculate-incremental-p95", nodeCount: 500, p95Ms });
		expect(p95Ms).toBeLessThan(100);
	});

	it("does not show unbounded heap growth during repeated 500-node calculations", () => {
		const plan = syntheticPlan(500);
		const before = heapUsed();
		for (let sample = 0; sample < 30; sample += 1) calculateFactoryPlan(plan);
		const growthBytes = Math.max(0, heapUsed() - before);
		metrics.push({ metric: "heap-growth-smoke", nodeCount: 500, growthBytes });
		expect(growthBytes).toBeLessThan(96 * 1024 * 1024);
	});
});
