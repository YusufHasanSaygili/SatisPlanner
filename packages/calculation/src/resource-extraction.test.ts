import { Rational } from "@satisplanner/domain";
import { describe, expect, it } from "vitest";
import {
	calculateResourceExtraction,
	createLinearExtractionStrategy,
	ExtractionStrategyRegistry,
	extractionStrategyRegistry,
} from "./resource-extraction";

const purityFactors = { impure: "1/2", normal: "1", pure: "2" } as const;
const tiers = { "miner-mk1": "60", "miner-mk2": "120", "miner-mk3": "240" } as const;
const clocks = [
	{ clockPercent: "100", powerShardCount: 0 },
	{ clockPercent: "150", powerShardCount: 1 },
	{ clockPercent: "200", powerShardCount: 2 },
	{ clockPercent: "250", powerShardCount: 3 },
] as const;

describe("resource extraction strategies", () => {
	it("matches the full purity × Miner tier × clock golden matrix", () => {
		for (const [purity, purityFactor] of Object.entries(purityFactors)) {
			for (const [tierId, baseRate] of Object.entries(tiers)) {
				for (const clock of clocks) {
					const result = calculateResourceExtraction({
						strategyId: "miner",
						tierId,
						resourceId: "Desc_OreIron_C",
						materialForm: "solid",
						purity: purity as keyof typeof purityFactors,
						...clock,
					});
					expect(result.ok, `${purity}/${tierId}/${clock.clockPercent}`).toBe(true);
					if (!result.ok) continue;
					const expected = Rational.parse(baseRate)
						.multiply(Rational.parse(purityFactor))
						.multiply(Rational.parse(clock.clockPercent))
						.divide(Rational.parse("100"));
					expect(Rational.parse(result.ratePerMinute).equals(expected)).toBe(true);
					expect(result.unit).toBe("items/min");
				}
			}
		}
	});

	it("produces the required Pure Miner Mk.3 at 250% golden result", () => {
		const result = calculateResourceExtraction({
			strategyId: "miner",
			tierId: "miner-mk3",
			resourceId: "Desc_OreIron_C",
			materialForm: "solid",
			purity: "pure",
			clockPercent: "250.0000",
			powerShardCount: 3,
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.ratePerMinute).toEqual({ numerator: "1200", denominator: "1" });
		expect(result.powerMW).toBeCloseTo(45 * 2.5 ** 1.321928, 8);
		expect(result.provenance).toMatchObject({
			strategyId: "miner",
			tierId: "miner-mk3",
			basePowerMW: 45,
		});
	});

	it("keeps the verified Mk.1–Mk.3 baseline rate and power values data-driven", () => {
		for (const [tierId, expected] of [
			["miner-mk1", { rate: "60", power: 5 }],
			["miner-mk2", { rate: "120", power: 15 }],
			["miner-mk3", { rate: "240", power: 45 }],
		] as const) {
			const result = calculateResourceExtraction({
				strategyId: "miner",
				tierId,
				resourceId: "Desc_Stone_C",
				materialForm: "solid",
				purity: "normal",
				clockPercent: "100",
				powerShardCount: 0,
			});
			expect(result.ok).toBe(true);
			if (!result.ok) continue;
			expect(Rational.parse(result.ratePerMinute).toString()).toBe(expected.rate);
			expect(result.powerMW).toBe(expected.power);
		}
	});

	it("rejects unsupported combinations and invalid shard capacity explicitly", () => {
		const cases = [
			{
				input: { strategyId: "missing", tierId: "miner-mk1" },
				code: "UNKNOWN_STRATEGY",
			},
			{
				input: { strategyId: "miner", tierId: "missing" },
				code: "UNKNOWN_TIER",
			},
			{
				input: { strategyId: "miner", tierId: "miner-mk1", materialForm: "fluid" },
				code: "UNSUPPORTED_MATERIAL_FORM",
			},
			{
				input: {
					strategyId: "miner",
					tierId: "miner-mk1",
					resourceId: "Desc_Wood_C",
				},
				code: "UNSUPPORTED_RESOURCE",
			},
			{
				input: {
					strategyId: "oil-extractor",
					tierId: "oil-extractor",
					materialForm: "fluid",
				},
				code: "UNSUPPORTED_RESOURCE",
			},
			{
				input: { strategyId: "miner", tierId: "miner-mk1", clockPercent: "250" },
				code: "INVALID_CLOCK_OR_SHARDS",
			},
		] as const;
		for (const testCase of cases) {
			const baseInput: Parameters<typeof calculateResourceExtraction>[0] = {
				strategyId: "miner",
				tierId: "miner-mk1",
				resourceId: "Desc_OreIron_C",
				materialForm: "solid",
				purity: "normal",
				clockPercent: "100",
				powerShardCount: 0,
			};
			const result = calculateResourceExtraction({
				...baseInput,
				...testCase.input,
			} as Parameters<typeof calculateResourceExtraction>[0]);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.diagnostic.code).toBe(testCase.code);
		}
	});

	it("registers Oil, Water and resource-well as distinct extensible strategies", () => {
		expect(extractionStrategyRegistry.list().map((entry) => entry.descriptor.id)).toEqual([
			"miner",
			"oil-extractor",
			"water-extractor",
			"resource-well",
		]);
		const well = calculateResourceExtraction({
			strategyId: "resource-well",
			tierId: "resource-well-extractor",
			resourceId: "Desc_NitrogenGas_C",
			materialForm: "fluid",
			purity: "normal",
			clockPercent: "100",
			powerShardCount: 0,
		});
		expect(well).toEqual({
			ok: false,
			diagnostic: {
				code: "STRATEGY_REQUIRES_CONTEXT",
				message: "Resource Well Extractor requires a resource-well pressure context.",
			},
		});

		const registry = new ExtractionStrategyRegistry().register(
			createLinearExtractionStrategy({
				id: "custom",
				displayName: "Custom Extractor",
				materialForm: "solid",
				supportedResourceIds: ["Desc_Custom_C"],
				supportedPurities: ["normal"],
				tiers: [
					{
						id: "custom-1",
						buildingId: "Build_Custom_C",
						displayName: "Custom Mk.1",
						baseRatePerMinute: { numerator: "30", denominator: "1" },
						basePowerMW: 2,
						powerExponent: 1,
					},
				],
			}),
		);
		expect(
			calculateResourceExtraction(
				{
					strategyId: "custom",
					tierId: "custom-1",
					resourceId: "Desc_Custom_C",
					materialForm: "solid",
					purity: "normal",
					clockPercent: "100",
					powerShardCount: 0,
				},
				registry,
			),
		).toMatchObject({ ok: true, ratePerMinute: { numerator: "30", denominator: "1" } });
	});
});
