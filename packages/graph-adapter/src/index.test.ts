import { DEFAULT_SATISFACTORY_12_PROFILE, type FactoryPlanV3 } from "@satisplanner/domain";
import { describe, expect, it } from "vitest";
import { projectFactoryPlan } from "./index";

const plan: FactoryPlanV3 = {
	schemaVersion: 6,
	planId: "00000000-0000-4000-8000-000000000001",
	name: "Projection test",
	createdAt: "2026-08-11T00:00:00.000Z",
	updatedAt: "2026-08-11T00:00:00.000Z",
	gameDataSnapshotId: "fallback-graph-catalog-v1",
	gameProfile: DEFAULT_SATISFACTORY_12_PROFILE,
	localization: { uiLocale: "en", gameDataLocale: "en-US", gameDataFallbackLocale: "en-US" },
	nodes: [
		{
			kind: "machine",
			id: "00000000-0000-4000-8000-000000000010",
			buildingId: "Build_SmelterMk1_C",
			recipeId: "Recipe_IronIngot_C",
			displayName: "Smelter · Iron Ingot",
			position: { x: 40, y: 80 },
			clockPercent: "100.0000",
			powerShardCount: 0,
			somersloopCount: 0,
			standby: false,
			ports: [
				{
					id: "00000000-0000-4000-8000-000000000011",
					key: "output-0",
					direction: "output",
					materialForm: "solid",
					materialId: "Desc_IronIngot_C",
				},
			],
		},
		{
			kind: "resource",
			id: "00000000-0000-4000-8000-000000000020",
			resourceId: "Desc_OreIron_C",
			displayName: "Iron Ore",
			purity: "pure",
			extractorStrategyId: "miner",
			extractorTierId: "miner-mk3",
			clockPercent: "250.0000",
			powerShardCount: 3,
			position: { x: 340, y: 80 },
			ports: [
				{
					id: "00000000-0000-4000-8000-000000000021",
					key: "output-0",
					direction: "output",
					materialForm: "solid",
					materialId: "Desc_OreIron_C",
				},
			],
		},
		{
			kind: "junction",
			id: "00000000-0000-4000-8000-000000000030",
			junctionType: "splitter",
			displayName: "Conveyor Splitter",
			position: { x: 640, y: 80 },
			ports: [
				{
					id: "00000000-0000-4000-8000-000000000031",
					key: "input-0",
					direction: "input",
					materialForm: "solid",
					materialId: "*",
				},
				{
					id: "00000000-0000-4000-8000-000000000032",
					key: "output-0",
					direction: "output",
					materialForm: "solid",
					materialId: "*",
				},
			],
		},
	],
	edges: [],
	viewport: { x: 0, y: 0, zoom: 1 },
	userMetadata: {},
};

describe("graph adapter", () => {
	it("projects immutable domain graph state without becoming the source of truth", () => {
		const projection = projectFactoryPlan(plan, new Set([plan.nodes[0]?.id as string]));
		expect(projection.nodes).toHaveLength(3);
		expect(projection.nodes[0]).toMatchObject({
			id: plan.nodes[0]?.id,
			type: "machine",
			position: { x: 40, y: 80 },
			selected: true,
		});
		const machine = projection.nodes[0];
		if (machine?.type !== "machine") throw new Error("Expected a projected machine node.");
		expect(machine.data.outputs[0]?.materialId).toBe("Desc_IronIngot_C");
		expect(projection.nodes[1]).toMatchObject({
			type: "resource",
			data: { purity: "pure", extractorTierId: "miner-mk3" },
		});
		expect(projection.nodes[2]).toMatchObject({
			type: "junction",
			data: { junctionType: "splitter" },
		});
	});
});
