import { describe, expect, it } from "vitest";
import {
	FALLBACK_GRAPH_CATALOG,
	FALLBACK_MACHINE_BUILDINGS,
	FALLBACK_MACHINE_LIBRARY,
	FALLBACK_RESOURCE_CATALOG,
	NORMALIZED_SATISFACTORY_12_CATALOG,
} from "./fallback-graph-catalog";

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

	it("ships the complete normalized 1.2 catalog without raw descriptions or artwork", () => {
		expect(NORMALIZED_SATISFACTORY_12_CATALOG.items).toHaveLength(195);
		expect(FALLBACK_MACHINE_BUILDINGS).toHaveLength(11);
		expect(FALLBACK_GRAPH_CATALOG).toHaveLength(291);
		expect(FALLBACK_MACHINE_LIBRARY).toHaveLength(11);
		expect(FALLBACK_RESOURCE_CATALOG).toHaveLength(13);
		expect(FALLBACK_MACHINE_LIBRARY.map((entry) => entry.displayName)).toEqual(
			expect.arrayContaining([
				"Smelter · Iron Ingot",
				"Assembler · Reinforced Iron Plate",
				"Manufacturer · Computer",
				"Quantum Encoder · Superposition Oscillator",
			]),
		);
		expect(FALLBACK_MACHINE_LIBRARY.slice(0, 5).map((entry) => entry.buildingId)).toEqual([
			"Build_SmelterMk1_C",
			"Build_ConstructorMk1_C",
			"Build_FoundryMk1_C",
			"Build_AssemblerMk1_C",
			"Build_ManufacturerMk1_C",
		]);
		expect(FALLBACK_RESOURCE_CATALOG.map((entry) => entry.displayName)).toEqual(
			expect.arrayContaining(["Caterium Ore", "Sulfur", "SAM", "Nitrogen Gas"]),
		);
		expect(NORMALIZED_SATISFACTORY_12_CATALOG.items[0]).not.toHaveProperty("description");
		expect(NORMALIZED_SATISFACTORY_12_CATALOG.items[0]).not.toHaveProperty("iconAssetPath");
		expect(JSON.stringify(NORMALIZED_SATISFACTORY_12_CATALOG)).not.toMatch(
			/CommunityResources|steamapps|[A-Z]:\\Users\\/i,
		);
	});

	it("keeps Assembler recipes isolated and exposes the complete Foundry recipe set", () => {
		const assembler = FALLBACK_MACHINE_BUILDINGS.find(
			(entry) => entry.buildingId === "Build_AssemblerMk1_C",
		);
		expect(assembler?.compatibleRecipeIds).toContain("Recipe_IronPlateReinforced_C");
		expect(assembler?.compatibleRecipeIds).toContain("Recipe_Rotor_C");
		expect(assembler?.compatibleRecipeIds).not.toContain("Recipe_IngotSteel_C");
		const foundryRecipes = FALLBACK_GRAPH_CATALOG.filter(
			(entry) => entry.buildingId === "Build_FoundryMk1_C",
		);
		expect(foundryRecipes).toHaveLength(16);
		expect(foundryRecipes.map((entry) => entry.recipeId)).toEqual(
			expect.arrayContaining(["Recipe_IngotSteel_C", "Recipe_IngotAluminum_C"]),
		);
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
