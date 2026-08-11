import { describe, expect, it } from "vitest";
import {
	addMachineNode,
	addResourceNode,
	connectMachinePorts,
	deletePlanEntities,
	duplicateMachineNode,
	movePlanNode,
	setPlanViewport,
	validateConnection,
	updateResourceNodeSettings,
	type FactoryPlanV3,
	type MachineNodeTemplate,
} from "./index";

const baseTime = "2026-08-11T00:00:00.000Z";

function emptyPlan(): FactoryPlanV3 {
	return {
		schemaVersion: 3,
		planId: "00000000-0000-4000-8000-000000000001",
		name: "Graph command test",
		createdAt: baseTime,
		updatedAt: baseTime,
		gameDataSnapshotId: "fallback-graph-catalog-v1",
		gameProfile: { id: "satisfactory", version: "1.2" },
		nodes: [],
		edges: [],
		viewport: { x: 0, y: 0, zoom: 1 },
		userMetadata: {},
	};
}

function template(
	classId: string,
	input: { form: "solid" | "fluid"; id: string },
	output: { form: "solid" | "fluid"; id: string },
): MachineNodeTemplate {
	return {
		classId,
		displayName: classId,
		category: "Production",
		buildingId: classId,
		recipeId: `Recipe_${classId}`,
		aliases: [],
		ports: [
			{ key: "input-0", direction: "input", materialForm: input.form, materialId: input.id },
			{ key: "output-0", direction: "output", materialForm: output.form, materialId: output.id },
		],
	};
}

function ids(seed: number) {
	const suffix = (value: number) => String(value).padStart(12, "0");
	return {
		nodeId: `00000000-0000-4000-8000-${suffix(seed)}`,
		portIds: [
			`00000000-0000-4000-8000-${suffix(seed + 1)}`,
			`00000000-0000-4000-8000-${suffix(seed + 2)}`,
		],
	};
}

