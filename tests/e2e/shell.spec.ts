import { expect, test, type Locator, type Page } from "@playwright/test";

async function dropCatalogEntry(
	page: Page,
	entry: Locator,
	position: { x: number; y: number },
) {
	const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
	await entry.dispatchEvent("dragstart", { dataTransfer });
	const canvas = page.getByLabel("Factory canvas");
	await canvas.dispatchEvent("dragover", { dataTransfer, clientX: position.x, clientY: position.y });
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
});

test("renders the SatisPlanner graph shell and searchable fallback library", async ({ page }) => {
	await expect(page).toHaveTitle("SatisPlanner");
	await expect(page.getByRole("heading", { name: "SatisPlanner" })).toBeVisible();
	await expect(page.getByLabel("Building library")).toBeVisible();
	await expect(page.getByLabel("Factory canvas")).toBeVisible();
	await expect(page.getByLabel("Inspector")).toContainText("Nothing selected");
	await expect(page.getByLabel("Production catalog").getByRole("button")).toHaveCount(4);

	await page.getByLabel("Search buildings").fill("constructor");
	const matches = page.getByLabel("Production catalog").getByRole("button");
	await expect(matches).toHaveCount(2);
	await expect(matches.nth(0)).toContainText("Build_ConstructorMk1_C::Recipe_IronPlate_C");
	await expect(matches.nth(1)).toContainText("Build_ConstructorMk1_C::Recipe_IronRod_C");
	await expect(page.getByRole("status").first()).toContainText("Contract v1 · browser-mock · v0.6.0");
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
		const plan = JSON.parse(
			localStorage.getItem("satisplanner.slice-05.factory-plan") ?? "{}",
		) as { nodes?: Array<{ recipeId: string; position: { x: number; y: number } }> };
		return plan.nodes?.find((node) => node.recipeId === "Recipe_IronPlate_C")?.position;
	});
	const before = await constructorNode.boundingBox();
	if (!before) throw new Error("Expected the constructor node to be visible.");
	await page.mouse.move(before.x + 100, before.y + 20);
	await page.mouse.down();
	await page.mouse.move(before.x + 160, before.y + 80, { steps: 8 });
	await page.mouse.up();
	const savedPosition = await page.evaluate(() => {
		const plan = JSON.parse(
			localStorage.getItem("satisplanner.slice-05.factory-plan") ?? "{}",
		) as { nodes?: Array<{ recipeId: string; position: { x: number; y: number } }> };
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
	await expect(page.getByTestId("plan-persistence")).toContainText("Saved · 3 nodes · 0 connections");
});
