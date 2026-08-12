import {
	ClockPercent,
	Rational,
	type RationalJson,
	type ResourcePurity,
} from "@satisplanner/domain";

export interface ExtractorTierDescriptor {
	readonly id: string;
	readonly buildingId: string;
	readonly displayName: string;
	readonly baseRatePerMinute: RationalJson;
	readonly basePowerMW: number;
	readonly powerExponent: number;
}

export interface ExtractionStrategyDescriptor {
	readonly id: string;
	readonly displayName: string;
	readonly materialForm: "solid" | "fluid";
	readonly supportedResourceIds: "*" | readonly string[];
	readonly supportedPurities: readonly ResourcePurity[];
	readonly tiers: readonly ExtractorTierDescriptor[];
}

export interface ExtractionInput {
	readonly strategyId: string;
	readonly tierId: string;
	readonly resourceId: string;
	readonly materialForm: "solid" | "fluid";
	readonly purity: ResourcePurity;
	readonly clockPercent: string;
	readonly powerShardCount: number;
	readonly powerConsumptionMultiplier?: RationalJson;
}

export interface ExtractionProvenance {
	readonly strategyId: string;
	readonly tierId: string;
	readonly baseRatePerMinute: RationalJson;
	readonly purityMultiplier: RationalJson;
	readonly clockMultiplier: RationalJson;
	readonly basePowerMW: number;
	readonly powerExponent: number;
	readonly powerConsumptionMultiplier: RationalJson;
	readonly powerRule: "clock-exponent-x-profile";
}

export type ExtractionDiagnosticCode =
	| "UNKNOWN_STRATEGY"
	| "UNKNOWN_TIER"
	| "UNSUPPORTED_RESOURCE"
	| "UNSUPPORTED_MATERIAL_FORM"
	| "UNSUPPORTED_PURITY"
	| "INVALID_CLOCK_OR_SHARDS"
	| "STRATEGY_REQUIRES_CONTEXT";

export interface ExtractionDiagnostic {
	readonly code: ExtractionDiagnosticCode;
	readonly message: string;
}

export type ExtractionResult =
	| {
			readonly ok: true;
			readonly ratePerMinute: RationalJson;
			readonly unit: "items/min" | "m³/min";
			readonly powerMW: number;
			readonly provenance: ExtractionProvenance;
	  }
	| { readonly ok: false; readonly diagnostic: ExtractionDiagnostic };

export interface ExtractionStrategy {
	readonly descriptor: ExtractionStrategyDescriptor;
	calculate(input: ExtractionInput): ExtractionResult;
}

const PURITY_MULTIPLIERS: Readonly<Record<ResourcePurity, Rational>> = {
	impure: Rational.parse("1/2"),
	normal: Rational.parse("1"),
	pure: Rational.parse("2"),
};

function validateSharedInput(
	descriptor: ExtractionStrategyDescriptor,
	input: ExtractionInput,
): { readonly tier: ExtractorTierDescriptor; readonly clock: ClockPercent } | ExtractionResult {
	if (input.materialForm !== descriptor.materialForm) {
		return {
			ok: false,
			diagnostic: {
				code: "UNSUPPORTED_MATERIAL_FORM",
				message: `${descriptor.displayName} does not support ${input.materialForm} resources.`,
			},
		};
	}
	if (
		descriptor.supportedResourceIds !== "*" &&
		!descriptor.supportedResourceIds.includes(input.resourceId)
	) {
		return {
			ok: false,
			diagnostic: {
				code: "UNSUPPORTED_RESOURCE",
				message: `${input.resourceId} is not supported by ${descriptor.displayName}.`,
			},
		};
	}
	if (!descriptor.supportedPurities.includes(input.purity)) {
		return {
			ok: false,
			diagnostic: {
				code: "UNSUPPORTED_PURITY",
				message: `${descriptor.displayName} does not support ${input.purity} purity.`,
			},
		};
	}
	const tier = descriptor.tiers.find((candidate) => candidate.id === input.tierId);
	if (!tier) {
		return {
			ok: false,
			diagnostic: {
				code: "UNKNOWN_TIER",
				message: `${input.tierId} is not a tier of ${descriptor.displayName}.`,
			},
		};
	}
	try {
		if (
			!Number.isInteger(input.powerShardCount) ||
			input.powerShardCount < 0 ||
			input.powerShardCount > 3
		) {
			throw new Error("Power shard count must be between 0 and 3.");
		}
		const clock = ClockPercent.parse(input.clockPercent);
		if (clock.compare(ClockPercent.maximumForShardCount(input.powerShardCount)) > 0) {
			throw new Error("Clock exceeds the selected Power Shard capacity.");
		}
		return { tier, clock };
	} catch (error) {
		return {
			ok: false,
			diagnostic: {
				code: "INVALID_CLOCK_OR_SHARDS",
				message: error instanceof Error ? error.message : "Invalid clock or Power Shard selection.",
			},
		};
	}
}