describe("domain-backed graph commands", () => {
	it("creates stable instances and persists position plus viewport without mutating input", () => {
		const original = emptyPlan();
		const added = addMachineNode(
			original,
			template("Constructor", { form: "solid", id: "IronIngot" }, { form: "solid", id: "Plate" }),
			{ x: 120, y: 180 },
			ids(10),
		);
		expect(original.nodes).toEqual([]);
		expect(added.nodes[0]).toMatchObject({ id: ids(10).nodeId, position: { x: 120, y: 180 } });
		const moved = movePlanNode(added, ids(10).nodeId, { x: 220, y: 280 });
		const viewed = setPlanViewport(moved, { x: 12, y: -8, zoom: 1.25 });
		expect(viewed.nodes[0]?.position).toEqual({ x: 220, y: 280 });
		expect(viewed.viewport).toEqual({ x: 12, y: -8, zoom: 1.25 });
	});

	it("accepts matching output-to-input and rejects the invalid connection matrix", () => {
		let plan = addMachineNode(
			emptyPlan(),
			template("Smelter", { form: "solid", id: "Ore" }, { form: "solid", id: "Ingot" }),
			{ x: 0, y: 0 },
			ids(10),
		);
		plan = addMachineNode(
			plan,
			template("Constructor", { form: "solid", id: "Ingot" }, { form: "solid", id: "Plate" }),
			{ x: 300, y: 0 },
			ids(20),
		);
		plan = addMachineNode(
			plan,
			template("Refinery", { form: "fluid", id: "Oil" }, { form: "fluid", id: "Fuel" }),
			{ x: 600, y: 0 },
			ids(30),
		);

		const valid = {
			sourceNodeId: ids(10).nodeId,
			sourcePortId: ids(10).portIds[1] as string,
			targetNodeId: ids(20).nodeId,
			targetPortId: ids(20).portIds[0] as string,
		};
		expect(validateConnection(plan, valid)).toEqual({
			ok: true,
			medium: "conveyor",
			materialId: "Ingot",
		});
		const connected = connectMachinePorts(plan, {
			...valid,
			edgeId: "00000000-0000-4000-8000-000000000099",
		});
		expect(connected.plan.edges).toHaveLength(1);

		const cases = [
			{
				code: "OUTPUT_TO_INPUT_REQUIRED",
				identity: { ...valid, sourcePortId: ids(10).portIds[0] as string },
			},
			{
				code: "SELF_CONNECTION",
				identity: {
					...valid,
					targetNodeId: ids(10).nodeId,
					targetPortId: ids(10).portIds[0] as string,
				},
			},
			{
				code: "MATERIAL_FORM_MISMATCH",
				identity: {
					...valid,
					targetNodeId: ids(30).nodeId,
					targetPortId: ids(30).portIds[0] as string,
				},
			},
			{
				code: "MATERIAL_ID_MISMATCH",
				identity: {
					...valid,
					sourceNodeId: ids(20).nodeId,
					sourcePortId: ids(20).portIds[1] as string,
					targetNodeId: ids(10).nodeId,
					targetPortId: ids(10).portIds[0] as string,
				},
			},
			{ code: "MEDIUM_MISMATCH", identity: { ...valid, requestedMedium: "pipeline" } },
			{ code: "DUPLICATE_CONNECTION", identity: valid },
		] as const;
		for (const testCase of cases) {
			const result = validateConnection(
				testCase.code === "DUPLICATE_CONNECTION" ? connected.plan : plan,
				testCase.identity,
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.diagnostic.code).toBe(testCase.code);
		}
	});

	it("duplicates and deletes selected instances without leaving stale edges", () => {
		let plan = addMachineNode(
			emptyPlan(),
			template("Constructor", { form: "solid", id: "Ingot" }, { form: "solid", id: "Plate" }),
			{ x: 100, y: 100 },
			ids(10),
		);
		plan = duplicateMachineNode(plan, ids(10).nodeId, ids(20));
		expect(plan.nodes[1]?.position).toEqual({ x: 148, y: 148 });
		plan = deletePlanEntities(plan, [ids(10).nodeId], []);
		expect(plan.nodes.map((node) => node.id)).toEqual([ids(20).nodeId]);
	});

	it("creates and edits independent resource instances with shard-safe clock state", () => {
		const template = {
			classId: "Desc_OreIron_C::miner",
			displayName: "Iron Ore",
			category: "Resources" as const,
			resourceId: "Desc_OreIron_C",
			materialForm: "solid" as const,
			extractorStrategyId: "miner",
			defaultTierId: "miner-mk1",
			availableTierIds: ["miner-mk1", "miner-mk2", "miner-mk3"],
			aliases: ["iron"],
		};
		let plan = addResourceNode(
			emptyPlan(),
			template,
			{ x: 10, y: 20 },
			{
				nodeId: ids(10).nodeId,
				portIds: [ids(10).portIds[0] as string],
			},
		);
		plan = addResourceNode(
			plan,
			template,
			{ x: 310, y: 20 },
			{
				nodeId: ids(20).nodeId,
				portIds: [ids(20).portIds[0] as string],
			},
		);
		plan = updateResourceNodeSettings(plan, ids(10).nodeId, {
			purity: "pure",
			extractorTierId: "miner-mk3",
			powerShardCount: 3,
			clockPercent: "250",
		});
		expect(plan.nodes[0]).toMatchObject({
			kind: "resource",
			purity: "pure",
			extractorTierId: "miner-mk3",
			powerShardCount: 3,
			clockPercent: "250.0000",
		});
		expect(plan.nodes[1]).toMatchObject({
			kind: "resource",
			purity: "normal",
			extractorTierId: "miner-mk1",
			clockPercent: "100.0000",
		});
		expect(() =>
			updateResourceNodeSettings(plan, ids(10).nodeId, { powerShardCount: 2 }),
		).toThrowError(expect.objectContaining({ code: "CLOCK_EXCEEDS_SHARD_CAPACITY" }));
	});
});
