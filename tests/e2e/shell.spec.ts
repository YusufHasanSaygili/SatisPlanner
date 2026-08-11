import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Locator, type Page, test } from "@playwright/test";

async function dropCatalogEntry(page: Page, entry: Locator, position: { x: number; y: number }) {
	const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
	await entry.dispatchEvent("dragstart", { dataTransfer });
	const canvas = page.getByLabel("Factory canvas");
	await canvas.dispatchEvent("dragover", {
		dataTransfer,
		clientX: position.x,
		clientY: position.y,
	});
	await canvas.dispatchEvent("drop", { dataTransfer, clientX: position.x, clientY: position.y });
}

async function connectHandles(page: Page, sourceLabel: string, targetLabel: string) {
	const source = page.getByLabel(sourceLabel);
	const target = page.getByLabel(targetLabel);
	const sourceBox = await source.boundingBox();
	const targetBox = await target.boundingBox();
	if (!sourceBox || !targetBox) throw new Error("Expected visible source and target handles.");
	await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
	await page.mouse.down();
	await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
		steps: 10,
	});
	await page.mouse.up();
	await page.keyboard.press("Escape");
	await page.mouse.move(320, 120);
	await page.waitForTimeout(50);
}

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	await page.evaluate(() => localStorage.clear());
	await page.reload();
	await expect(page.getByTestId("plan-persistence")).toContainText("Saved");
});

test("renders the SatisPlanner graph shell and searchable fallback library", async ({ page }) => {
	await expect(page).toHaveTitle("SatisPlanner");
	await expect(page.getByRole("heading", { name: "SatisPlanner" })).toBeVisible();
	await expect(page.getByLabel("Building library")).toBeVisible();
	await expect(page.getByLabel("Factory canvas")).toBeVisible();
	await expect(page.getByLabel("Inspector")).toContainText("Nothing selected");
	await expect(page.getByLabel("Production catalog").getByRole("button")).toHaveCount(10);

	await page.getByLabel("Search catalog").fill("constructor");
	const matches = page.getByLabel("Production catalog").getByRole("button");
	await expect(matches).toHaveCount(2);
	await expect(matches.nth(0)).toContainText("Build_ConstructorMk1_C::Recipe_IronPlate_C");
	await expect(matches.nth(1)).toContainText("Build_ConstructorMk1_C::Recipe_IronRod_C");
	await expect(page.getByRole("status").first()).toContainText(
		"Contract v2 · browser-mock · v0.11.0",
	);
});