export function createLinearExtractionStrategy(
	descriptor: ExtractionStrategyDescriptor,
): ExtractionStrategy {
	return Object.freeze({
		descriptor,
		calculate(input: ExtractionInput): ExtractionResult {
			const validated = validateSharedInput(descriptor, input);
			if ("ok" in validated) return validated;
			const purityMultiplier = PURITY_MULTIPLIERS[input.purity];
			const clockMultiplier = Rational.parse(validated.clock.toJSON()).divide(
				Rational.parse("100"),
			);
			const rate = Rational.parse(validated.tier.baseRatePerMinute)
				.multiply(purityMultiplier)
				.multiply(clockMultiplier);
			const clockFactor = Number(validated.clock.scaledValue) / 1_000_000;
			return {
				ok: true,
				ratePerMinute: rate.toJSON(),
				unit: descriptor.materialForm === "solid" ? "items/min" : "m³/min",
				powerMW:
					validated.tier.basePowerMW *
					clockFactor ** validated.tier.powerExponent *
					Number(Rational.parse(input.powerConsumptionMultiplier ?? "1").toDecimal(12)),
				provenance: {
					strategyId: descriptor.id,
					tierId: validated.tier.id,
					baseRatePerMinute: validated.tier.baseRatePerMinute,
					purityMultiplier: purityMultiplier.toJSON(),
					clockMultiplier: clockMultiplier.toJSON(),
					basePowerMW: validated.tier.basePowerMW,
					powerExponent: validated.tier.powerExponent,
					powerConsumptionMultiplier: Rational.parse(
						input.powerConsumptionMultiplier ?? "1",
					).toJSON(),
					powerRule: "clock-exponent-x-profile",
				},
			};
		},
	});
}

export function createContextRequiredExtractionStrategy(
	descriptor: ExtractionStrategyDescriptor,
): ExtractionStrategy {
	return Object.freeze({
		descriptor,
		calculate(input: ExtractionInput): ExtractionResult {
			const validated = validateSharedInput(descriptor, input);
			if ("ok" in validated) return validated;
			return {
				ok: false,
				diagnostic: {
					code: "STRATEGY_REQUIRES_CONTEXT",
					message: `${descriptor.displayName} requires a resource-well pressure context.`,
				},
			};
		},
	});
}

const MINER_TIERS: readonly ExtractorTierDescriptor[] = [
	{
		id: "miner-mk1",
		buildingId: "Build_MinerMk1_C",
		displayName: "Miner Mk.1",
		baseRatePerMinute: { numerator: "60", denominator: "1" },
		basePowerMW: 5,
		powerExponent: 1.321928,
	},
	{
		id: "miner-mk2",
		buildingId: "Build_MinerMk2_C",
		displayName: "Miner Mk.2",
		baseRatePerMinute: { numerator: "120", denominator: "1" },
		basePowerMW: 15,
		powerExponent: 1.321928,
	},
	{
		id: "miner-mk3",
		buildingId: "Build_MinerMk3_C",
		displayName: "Miner Mk.3",
		baseRatePerMinute: { numerator: "240", denominator: "1" },
		basePowerMW: 45,
		powerExponent: 1.321928,
	},
];

