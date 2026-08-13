import {
	DEFAULT_SATISFACTORY_12_PROFILE,
	type FactoryPlanV3,
	type PlanNodeV3,
	Rational,
	type TransportEdgeV3,
} from "@satisplanner/domain";
import { mkdirSync, writeFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { projectFactoryPlan } from "./index";
import { autoLayoutFactoryPlan } from "./layout";

const metrics: Array<Record<string, number | string>> = [];

afterAll(() => {
	const artifacts = new URL("../../../artifacts/", import.meta.url);
	mkdirSync(artifacts, { recursive: true });
	writeFileSync(
		new URL("graph-performance.json", artifacts),
		`${JSON.stringify(metrics, null, 2)}\n`,
	);
});

function syntheticPlan(nodeCount: number, edgeCount: number): FactoryPlanV3 {
	const nodes: PlanNodeV3[] = [];
	const pairCount = nodeCount / 2;
	for (let index = 0; index < pairCount; index += 1) {
		const suffix = index.toString().padStart(4, "0");
		nodes.push({
			kind: "resource",
			id: `source-${suffix}`,
			resourceId: "Desc_OreIron_C",
			displayName: `Source ${index}`,
			purity: "normal",
			extractorStrategyId: "miner",
			extractorTierId: "miner-mk1",
			clockPercent: "100.0000",
			powerShardCount: 0,
			position: { x: 0, y: index },
			ports: [
				{
					id: `source-port-${suffix}`,
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
			displayName: `Smelter ${index}`,
			position: { x: 300, y: index },
			clockPercent: "100.0000",
			powerShardCount: 0,
			somersloopCount: 0,
			standby: false,
			ports: [
				{
					id: `machine-input-${suffix}`,
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
	}
	const edges: TransportEdgeV3[] = Array.from({ length: edgeCount }, (_, index) => {
		const source = index % pairCount;
		const target = (index * 17 + Math.floor(index / pairCount)) % pairCount;
		return {
			id: `edge-${index.toString().padStart(4, "0")}`,
			fromPortId: `source-port-${source.toString().padStart(4, "0")}`,
			toPortId: `machine-input-${target.toString().padStart(4, "0")}`,
			medium: "conveyor",
			transportTierId: "conveyor-mk6",
			itemOrFluidId: "Desc_OreIron_C",
			requestedRate: Rational.parse("0").toJSON(),
			actualRate: Rational.parse("0").toJSON(),
		};
	});
	return {
		schemaVersion: 6,
		planId: "graph-performance",
		name: `Graph ${nodeCount}/${edgeCount}`,
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

function p95(samples: readonly number[]): number {
	return (
		[...samples].sort((left, right) => left - right)[Math.ceil(samples.length * 0.95) - 1] ?? 0
	);
}

describe("graph adapter performance baseline", () => {
	it("records projection and layout for 100/500/1000 nodes with dense edges", () => {
		for (const [nodeCount, edgeCount] of [
			[100, 160],
			[500, 800],
			[1000, 1600],
		] as const) {
			const plan = syntheticPlan(nodeCount, edgeCount);
			const projectionSamples: number[] = [];
			const layoutSamples: number[] = [];
			for (let sample = 0; sample < 20; sample += 1) {
				let started = performance.now();
				projectFactoryPlan(plan);
				projectionSamples.push(performance.now() - started);
				started = performance.now();
				autoLayoutFactoryPlan(plan);
				layoutSamples.push(performance.now() - started);
			}
			const projectionP95Ms = p95(projectionSamples);
			const layoutP95Ms = p95(layoutSamples);
			metrics.push({
				metric: "graph-adapter-p95",
				nodeCount,
				edgeCount,
				projectionP95Ms,
				layoutP95Ms,
			});
			expect(projectionP95Ms, `${nodeCount}/${edgeCount} projection`).toBeLessThan(100);
			expect(layoutP95Ms, `${nodeCount}/${edgeCount} layout`).toBeLessThan(100);
		}
	});
});