test("drag/drop, connect validation, inspector commands and reload remain domain-backed", async ({
	page,
}) => {
	await dropCatalogEntry(page, page.getByLabel("Drag Smelter · Iron Ingot"), {
		x: 390,
		y: 260,
	});
	await dropCatalogEntry(page, page.getByLabel("Drag Constructor · Iron Plate"), {
		x: 690,
		y: 260,
	});
	await dropCatalogEntry(page, page.getByLabel("Drag Refinery · Fuel"), {
		x: 690,
		y: 480,
	});
	await expect(page.locator(".react-flow__node")).toHaveCount(3);
	await expect(page.getByTestId("plan-persistence")).toContainText("3 nodes");

	await connectHandles(page, "Output Desc_IronPlate_C", "Input Desc_OreIron_C");
	await expect(page.locator(".react-flow__edge")).toHaveCount(0);
	await expect(page.getByRole("status").last()).toContainText("Material mismatch");

	await connectHandles(page, "Output Desc_IronIngot_C", "Input Desc_LiquidOil_C");
	await expect(page.locator(".react-flow__edge")).toHaveCount(0);
	await expect(page.getByRole("status").last()).toContainText(
		"Solid and fluid ports cannot be connected",
	);

	await connectHandles(page, "Output Desc_IronIngot_C", "Input Desc_IronIngot_C");
	await expect(page.locator(".react-flow__edge")).toHaveCount(1);
	await expect(page.getByTestId("plan-persistence")).toContainText("1 connections");
	await page.locator(".react-flow__edge").click({ position: { x: 40, y: 4 } });
	await expect(page.getByLabel("Connection inspector")).toContainText("conveyor");

	const constructorNode = page.locator(".react-flow__node").filter({
		hasText: "Constructor · Iron Plate",
	});
	const smelterNode = page.locator(".react-flow__node").filter({ hasText: "Smelter · Iron Ingot" });
	await smelterNode.getByText("Smelter · Iron Ingot", { exact: true }).click();
	await constructorNode.getByText("Constructor · Iron Plate", { exact: true }).click({
		modifiers: ["Control"],
	});
	await expect(page.getByLabel("Inspector")).toContainText("2 graph entities");
	await constructorNode.getByText("Constructor · Iron Plate", { exact: true }).click();
	await expect(page.getByLabel("Machine inspector")).toContainText("Recipe_IronPlate_C");
	await expect(page.getByLabel("Machine inspector")).toContainText("UUID");

	const initialSavedPosition = await page.evaluate(() => {
		const plan = JSON.parse(localStorage.getItem("satisplanner.slice-07.factory-plan") ?? "{}") as {
			nodes?: Array<{ recipeId: string; position: { x: number; y: number } }>;
		};
		return plan.nodes?.find((node) => node.recipeId === "Recipe_IronPlate_C")?.position;
	});
	const before = await constructorNode.boundingBox();
	if (!before) throw new Error("Expected the constructor node to be visible.");
	await page.mouse.move(before.x + 100, before.y + 20);
	await page.mouse.down();
	await page.mouse.move(before.x + 160, before.y + 80, { steps: 8 });
	await page.mouse.up();
	const savedPosition = await page.evaluate(() => {
		const plan = JSON.parse(localStorage.getItem("satisplanner.slice-07.factory-plan") ?? "{}") as {
			nodes?: Array<{ recipeId: string; position: { x: number; y: number } }>;
		};
		return plan.nodes?.find((node) => node.recipeId === "Recipe_IronPlate_C")?.position;
	});
	expect(savedPosition?.x).toBeGreaterThan(initialSavedPosition?.x ?? Number.POSITIVE_INFINITY);

	await page.getByRole("button", { name: "Duplicate instance" }).click();
	await expect(page.locator(".react-flow__node")).toHaveCount(4);
	await page.getByRole("button", { name: "Delete selection" }).click();
	await expect(page.locator(".react-flow__node")).toHaveCount(3);
	await expect(page.getByLabel("Inspector")).toContainText("Nothing selected");

	await page.reload();
	await expect(page.locator(".react-flow__node")).toHaveCount(3);
	await expect(page.locator(".react-flow__edge")).toHaveCount(0);
	await expect(page.getByTestId("plan-persistence")).toContainText(
		"Saved · 3 nodes · 0 connections",
	);
});

test("resource drag/drop keeps purity, tier, shards and golden output instance-local", async ({
	page,
}) => {
	const iron = page.getByLabel("Drag resource Iron Ore");
	await dropCatalogEntry(page, iron, { x: 430, y: 250 });
	await dropCatalogEntry(page, iron, { x: 720, y: 450 });
	const resources = page.locator(".react-flow__node-resource");
	await expect(resources).toHaveCount(2);

	await resources.nth(0).getByText("Iron Ore", { exact: true }).click();
	const inspector = page.getByLabel("Resource inspector");
	await expect(inspector).toContainText("60 items/min");
	await page.getByLabel("Set purity pure").click();
	await page.getByLabel("Extractor tier").selectOption("miner-mk3");
	await page.getByLabel("Set 3 Power Shards").click();
	await page.getByLabel("Clock percent").fill("250");
	await page.getByLabel("Clock percent").blur();
	await expect(page.getByLabel("Extraction results")).toContainText("1,200 items/min");
	await expect(page.getByLabel("Extraction results")).toContainText("MW");

	await page.getByLabel("Set 2 Power Shards").click();
	await expect(page.getByRole("status").last()).toContainText("exceeds the capacity");
	await expect(page.getByLabel("Set 3 Power Shards")).toHaveAttribute("aria-pressed", "true");

	await resources.nth(1).getByText("Iron Ore", { exact: true }).click();
	await expect(page.getByLabel("Set purity normal")).toHaveAttribute("aria-pressed", "true");
	await expect(page.getByLabel("Extractor tier")).toHaveValue("miner-mk1");
	await expect(page.getByLabel("Extraction results")).toContainText("60 items/min");

	await page.reload();
	await expect(page.locator(".react-flow__node-resource")).toHaveCount(2);
	await page
		.locator(".react-flow__node-resource")
		.nth(0)
		.getByText("Iron Ore", { exact: true })
		.click();
	await expect(page.getByLabel("Set purity pure")).toHaveAttribute("aria-pressed", "true");
	await expect(page.getByLabel("Extractor tier")).toHaveValue("miner-mk3");
	await expect(page.getByLabel("Extraction results")).toContainText("1,200 items/min");
});

