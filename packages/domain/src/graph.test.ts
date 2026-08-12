import { describe, expect, it } from "vitest";
import {
	DEFAULT_SATISFACTORY_12_PROFILE,
	addMachineNode,
	addResourceNode,
	connectMachinePorts,
	deletePlanEntities,
	duplicateMachineNode,
	duplicateMachineNodes,
	movePlanNode,
	rebindMachineRecipe,
	setPlanViewport,
	updateMachineNodeSettings,
	validateConnection,
	updateResourceNodeSettings,
	type FactoryPlanV3,
	type MachineBuildingDefinition,
	type MachineNodeTemplate,
} from "./index";

const baseTime = "2026-08-11T00:00:00.000Z";

function emptyPlan(): FactoryPlanV3 {
	return {
		schemaVersion: 5,
		planId: "00000000-0000-4000-8000-000000000001",
		name: "Graph command test",
		createdAt: baseTime,
		updatedAt: baseTime,
		gameDataSnapshotId: "fallback-graph-catalog-v1",
		gameProfile: DEFAULT_SATISFACTORY_12_PROFILE,
		localization: { uiLocale: "en", gameDataLocale: "en-US", gameDataFallbackLocale: "en-US" },
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

	it("updates selected machine controls atomically and leaves sibling instances untouched", () => {
		const machineTemplate = template(
			"Build_ConstructorMk1_C",
			{ form: "solid", id: "Ingot" },
			{ form: "solid", id: "Plate" },
		);
		const definition: MachineBuildingDefinition = {
			buildingId: "Build_ConstructorMk1_C",
			displayName: "Constructor",
			compatibleRecipeIds: ["Recipe_Build_ConstructorMk1_C"],
			powerShardSlots: 3,
			somersloopSlots: 1,
		};
		let plan = addMachineNode(emptyPlan(), machineTemplate, { x: 0, y: 0 }, ids(10));
		plan = addMachineNode(plan, machineTemplate, { x: 300, y: 0 }, ids(20));
		plan = updateMachineNodeSettings(plan, ids(10).nodeId, definition, {
			powerShardCount: 2,
			clockPercent: "200",
			somersloopCount: 1,
			standby: true,
		});
		expect(plan.nodes[0]).toMatchObject({
			clockPercent: "200.0000",
			powerShardCount: 2,
			somersloopCount: 1,
			standby: true,
		});
		expect(plan.nodes[1]).toMatchObject({
			clockPercent: "100.0000",
			powerShardCount: 0,
			somersloopCount: 0,
			standby: false,
		});
		expect(() =>
			updateMachineNodeSettings(plan, ids(10).nodeId, definition, { powerShardCount: 1 }),
		).toThrowError(expect.objectContaining({ code: "CLOCK_EXCEEDS_SHARD_CAPACITY" }));
		expect(
			updateMachineNodeSettings(plan, ids(10).nodeId, definition, {
				powerShardCount: 1,
				clockPercent: "150",
			}).nodes[0],
		).toMatchObject({ powerShardCount: 1, clockPercent: "150.0000" });
	});

	it("batch duplicates machines with unique deep identities and no shared mutable arrays", () => {
		const original = addMachineNode(
			emptyPlan(),
			template("Assembler", { form: "solid", id: "A" }, { form: "solid", id: "B" }),
			{ x: 10, y: 20 },
			ids(10),
		);
		const duplicated = duplicateMachineNodes(original, ids(10).nodeId, [
			{ ...ids(20), labelSuffix: "#2" },
			{ ...ids(30), labelSuffix: "#3" },
		]);
		expect(duplicated.nodes).toHaveLength(3);
		expect(new Set(duplicated.nodes.map((node) => node.id)).size).toBe(3);
		expect(
			new Set(duplicated.nodes.flatMap((node) => node.ports.map((port) => port.id))).size,
		).toBe(6);
		expect(duplicated.nodes[0]?.ports).not.toBe(duplicated.nodes[1]?.ports);
		expect(duplicated.nodes[1]?.displayName).toContain("#2");
		expect(original.nodes).toHaveLength(1);
	});

	it("rebinds compatible recipes, preserves edges and reports every unsafe port change", () => {
		const firstRecipe = template(
			"Assembler",
			{ form: "solid", id: "Plate" },
			{ form: "solid", id: "ReinforcedPlate" },
		);
		const secondRecipe = {
			...firstRecipe,
			classId: "Assembler::Recipe_Rotor_C",
			recipeId: "Recipe_Rotor_C",
			displayName: "Assembler · Rotor",
			ports: [
				{ ...firstRecipe.ports[0], materialId: "Rod" },
				{ ...firstRecipe.ports[1], materialId: "Rotor" },
			],
		} as MachineNodeTemplate;
		const definition: MachineBuildingDefinition = {
			buildingId: "Assembler",
			displayName: "Assembler",
			compatibleRecipeIds: [firstRecipe.recipeId, secondRecipe.recipeId],
			powerShardSlots: 3,
			somersloopSlots: 2,
		};
		let plan = addMachineNode(emptyPlan(), firstRecipe, { x: 0, y: 0 }, ids(10));
		plan = addMachineNode(
			plan,
			template("Consumer", { form: "solid", id: "ReinforcedPlate" }, { form: "solid", id: "X" }),
			{ x: 300, y: 0 },
			ids(20),
		);
		plan = connectMachinePorts(plan, {
			edgeId: "00000000-0000-4000-8000-000000000099",
			sourceNodeId: ids(10).nodeId,
			sourcePortId: ids(10).portIds[1] as string,
			targetNodeId: ids(20).nodeId,
			targetPortId: ids(20).portIds[0] as string,
		}).plan;
		const rebound = rebindMachineRecipe(plan, ids(10).nodeId, definition, secondRecipe, []);
		expect(rebound.applied).toBe(true);
		expect(rebound.plan.edges).toEqual(plan.edges);
		expect(rebound.plan.nodes[0]).toMatchObject({
			recipeId: "Recipe_Rotor_C",
			ports: expect.arrayContaining([expect.objectContaining({ materialId: "Rotor" })]),
		});
		expect(rebound.diagnostics).toContainEqual(
			expect.objectContaining({
				code: "EDGE_REQUIRES_REVIEW",
				edgeId: "00000000-0000-4000-8000-000000000099",
			}),
		);
		expect(() =>
			rebindMachineRecipe(
				plan,
				ids(10).nodeId,
				definition,
				{ ...secondRecipe, buildingId: "Build_FoundryMk1_C" },
				[],
			),
		).toThrowError(expect.objectContaining({ code: "INCOMPATIBLE_RECIPE" }));

		const removesOutput = {
			...secondRecipe,
			classId: "Assembler::Recipe_NoOutput_C",
			recipeId: "Recipe_NoOutput_C",
			ports: secondRecipe.ports.slice(0, 1),
		};
		const removalDefinition = {
			...definition,
			compatibleRecipeIds: [...definition.compatibleRecipeIds, removesOutput.recipeId],
		};
		const rejected = rebindMachineRecipe(
			plan,
			ids(10).nodeId,
			removalDefinition,
			removesOutput,
			[],
		);
		expect(rejected.applied).toBe(false);
		expect(rejected.plan).toBe(plan);
		expect(rejected.diagnostics[0]?.code).toBe("CONNECTED_PORT_REMOVAL");
	});
});
