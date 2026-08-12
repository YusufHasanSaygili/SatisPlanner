import { describe, expect, it } from "vitest";
import {
	createSatisfactory12Profile,
	DEFAULT_SATISFACTORY_12_PROFILE,
	gameProfileSummary,
	POWER_CONSUMPTION_MULTIPLIERS,
	RECIPE_COST_MULTIPLIERS,
	resolveGameProfileMultipliers,
	RESOURCE_PURITY_MODES,
	RESOURCE_RANDOMIZATION_MODES,
} from "./game-profile";

describe("Satisfactory 1.2 game profiles", () => {
	it("keeps the default profile exactly vanilla", () => {
		expect(DEFAULT_SATISFACTORY_12_PROFILE).toMatchObject({
			id: "satisfactory-1.2-default",
			kind: "default",
			recipePartsCostMultiplier: "1",
			powerConsumptionMultiplier: "1",
			resourceNodeRandomization: "default",
			resourceNodePurity: "default",
			worldSeed: "0",
		});
		expect(resolveGameProfileMultipliers(DEFAULT_SATISFACTORY_12_PROFILE)).toEqual({
			recipePartsCost: { numerator: "1", denominator: "1" },
			powerConsumption: { numerator: "1", denominator: "1" },
			spaceElevatorCost: { numerator: "1", denominator: "1" },
		});
	});

	it("pins the official 1.2 option matrix", () => {
		expect(RECIPE_COST_MULTIPLIERS).toEqual([
			"0.25",
			"0.50",
			"0.75",
			"1",
			"1.25",
			"1.50",
			"1.75",
			"2",
		]);
		expect(POWER_CONSUMPTION_MULTIPLIERS).toEqual(["0.25", "0.50", "0.75", "1", "2", "5"]);
		expect(RESOURCE_RANDOMIZATION_MODES).toHaveLength(5);
		expect(RESOURCE_PURITY_MODES).toHaveLength(7);
	});

	it("marks changed profiles and only records world seed as metadata", () => {
		const custom = createSatisfactory12Profile({
			recipePartsCostMultiplier: "1.75",
			powerConsumptionMultiplier: "5",
			resourceNodeRandomization: "fossil-fuel-rich",
			resourceNodePurity: "mostly-pure",
			worldSeed: "847221",
		});
		expect(custom).toMatchObject({ id: "satisfactory-1.2-custom", kind: "custom" });
		expect(gameProfileSummary(custom)).toContain("seed 847221");
		expect(custom).not.toHaveProperty("resourceCoordinates");
	});
});