test("steady-state engine exposes actual, required, efficiency and edge rates", async ({
	page,
}) => {
	await dropCatalogEntry(page, page.getByLabel("Drag resource Iron Ore"), {
		x: 300,
		y: 240,
	});
	await dropCatalogEntry(page, page.getByLabel("Drag Smelter · Iron Ingot"), {
		x: 570,
		y: 240,
	});
	await dropCatalogEntry(page, page.getByLabel("Drag Constructor · Iron Plate"), {
		x: 850,
		y: 240,
	});
	await connectHandles(page, "Output Desc_OreIron_C", "Input Desc_OreIron_C");
	await connectHandles(page, "Output Desc_IronIngot_C", "Input Desc_IronIngot_C");
	await expect(page.locator(".react-flow__edge")).toHaveCount(2);
	await expect(page.getByTestId("flow-engine-status")).toContainText("Flow solved · 3 nodes");

	await page
		.locator(".react-flow__node-machine")
		.filter({ hasText: "Constructor · Iron Plate" })
		.getByText("Constructor · Iron Plate", { exact: true })
		.click();
	const calculation = page.getByLabel("Machine calculation results");
	await expect(calculation).toContainText("100% efficient");
	await expect(calculation).toContainText("30 actual / 30 required");
	await expect(calculation).toContainText("20 actual / 20 potential");
	await expect(calculation).toContainText("4.00 MW");

	await page
		.locator(".react-flow__edge")
		.nth(1)
		.click({ position: { x: 40, y: 4 } });
	const edgeInspector = page.getByLabel("Connection inspector");
	await expect(edgeInspector).toContainText("Actual rate");
	await expect(edgeInspector).toContainText("30/min");
	await expect(edgeInspector).toContainText("Required rate");
});

test("Coal Pure Mk.3 at 250% exposes and clears the Mk.5 transport bottleneck", async ({
	page,
}) => {
	await dropCatalogEntry(page, page.getByLabel("Drag resource Coal"), { x: 320, y: 250 });
	await dropCatalogEntry(page, page.getByLabel("Drag Foundry · Steel Ingot"), { x: 720, y: 250 });

	await page.locator(".react-flow__node-resource .machine-node-title").getByText("Coal", { exact: true }).click();
	await page.getByLabel("Set purity pure").click();
	await page.getByLabel("Extractor tier").selectOption("miner-mk3");
	await page.getByLabel("Set 3 Power Shards").click();
	await page.getByLabel("Clock percent").fill("250");
	await page.getByLabel("Clock percent").blur();
	await expect(page.getByLabel("Extraction results")).toContainText("1,200 items/min");

	await connectHandles(page, "Output Desc_Coal_C", "Input Desc_Coal_C");
	await expect(page.locator(".react-flow__edge")).toHaveCount(1);
	await page.evaluate(() => {
		const key = "satisplanner.slice-07.factory-plan";
		const plan = JSON.parse(localStorage.getItem(key) ?? "{}") as {
			edges: Array<{
				transportTierId: string;
				requestedRate: { numerator: string; denominator: string };
			}>;
		};
		if (!plan.edges[0]) throw new Error("Expected the Coal transport edge.");
		plan.edges[0].transportTierId = "conveyor-mk5";
		plan.edges[0].requestedRate = { numerator: "1200", denominator: "1" };
		localStorage.setItem(key, JSON.stringify(plan));
	});
	await page.reload();

	const bottlenecks = page.getByLabel("Transport bottlenecks");
	await expect(bottlenecks).toContainText("1");
	await expect(bottlenecks).toContainText("420/min lost");
	await expect(page.locator(".react-flow__edge")).toHaveAttribute(
		"aria-label",
		/Warning: transport capacity bottleneck/,
	);
	await bottlenecks.getByRole("button", { name: /420\/min lost/ }).click();

	const inspector = page.getByLabel("Connection inspector");
	await expect(inspector.getByRole("alert")).toContainText("Capacity bottleneck");
	await expect(inspector).toContainText("Requested rate");
	await expect(inspector).toContainText("1,200/min");
	await expect(inspector).toContainText("Capacity");
	await expect(inspector).toContainText("780/min");
	await expect(inspector).toContainText("Actual rate");
	await expect(inspector).toContainText("Lost rate");
	await expect(inspector).toContainText("420/min");
	await expect(inspector).toContainText("conveyor-mk6");
	if (process.platform === "win32") {
		await expect(inspector).toHaveScreenshot("coal-mk5-bottleneck.png", {
			mask: [inspector.locator("dd").first()],
		});
	} else {
		const visualEvidence = await inspector.screenshot({ animations: "disabled" });
		expect(visualEvidence.byteLength).toBeGreaterThan(10_000);
	}

	await page.getByLabel("Transport tier").selectOption("conveyor-mk6");
	await expect(inspector).toContainText("1,200/min");
	await expect(inspector).toContainText("0/min");
	await expect(inspector.getByRole("alert")).toHaveCount(0);
	await expect(bottlenecks).toContainText("No capacity bottlenecks");
});

