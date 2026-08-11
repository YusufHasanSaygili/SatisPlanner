import { Rational } from "@satisplanner/domain";
import { describe, expect, it } from "vitest";
import {
	calculateMachineFormula,
	FALLBACK_PRODUCTION_FORMULAS,
	FormulaStrategyRegistry,
	PRODUCTION_POWER_EXPONENT,
} from "./formula-engine";

function rate(
	result: Extract<ReturnType<typeof calculateMachineFormula>, { readonly ok: true }>,
	direction: "input" | "output",
	portKey: string,
): string {
	const values = direction === "input" ? result.requiredInputs : result.potentialOutputs;
	return Rational.parse(
		values.find((entry) => entry.portKey === portKey)?.ratePerMinute ?? "0",
	).toString();
}

describe("machine formula strategies", () => {
	it("matches Constructor clock, amplification and power golden values", () => {
		const result = calculateMachineFormula({
			buildingId: "Build_ConstructorMk1_C",
			recipeId: "Recipe_IronPlate_C",
			clockPercent: "150",
			powerShardCount: 1,
			somersloopCount: 1,
			somersloopSlots: 1,
			standby: false,
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(rate(result, "input", "input-0")).toBe("45");
		expect(rate(result, "output", "output-0")).toBe("60");
		expect(result.powerMW).toBeCloseTo(4 * 1.5 ** PRODUCTION_POWER_EXPONENT * 4, 10);
		expect(result.provenance).toMatchObject({
			inputRule: "clock",
			outputRule: "clock-x-amplification",
			amplificationMultiplier: { numerator: "2", denominator: "1" },
			sloopPowerMultiplier: { numerator: "4", denominator: "1" },
		});
	});

	it("matches Assembler, Manufacturer and Refinery multi-port golden fixtures", () => {
		const cases = [
			{
				buildingId: "Build_AssemblerMk1_C",
				recipeId: "Recipe_IronPlateReinforced_C",
				clockPercent: "100",
				powerShardCount: 0,
				somersloopCount: 1,
				somersloopSlots: 2,
				expectedInputs: ["30", "60"],
				expectedOutputs: ["15/2"],
				expectedPower: 15 * 2.25,
			},
			{
				buildingId: "Build_ManufacturerMk1_C",
				recipeId: "Recipe_Computer_C",
				clockPercent: "200",
				powerShardCount: 2,
				somersloopCount: 4,
				somersloopSlots: 4,
				expectedInputs: ["20", "40", "80"],
				expectedOutputs: ["10"],
				expectedPower: 55 * 2 ** PRODUCTION_POWER_EXPONENT * 4,
			},
			{
				buildingId: "Build_OilRefinery_C",
				recipeId: "Recipe_LiquidFuel_C",
				clockPercent: "100",
				powerShardCount: 0,
				somersloopCount: 1,
				somersloopSlots: 2,
				expectedInputs: ["60"],
				expectedOutputs: ["60", "45"],
				expectedPower: 30 * 2.25,
			},
		] as const;
		for (const testCase of cases) {
			const result = calculateMachineFormula({ ...testCase, standby: false });
			expect(result.ok, testCase.recipeId).toBe(true);
			if (!result.ok) continue;
			expect(
				result.requiredInputs.map((entry) => Rational.parse(entry.ratePerMinute).toString()),
			).toEqual(testCase.expectedInputs);
			expect(
				result.potentialOutputs.map((entry) => Rational.parse(entry.ratePerMinute).toString()),
			).toEqual(testCase.expectedOutputs);
			expect(result.powerMW).toBeCloseTo(testCase.expectedPower, 9);
		}
	});

	it("returns zero rates and power while a machine is in standby", () => {
		const result = calculateMachineFormula({
			buildingId: "Build_ConstructorMk1_C",
			recipeId: "Recipe_IronRod_C",
			clockPercent: "100",
			powerShardCount: 0,
			somersloopCount: 0,
			somersloopSlots: 1,
			standby: true,
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.powerMW).toBe(0);
		expect(
			result.requiredInputs.every((entry) =>
				Rational.parse(entry.ratePerMinute).equals(Rational.parse("0")),
			),
		).toBe(true);
		expect(
			result.potentialOutputs.every((entry) =>
				Rational.parse(entry.ratePerMinute).equals(Rational.parse("0")),
			),
		).toBe(true);
	});

	it("reports unsupported formulas and invalid settings explicitly", () => {
		expect(
			calculateMachineFormula({
				buildingId: "Build_Unknown_C",
				recipeId: "Recipe_Unknown_C",
				clockPercent: "100",
				powerShardCount: 0,
				somersloopCount: 0,
				somersloopSlots: 0,
				standby: false,
			}),
		).toMatchObject({ ok: false, diagnostic: { code: "UNSUPPORTED_FORMULA" } });
		expect(
			calculateMachineFormula({
				buildingId: "Build_ConstructorMk1_C",
				recipeId: "Recipe_IronRod_C",
				clockPercent: "250",
				powerShardCount: 0,
				somersloopCount: 0,
				somersloopSlots: 1,
				standby: false,
			}),
		).toMatchObject({ ok: false, diagnostic: { code: "INVALID_MACHINE_SETTINGS" } });
	});

	it("keeps the fallback registry deterministic and duplicate-safe", () => {
		const registry = new FormulaStrategyRegistry();
		const descriptor = FALLBACK_PRODUCTION_FORMULAS[0];
		expect(descriptor).toBeDefined();
		if (!descriptor) return;
		registry.register(descriptor);
		expect(() => registry.register(descriptor)).toThrowError(/already registered/);
	});
});
