import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CatalogRecipe, CatalogSnapshot } from "./catalog";
import {
	activateCatalogSnapshot,
	diffCatalogSnapshots,
	importDocsSnapshot,
	prepareCatalogActivation,
	rollbackCatalogActivation,
	validateCatalogSnapshot,
	verifyCatalogSnapshotIntegrity,
} from "./snapshot";
import { encodeUtf16 } from "./test-helpers";

async function baseSnapshot(): Promise<CatalogSnapshot> {
	const source = readFileSync(new URL("./fixtures/en-US.json", import.meta.url), "utf8");
	const result = await importDocsSnapshot({
		bytes: encodeUtf16(source, "le"),
		fileName: "en-US.json",
		sourceKind: "steam",
		gameVersion: "1.2",
	});
	if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
	return result.snapshot;
}

function changedSnapshot(current: CatalogSnapshot): CatalogSnapshot {
	const currentRecipe = current.catalog.recipes[0];
	if (!currentRecipe) throw new Error("Fixture recipe is required.");
	const changedRecipe: CatalogRecipe = {
		...currentRecipe,
		durationSeconds: { numerator: "12", denominator: "1" },
	};
	const addedRecipe: CatalogRecipe = { ...currentRecipe, id: "Recipe_SP_Added_C" };
	return structuredClone({
		...current,
		snapshotId: "satisfactory-1.2-changed",
		catalog: { ...current.catalog, recipes: [changedRecipe, addedRecipe] },
	}) as CatalogSnapshot;
}

describe("catalog snapshot diff and activation", () => {
	it("rejects the pre-icon catalog schema so it is re-imported instead of silently upgraded", async () => {
		const current = await baseSnapshot();
		const legacy = { ...current, schemaVersion: 1 } as unknown as CatalogSnapshot;
		expect(validateCatalogSnapshot(legacy)).toContainEqual(
			expect.objectContaining({ code: "INVALID_SNAPSHOT", path: "$.schemaVersion" }),
		);
	});

	it("reports added and changed recipes deterministically", async () => {
		const current = await baseSnapshot();
		const next = changedSnapshot(current);
		const diff = diffCatalogSnapshots(current, next);
		expect(diff.addedRecipeIds).toEqual(["Recipe_SP_Added_C"]);
		expect(diff.removedRecipeIds).toEqual([]);
		expect(diff.changedRecipes.map((entry) => entry.id)).toEqual(["Recipe_SP_Plate_C"]);
	});

	it("reports removed recipes and detects normalized catalog tampering", async () => {
		const current = await baseSnapshot();
		const removed = structuredClone({
			...current,
			snapshotId: "satisfactory-1.2-removed",
			catalog: { ...current.catalog, recipes: [] },
		}) as CatalogSnapshot;
		expect(diffCatalogSnapshots(current, removed).removedRecipeIds).toEqual(["Recipe_SP_Plate_C"]);
		const diagnostics = await verifyCatalogSnapshotIntegrity(removed);
		expect(diagnostics).toContainEqual(
			expect.objectContaining({ code: "INVALID_SNAPSHOT", path: "$.provenance.normalizedHash" }),
		);
	});

	it("blocks a silent active-plan break, supports explicit activation and rollback", async () => {
		const current = await baseSnapshot();
		const next = changedSnapshot(current);
		const preview = prepareCatalogActivation(current, next, ["Recipe_SP_Plate_C"]);
		expect(preview.breakingRecipeIds).toEqual(["Recipe_SP_Plate_C"]);

		const blocked = activateCatalogSnapshot(preview, false);
		expect(blocked).toEqual(
			expect.objectContaining({
				ok: false,
				diagnostic: expect.objectContaining({ code: "ACTIVATION_REQUIRES_CONFIRMATION" }),
			}),
		);
		const activated = activateCatalogSnapshot(preview, true);
		expect(activated.ok).toBe(true);
		if (!activated.ok) return;
		expect(activated.activeSnapshot.snapshotId).toBe(next.snapshotId);
		expect(rollbackCatalogActivation(activated).snapshotId).toBe(current.snapshotId);
	});
});