test("plan migration and upstream FCS conversion stay previewable, cancellable and loss-visible", async ({
	page,
}) => {
	await page.getByText("Save, import & migration").click();
	const persistence = page.getByLabel("Plan import and export");
	const legacyPlanPath = path.resolve(
		"packages/domain/src/fixtures/factory-plan-v1.json",
	);
	const legacyPlanBefore = readFileSync(legacyPlanPath, "utf8");
	await page.getByLabel("Import plan file").setInputFiles(legacyPlanPath);
	await page.getByRole("button", { name: "Preview plan import" }).click();
	const planReport = page.getByLabel("Plan migration report");
	await expect(planReport).toContainText("Schema 1 → 4");
	await expect(planReport).toContainText("1→2, 2→3, 3→4");
	await expect(planReport).toContainText("Snapshot mismatch");
	await planReport.getByRole("button", { name: "Cancel import" }).click();
	await expect(page.locator(".react-flow__node")).toHaveCount(0);

	await page.getByRole("button", { name: "Preview plan import" }).click();
	await page.getByRole("button", { name: "Apply imported plan" }).click();
	await expect(page.locator(".react-flow__node")).toHaveCount(1);
	await expect(page.getByTestId("plan-persistence")).toContainText("Saved · 1 nodes");
	expect(readFileSync(legacyPlanPath, "utf8")).toBe(legacyPlanBefore);

	const upstreamPath = path.resolve(
		"tests/upstream-characterization/fixtures/simple-chain-v7.fcs",
	);
	const upstreamBefore = readFileSync(upstreamPath, "utf8");
	await page.getByLabel("Import upstream FCS file").setInputFiles(upstreamPath);
	await page.getByLabel("Aggregate expansion strategy").selectOption("expand-rounded-up");
	await page.getByRole("button", { name: "Preview .fcs conversion" }).click();
	const fcsReport = page.getByLabel("FCS conversion report");
	await expect(fcsReport).toContainText(".fcs v7 → v7");
	await expect(fcsReport).toContainText("2 craft nodes → 4 physical instances · 2 links");
	await expect(fcsReport).toContainText("Unknown recipes: none");
	await expect(fcsReport).toContainText("dropped links: 0");
	await fcsReport.getByRole("button", { name: "Cancel conversion" }).click();
	await expect(page.locator(".react-flow__node")).toHaveCount(1);

	await page.getByRole("button", { name: "Preview .fcs conversion" }).click();
	await page.getByRole("button", { name: "Apply .fcs conversion" }).click();
	await expect(page.locator(".react-flow__node")).toHaveCount(4);
	await expect(page.locator(".react-flow__edge")).toHaveCount(2);
	await expect(page.getByTestId("plan-persistence")).toContainText("Saved · 4 nodes · 2 connections");
	expect(readFileSync(upstreamPath, "utf8")).toBe(upstreamBefore);
	await expect(persistence).toBeVisible();
});

