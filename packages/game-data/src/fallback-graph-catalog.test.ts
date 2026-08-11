import { describe, expect, it } from "vitest";
import { FALLBACK_GRAPH_CATALOG, FALLBACK_MACHINE_BUILDINGS } from "./fallback-graph-catalog";

describe("fallback machine catalog", () => {
	it("binds every recipe to exactly one compatible building definition", () => {
		for (const recipe of FALLBACK_GRAPH_CATALOG) {
			const building = FALLBACK_MACHINE_BUILDINGS.find(
				(candidate) => candidate.buildingId === recipe.buildingId,
			);
			expect(building, recipe.classId).toBeDefined();
			expect(building?.compatibleRecipeIds, recipe.classId).toContain(recipe.recipeId);
		}
		for (const building of FALLBACK_MACHINE_BUILDINGS) {
			const catalogRecipeIds = FALLBACK_GRAPH_CATALOG.filter(
				(recipe) => recipe.buildingId === building.buildingId,
			).map((recipe) => recipe.recipeId);
			expect([...building.compatibleRecipeIds].sort()).toEqual(catalogRecipeIds.sort());
		}
	});

	it("keeps Assembler recipes isolated and exposes Foundry alloy recipes", () => {
		const assembler = FALLBACK_MACHINE_BUILDINGS.find(
			(entry) => entry.buildingId === "Build_AssemblerMk1_C",
		);
		expect(assembler?.compatibleRecipeIds).toEqual([
			"Recipe_IronPlateReinforced_C",
			"Recipe_Rotor_C",
		]);
		expect(assembler?.compatibleRecipeIds).not.toContain("Recipe_IngotSteel_C");
		const foundryRecipes = FALLBACK_GRAPH_CATALOG.filter(
			(entry) => entry.buildingId === "Build_FoundryMk1_C",
		);
		expect(foundryRecipes).toHaveLength(2);
		expect(foundryRecipes.every((entry) => entry.aliases.includes("alloy"))).toBe(true);
	});

	it("describes the required Constructor, Assembler and Manufacturer slot counts", () => {
		expect(
			FALLBACK_MACHINE_BUILDINGS.map((entry) => [entry.displayName, entry.somersloopSlots]),
		).toEqual(
			expect.arrayContaining([
				["Smelter", 0],
				["Constructor", 1],
				["Assembler", 2],
				["Manufacturer", 4],
			]),
		);
	});
});