export const MINER_EXTRACTION_STRATEGY = createLinearExtractionStrategy({
	id: "miner",
	displayName: "Miner",
	materialForm: "solid",
	supportedResourceIds: [
		"Desc_OreIron_C",
		"Desc_OreCopper_C",
		"Desc_Stone_C",
		"Desc_Coal_C",
		"Desc_OreGold_C",
		"Desc_Sulfur_C",
		"Desc_RawQuartz_C",
		"Desc_OreBauxite_C",
		"Desc_OreUranium_C",
		"Desc_SAM_C",
	],
	supportedPurities: ["impure", "normal", "pure"],
	tiers: MINER_TIERS,
});

export const OIL_EXTRACTION_STRATEGY = createLinearExtractionStrategy({
	id: "oil-extractor",
	displayName: "Oil Extractor",
	materialForm: "fluid",
	supportedResourceIds: ["Desc_LiquidOil_C"],
	supportedPurities: ["impure", "normal", "pure"],
	tiers: [
		{
			id: "oil-extractor",
			buildingId: "Build_OilPump_C",
			displayName: "Oil Extractor",
			baseRatePerMinute: { numerator: "120", denominator: "1" },
			basePowerMW: 40,
			powerExponent: 1.321928,
		},
	],
});

export const WATER_EXTRACTION_STRATEGY = createLinearExtractionStrategy({
	id: "water-extractor",
	displayName: "Water Extractor",
	materialForm: "fluid",
	supportedResourceIds: ["Desc_Water_C"],
	supportedPurities: ["normal"],
	tiers: [
		{
			id: "water-extractor",
			buildingId: "Build_WaterPump_C",
			displayName: "Water Extractor",
			baseRatePerMinute: { numerator: "120", denominator: "1" },
			basePowerMW: 20,
			powerExponent: 1.321928,
		},
	],
});

export const RESOURCE_WELL_EXTRACTION_STRATEGY = createContextRequiredExtractionStrategy({
	id: "resource-well",
	displayName: "Resource Well Extractor",
	materialForm: "fluid",
	supportedResourceIds: ["Desc_LiquidOil_C", "Desc_Water_C", "Desc_NitrogenGas_C"],
	supportedPurities: ["normal"],
	tiers: [
		{
			id: "resource-well-extractor",
			buildingId: "Build_FrackingExtractor_C",
			displayName: "Resource Well Extractor",
			baseRatePerMinute: { numerator: "0", denominator: "1" },
			basePowerMW: 0,
			powerExponent: 1.321928,
		},
	],
});

export class ExtractionStrategyRegistry {
	readonly #strategies = new Map<string, ExtractionStrategy>();

	register(strategy: ExtractionStrategy): this {
		if (this.#strategies.has(strategy.descriptor.id)) {
			throw new Error(`Extraction strategy ${strategy.descriptor.id} is already registered.`);
		}
		this.#strategies.set(strategy.descriptor.id, strategy);
		return this;
	}

	get(strategyId: string): ExtractionStrategy | undefined {
		return this.#strategies.get(strategyId);
	}

	list(): readonly ExtractionStrategy[] {
		return [...this.#strategies.values()];
	}
}

export const extractionStrategyRegistry = new ExtractionStrategyRegistry()
	.register(MINER_EXTRACTION_STRATEGY)
	.register(OIL_EXTRACTION_STRATEGY)
	.register(WATER_EXTRACTION_STRATEGY)
	.register(RESOURCE_WELL_EXTRACTION_STRATEGY);

export function calculateResourceExtraction(
	input: ExtractionInput,
	registry: ExtractionStrategyRegistry = extractionStrategyRegistry,
): ExtractionResult {
	const strategy = registry.get(input.strategyId);
	if (!strategy) {
		return {
			ok: false,
			diagnostic: {
				code: "UNKNOWN_STRATEGY",
				message: `Unknown extraction strategy: ${input.strategyId}.`,
			},
		};
	}
	return strategy.calculate(input);
}