test("machine inspector exposes the exact Constructor, Assembler and Manufacturer sloop matrices", async ({
	page,
}) => {
	await dropCatalogEntry(page, page.getByLabel("Drag Constructor · Iron Plate"), {
		x: 380,
		y: 220,
	});
	await dropCatalogEntry(page, page.getByLabel("Drag Assembler · Reinforced Iron Plate"), {
		x: 650,
		y: 350,
	});
	await dropCatalogEntry(page, page.getByLabel("Drag Manufacturer · Computer"), {
		x: 910,
		y: 480,
	});
	await dropCatalogEntry(page, page.getByLabel("Drag Smelter · Iron Ingot"), {
		x: 520,
		y: 560,
	});

	await page
		.locator(".react-flow__node-machine")
		.filter({ hasText: "Constructor · Iron Plate" })
		.getByText("Constructor · Iron Plate", { exact: true })
		.click();
	await expect(page.getByLabel("Set 1 Somersloops, 2 times multiplier")).toBeVisible();

	await page
		.locator(".react-flow__node-machine")
		.filter({ hasText: "Assembler · Reinforced Iron Plate" })
		.getByText("Assembler · Reinforced Iron Plate", { exact: true })
		.click();
	await expect(page.getByLabel("Set 1 Somersloops, 1.5 times multiplier")).toBeVisible();
	await expect(page.getByLabel("Set 2 Somersloops, 2 times multiplier")).toBeVisible();

	await page
		.locator(".react-flow__node-machine")
		.filter({ hasText: "Manufacturer · Computer" })
		.getByText("Manufacturer · Computer", { exact: true })
		.click();
	await expect(page.getByLabel("Set 1 Somersloops, 1.25 times multiplier")).toBeVisible();
	await expect(page.getByLabel("Set 4 Somersloops, 2 times multiplier")).toBeVisible();

	await page
		.locator(".react-flow__node-machine")
		.filter({ hasText: "Smelter · Iron Ingot" })
		.getByText("Smelter · Iron Ingot", { exact: true })
		.click();
	await expect(page.getByLabel("Somersloops unavailable")).toBeDisabled();
	await expect(page.getByLabel("Machine inspector")).toContainText(
		"This building has no Somersloop slots",
	);
});

