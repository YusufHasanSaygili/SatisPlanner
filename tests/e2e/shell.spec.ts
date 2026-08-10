import { expect, test } from "@playwright/test";

test("renders the SatisPlanner foundation shell and mock contract", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveTitle("SatisPlanner");
	await expect(page.getByRole("heading", { name: "SatisPlanner" })).toBeVisible();
	await expect(page.getByLabel("Building library")).toBeVisible();
	await expect(page.getByLabel("Factory canvas")).toBeVisible();
	await expect(page.getByLabel("Inspector")).toBeVisible();
	const fallbacks = page.getByLabel("Generic icon fallbacks").getByRole("img");
	await expect(fallbacks).toHaveCount(5);
	for (const icon of await fallbacks.all()) {
		await expect(icon).toBeVisible();
		await expect(icon).toHaveJSProperty("naturalWidth", 48);
	}
	await expect(page.getByLabel("Generic icon fallbacks")).toHaveScreenshot(
		"generic-icon-fallbacks.png",
	);
	await expect(page.getByRole("status")).toContainText("Contract v1 · browser-mock · v0.5.0");
});
