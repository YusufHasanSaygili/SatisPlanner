import { expect, test } from "@playwright/test";

test("renders the SatisPlanner foundation shell and mock contract", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveTitle("SatisPlanner");
	await expect(page.getByRole("heading", { name: "SatisPlanner" })).toBeVisible();
	await expect(page.getByLabel("Building library")).toBeVisible();
	await expect(page.getByLabel("Factory canvas")).toBeVisible();
	await expect(page.getByLabel("Inspector")).toBeVisible();
	await expect(page.getByRole("status")).toContainText("Contract v1 · browser-mock · v0.2.1");
});