test("three Assembler instances keep recipe, clock, shard and sloop state isolated through reload", async ({
	page,
}) => {
	await dropCatalogEntry(page, page.getByLabel("Drag Assembler · Reinforced Iron Plate"), {
		x: 420,
		y: 260,
	});
	await page
		.locator(".react-flow__node-machine")
		.getByText("Assembler · Reinforced Iron Plate", { exact: true })
		.click();
	await page.getByRole("button", { name: "Duplicate twice" }).click();
	const assemblers = page.locator(".react-flow__node-machine");
	await expect(assemblers).toHaveCount(3);

	await assemblers
		.nth(1)
		.getByText("Assembler · Reinforced Iron Plate #2", { exact: true })
		.click();
	await page.getByLabel("Set machine to 1 Power Shards").click();
	await page.getByLabel("Machine clock percent").fill("150");
	await page.getByLabel("Machine clock percent").blur();
	await page.getByLabel("Set 1 Somersloops, 1.5 times multiplier").click();
	await page.getByLabel("Search compatible recipes").fill("rotor");
	await expect(page.getByLabel("Compatible recipes").getByRole("button")).toHaveCount(1);
	await page
		.getByLabel("Compatible recipes")
		.getByRole("button", { name: /Assembler · Rotor/ })
		.click();

	await assemblers
		.nth(2)
		.getByText("Assembler · Reinforced Iron Plate #3", { exact: true })
		.click();
	await page.getByLabel("Set machine to 2 Power Shards").click();
	await page.getByLabel("Machine clock percent").fill("200");
	await page.getByLabel("Machine clock percent").blur();
	await page.getByLabel("Set 2 Somersloops, 2 times multiplier").click();

	await assemblers.nth(0).getByText("Assembler · Reinforced Iron Plate", { exact: true }).click();
	await expect(page.getByLabel("Set machine to 0 Power Shards")).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	await expect(page.getByLabel("Machine clock percent")).toHaveValue("100.0000");
	await expect(page.getByLabel("Set 0 Somersloops, 1 times multiplier")).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	await page.getByLabel("Machine clock percent").fill("150");
	await page.getByLabel("Machine clock percent").blur();
	await expect(page.getByRole("alert")).toContainText("Clock");
	await expect(page.getByLabel("Machine clock percent")).toHaveValue("100.0000");
	await page.getByRole("button", { name: "Use shard-safe clock" }).click();

	await expect(page.getByTestId("plan-persistence")).toContainText("3 nodes");
	const saved = await page.evaluate(() => {
		const plan = JSON.parse(localStorage.getItem("satisplanner.slice-07.factory-plan") ?? "{}") as {
			nodes?: Array<{
				recipeId: string;
				clockPercent: string;
				powerShardCount: number;
				somersloopCount: number;
			}>;
		};
		return plan.nodes;
	});
	expect(saved).toEqual([
		expect.objectContaining({
			recipeId: "Recipe_IronPlateReinforced_C",
			clockPercent: "100.0000",
			powerShardCount: 0,
			somersloopCount: 0,
		}),
		expect.objectContaining({
			recipeId: "Recipe_Rotor_C",
			clockPercent: "150.0000",
			powerShardCount: 1,
			somersloopCount: 1,
		}),
		expect.objectContaining({
			recipeId: "Recipe_IronPlateReinforced_C",
			clockPercent: "200.0000",
			powerShardCount: 2,
			somersloopCount: 2,
		}),
	]);

	await page.reload();
	await expect(page.locator(".react-flow__node-machine")).toHaveCount(3);
	await page
		.locator(".react-flow__node-machine")
		.filter({ hasText: "Assembler · Rotor" })
		.getByText("Assembler · Rotor", { exact: true })
		.click();
	await expect(page.getByLabel("Set machine to 1 Power Shards")).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	await expect(page.getByLabel("Machine clock percent")).toHaveValue("150.0000");
	await expect(page.getByLabel("Set 1 Somersloops, 1.5 times multiplier")).toHaveAttribute(
		"aria-pressed",
		"true",
	);
});

test("removed catalog entries remain unresolved without losing saved machine state", async ({
	page,
}) => {
	await page.evaluate(() => {
		localStorage.setItem(
			"satisplanner.slice-07.factory-plan",
			JSON.stringify({
				schemaVersion: 3,
				planId: "00000000-0000-4000-8000-000000000001",
				name: "Unresolved catalog fixture",
				createdAt: "2026-08-11T00:00:00.000Z",
				updatedAt: "2026-08-11T00:00:00.000Z",
				gameDataSnapshotId: "removed-catalog-snapshot",
				gameProfile: { id: "satisfactory", version: "1.2" },
				nodes: [
					{
						kind: "machine",
						id: "00000000-0000-4000-8000-000000000002",
						buildingId: "Build_RemovedMachine_C",
						recipeId: "Recipe_Removed_C",
						displayName: "Removed Catalog Machine",
						position: { x: 220, y: 180 },
						clockPercent: "150.0000",
						powerShardCount: 1,
						somersloopCount: 0,
						standby: false,
						ports: [
							{
								id: "00000000-0000-4000-8000-000000000003",
								key: "output-0",
								direction: "output",
								materialForm: "solid",
								materialId: "Desc_Removed_C",
							},
						],
					},
				],
				edges: [],
				viewport: { x: 0, y: 0, zoom: 1 },
				userMetadata: {},
			}),
		);
	});
	await page.reload();
	await page.getByText("Removed Catalog Machine", { exact: true }).click();
	await expect(page.getByLabel("Machine inspector")).toContainText("Recipe_Removed_C");
	await expect(page.getByRole("alert")).toContainText("Unresolved catalog binding");
	const persistedRecipe = await page.evaluate(() => {
		const plan = JSON.parse(localStorage.getItem("satisplanner.slice-07.factory-plan") ?? "{}") as {
			nodes?: Array<{ recipeId: string; clockPercent: string }>;
		};
		return plan.nodes?.[0];
	});
	expect(persistedRecipe).toMatchObject({ recipeId: "Recipe_Removed_C", clockPercent: "150.0000" });
});
