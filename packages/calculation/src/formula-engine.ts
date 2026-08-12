import { ClockPercent, Rational, type RationalJson } from "@satisplanner/domain";
import { calculateSomersloopMultiplier } from "./somersloop";

export const PRODUCTION_POWER_EXPONENT = 1.321928;
export const FALLBACK_FORMULA_CATALOG_VERSION = "fallback-formula-catalog-v1" as const;

export interface FormulaMaterialRate {
	readonly portKey: string;
	readonly materialId: string;
	readonly ratePerMinute: RationalJson;
}

export interface ProductionFormulaDescriptor {
	readonly id: string;
	readonly buildingId: string;
	readonly recipeId: string;
	readonly displayName: string;
	readonly basePowerMW: number;
	readonly powerExponent: number;
	readonly inputs: readonly FormulaMaterialRate[];
	readonly outputs: readonly FormulaMaterialRate[];
}

export interface MachineFormulaInput {
	readonly buildingId: string;
	readonly recipeId: string;
	readonly clockPercent: string;
	readonly powerShardCount: number;
	readonly somersloopCount: number;
	readonly somersloopSlots: number;
	readonly standby: boolean;
	readonly recipePartsCostMultiplier?: RationalJson;
	readonly powerConsumptionMultiplier?: RationalJson;
}

export interface MachineFormulaProvenance {
	readonly strategyId: string;
	readonly formulaId: string;
	readonly catalogVersion: string;
	readonly clockMultiplier: RationalJson;
	readonly amplificationMultiplier: RationalJson;
	readonly sloopPowerMultiplier: RationalJson;
	readonly basePowerMW: number;
	readonly powerExponent: number;
	readonly recipePartsCostMultiplier: RationalJson;
	readonly powerConsumptionMultiplier: RationalJson;
	readonly inputRule: "clock-x-recipe-cost";
	readonly outputRule: "clock-x-amplification";
	readonly powerRule: "clock-exponent-x-amplification-x-profile";
}

export type FormulaDiagnosticCode =
	| "UNSUPPORTED_FORMULA"
	| "INVALID_MACHINE_SETTINGS"
	| "INVALID_FORMULA_DESCRIPTOR";

export interface FormulaDiagnostic {
	readonly code: FormulaDiagnosticCode;
	readonly message: string;
}

export type MachineFormulaResult =
	| {
			readonly ok: true;
			readonly requiredInputs: readonly FormulaMaterialRate[];
			readonly potentialOutputs: readonly FormulaMaterialRate[];
			readonly powerMW: number;
			readonly provenance: MachineFormulaProvenance;
	  }
	| { readonly ok: false; readonly diagnostic: FormulaDiagnostic };

export interface MachineFormulaStrategy {
	readonly id: string;
	readonly kind: "production" | "extractor" | "generator" | "variable-power";
	calculate(input: MachineFormulaInput): MachineFormulaResult;
}

export interface GeneratorFormulaStrategy extends MachineFormulaStrategy {
	readonly kind: "generator";
}

export interface VariablePowerFormulaStrategy extends MachineFormulaStrategy {
	readonly kind: "variable-power";
}

function formulaKey(buildingId: string, recipeId: string): string {
	return `${buildingId}\u0000${recipeId}`;
}

function scaleRates(
	rates: readonly FormulaMaterialRate[],
	multiplier: Rational,
): readonly FormulaMaterialRate[] {
	return rates.map((rate) => ({
		...rate,
		ratePerMinute: Rational.parse(rate.ratePerMinute).multiply(multiplier).toJSON(),
	}));
}

function validateDescriptor(
	descriptor: ProductionFormulaDescriptor,
): FormulaDiagnostic | undefined {
	if (
		descriptor.id.trim().length === 0 ||
		descriptor.buildingId.trim().length === 0 ||
		descriptor.recipeId.trim().length === 0 ||
		!Number.isFinite(descriptor.basePowerMW) ||
		descriptor.basePowerMW < 0 ||
		!Number.isFinite(descriptor.powerExponent) ||
		descriptor.powerExponent <= 0
	) {
		return {
			code: "INVALID_FORMULA_DESCRIPTOR",
			message: `Formula ${descriptor.id || "<unknown>"} has invalid identity or power values.`,
		};
	}
	const keys = new Set<string>();
	for (const rate of [...descriptor.inputs, ...descriptor.outputs]) {
		if (rate.portKey.trim().length === 0 || rate.materialId.trim().length === 0) {
			return {
				code: "INVALID_FORMULA_DESCRIPTOR",
				message: `Formula ${descriptor.id} contains an empty port or material identifier.`,
			};
		}
		const directionKey = `${descriptor.inputs.includes(rate) ? "input" : "output"}:${rate.portKey}`;
		if (
			keys.has(directionKey) ||
			Rational.parse(rate.ratePerMinute).compare(Rational.parse("0")) < 0
		) {
			return {
				code: "INVALID_FORMULA_DESCRIPTOR",
				message: `Formula ${descriptor.id} contains a duplicate port or negative rate.`,
			};
		}
		keys.add(directionKey);
	}
	return undefined;
}

export function createProductionFormulaStrategy(
	descriptor: ProductionFormulaDescriptor,
): MachineFormulaStrategy {
	const descriptorDiagnostic = validateDescriptor(descriptor);
	return Object.freeze({
		id: descriptor.id,
		kind: "production" as const,
		calculate(input: MachineFormulaInput): MachineFormulaResult {
			if (descriptorDiagnostic) return { ok: false, diagnostic: descriptorDiagnostic };
			try {
				if (input.buildingId !== descriptor.buildingId || input.recipeId !== descriptor.recipeId) {
					return {
						ok: false,
						diagnostic: {
							code: "UNSUPPORTED_FORMULA",
							message: `${descriptor.id} cannot calculate ${input.buildingId}/${input.recipeId}.`,
						},
					};
				}
				if (
					!Number.isInteger(input.powerShardCount) ||
					input.powerShardCount < 0 ||
					input.powerShardCount > 3
				) {
					throw new RangeError("Power shard count must be between 0 and 3.");
				}
				const clock = ClockPercent.parse(input.clockPercent);
				if (clock.compare(ClockPercent.maximumForShardCount(input.powerShardCount)) > 0) {
					throw new RangeError("Clock exceeds the selected Power Shard capacity.");
				}
				const clockMultiplier = Rational.parse(clock.toJSON()).divide(Rational.parse("100"));
				const amplificationMultiplier = Rational.parse(
					calculateSomersloopMultiplier(input.somersloopCount, input.somersloopSlots),
				);
				const sloopPowerMultiplier = amplificationMultiplier.multiply(amplificationMultiplier);
				const recipePartsCostMultiplier = Rational.parse(input.recipePartsCostMultiplier ?? "1");
				const powerConsumptionMultiplier = Rational.parse(input.powerConsumptionMultiplier ?? "1");
				const clockFactor = Number(clock.scaledValue) / 1_000_000;
				return {
					ok: true,
					requiredInputs: input.standby
						? scaleRates(descriptor.inputs, Rational.parse("0"))
						: scaleRates(descriptor.inputs, clockMultiplier.multiply(recipePartsCostMultiplier)),
					potentialOutputs: input.standby
						? scaleRates(descriptor.outputs, Rational.parse("0"))
						: scaleRates(descriptor.outputs, clockMultiplier.multiply(amplificationMultiplier)),
					powerMW: input.standby
						? 0
						: descriptor.basePowerMW *
							clockFactor ** descriptor.powerExponent *
							Number(sloopPowerMultiplier.toDecimal(12)) *
							Number(powerConsumptionMultiplier.toDecimal(12)),
					provenance: {
						strategyId: "production-machine",
						formulaId: descriptor.id,
						catalogVersion: FALLBACK_FORMULA_CATALOG_VERSION,
						clockMultiplier: clockMultiplier.toJSON(),
						amplificationMultiplier: amplificationMultiplier.toJSON(),
						sloopPowerMultiplier: sloopPowerMultiplier.toJSON(),
						basePowerMW: descriptor.basePowerMW,
						powerExponent: descriptor.powerExponent,
						recipePartsCostMultiplier: recipePartsCostMultiplier.toJSON(),
						powerConsumptionMultiplier: powerConsumptionMultiplier.toJSON(),
						inputRule: "clock-x-recipe-cost",
						outputRule: "clock-x-amplification",
						powerRule: "clock-exponent-x-amplification-x-profile",
					},
				};
			} catch (error) {
				return {
					ok: false,
					diagnostic: {
						code: "INVALID_MACHINE_SETTINGS",
						message: error instanceof Error ? error.message : "Machine settings are invalid.",
					},
				};
			}
		},
	});
}

export class FormulaStrategyRegistry {
	readonly #strategies = new Map<string, MachineFormulaStrategy>();

	register(
		descriptor: ProductionFormulaDescriptor,
		strategy = createProductionFormulaStrategy(descriptor),
	): this {
		const key = formulaKey(descriptor.buildingId, descriptor.recipeId);
		if (this.#strategies.has(key)) {
			throw new Error(
				`Formula for ${descriptor.buildingId}/${descriptor.recipeId} is already registered.`,
			);
		}
		this.#strategies.set(key, strategy);
		return this;
	}

	get(buildingId: string, recipeId: string): MachineFormulaStrategy | undefined {
		return this.#strategies.get(formulaKey(buildingId, recipeId));
	}

	calculate(input: MachineFormulaInput): MachineFormulaResult {
		const strategy = this.get(input.buildingId, input.recipeId);
		if (!strategy) {
			return {
				ok: false,
				diagnostic: {
					code: "UNSUPPORTED_FORMULA",
					message: `No formula is registered for ${input.buildingId}/${input.recipeId}.`,
				},
			};
		}
		return strategy.calculate(input);
	}

	list(): readonly MachineFormulaStrategy[] {
		return [...this.#strategies.values()].sort((left, right) => left.id.localeCompare(right.id));
	}
}

function rate(portKey: string, materialId: string, value: string): FormulaMaterialRate {
	return { portKey, materialId, ratePerMinute: Rational.parse(value).toJSON() };
}

export const FALLBACK_PRODUCTION_FORMULAS: readonly ProductionFormulaDescriptor[] = [
	{
		id: "smelter-iron-ingot",
		buildingId: "Build_SmelterMk1_C",
		recipeId: "Recipe_IronIngot_C",
		displayName: "Iron Ingot",
		basePowerMW: 4,
		powerExponent: PRODUCTION_POWER_EXPONENT,
		inputs: [rate("input-0", "Desc_OreIron_C", "30")],
		outputs: [rate("output-0", "Desc_IronIngot_C", "30")],
	},
	{
		id: "constructor-iron-plate",
		buildingId: "Build_ConstructorMk1_C",
		recipeId: "Recipe_IronPlate_C",
		displayName: "Iron Plate",
		basePowerMW: 4,
		powerExponent: PRODUCTION_POWER_EXPONENT,
		inputs: [rate("input-0", "Desc_IronIngot_C", "30")],
		outputs: [rate("output-0", "Desc_IronPlate_C", "20")],
	},
	{
		id: "constructor-iron-rod",
		buildingId: "Build_ConstructorMk1_C",
		recipeId: "Recipe_IronRod_C",
		displayName: "Iron Rod",
		basePowerMW: 4,
		powerExponent: PRODUCTION_POWER_EXPONENT,
		inputs: [rate("input-0", "Desc_IronIngot_C", "15")],
		outputs: [rate("output-0", "Desc_IronRod_C", "15")],
	},
	{
		id: "foundry-steel-ingot",
		buildingId: "Build_FoundryMk1_C",
		recipeId: "Recipe_IngotSteel_C",
		displayName: "Steel Ingot",
		basePowerMW: 16,
		powerExponent: PRODUCTION_POWER_EXPONENT,
		inputs: [rate("input-0", "Desc_OreIron_C", "45"), rate("input-1", "Desc_Coal_C", "45")],
		outputs: [rate("output-0", "Desc_SteelIngot_C", "45")],
	},
	{
		id: "foundry-aluminum-ingot",
		buildingId: "Build_FoundryMk1_C",
		recipeId: "Recipe_IngotAluminum_C",
		displayName: "Aluminum Ingot",
		basePowerMW: 16,
		powerExponent: PRODUCTION_POWER_EXPONENT,
		inputs: [rate("input-0", "Desc_AluminumScrap_C", "90"), rate("input-1", "Desc_Silica_C", "75")],
		outputs: [rate("output-0", "Desc_AluminumIngot_C", "60")],
	},
	{
		id: "assembler-reinforced-iron-plate",
		buildingId: "Build_AssemblerMk1_C",
		recipeId: "Recipe_IronPlateReinforced_C",
		displayName: "Reinforced Iron Plate",
		basePowerMW: 15,
		powerExponent: PRODUCTION_POWER_EXPONENT,
		inputs: [rate("input-0", "Desc_IronPlate_C", "30"), rate("input-1", "Desc_IronScrew_C", "60")],
		outputs: [rate("output-0", "Desc_IronPlateReinforced_C", "5")],
	},
	{
		id: "assembler-rotor",
		buildingId: "Build_AssemblerMk1_C",
		recipeId: "Recipe_Rotor_C",
		displayName: "Rotor",
		basePowerMW: 15,
		powerExponent: PRODUCTION_POWER_EXPONENT,
		inputs: [rate("input-0", "Desc_IronRod_C", "20"), rate("input-1", "Desc_IronScrew_C", "100")],
		outputs: [rate("output-0", "Desc_Rotor_C", "4")],
	},
	{
		id: "manufacturer-computer",
		buildingId: "Build_ManufacturerMk1_C",
		recipeId: "Recipe_Computer_C",
		displayName: "Computer",
		basePowerMW: 55,
		powerExponent: PRODUCTION_POWER_EXPONENT,
		inputs: [
			rate("input-0", "Desc_CircuitBoard_C", "10"),
			rate("input-1", "Desc_Cable_C", "20"),
			rate("input-2", "Desc_Plastic_C", "40"),
		],
		outputs: [rate("output-0", "Desc_Computer_C", "5/2")],
	},
	{
		id: "manufacturer-heavy-modular-frame",
		buildingId: "Build_ManufacturerMk1_C",
		recipeId: "Recipe_ModularFrameHeavy_C",
		displayName: "Heavy Modular Frame",
		basePowerMW: 55,
		powerExponent: PRODUCTION_POWER_EXPONENT,
		inputs: [
			rate("input-0", "Desc_ModularFrame_C", "10"),
			rate("input-1", "Desc_SteelPipe_C", "30"),
			rate("input-2", "Desc_SteelPlateReinforced_C", "10"),
			rate("input-3", "Desc_IronScrew_C", "200"),
		],
		outputs: [rate("output-0", "Desc_ModularFrameHeavy_C", "2")],
	},
	{
		id: "refinery-fuel",
		buildingId: "Build_OilRefinery_C",
		recipeId: "Recipe_LiquidFuel_C",
		displayName: "Fuel",
		basePowerMW: 30,
		powerExponent: PRODUCTION_POWER_EXPONENT,
		inputs: [rate("input-0", "Desc_LiquidOil_C", "60")],
		outputs: [
			rate("output-0", "Desc_LiquidFuel_C", "40"),
			rate("output-1", "Desc_PolymerResin_C", "30"),
		],
	},
];

export const formulaStrategyRegistry = FALLBACK_PRODUCTION_FORMULAS.reduce(
	(registry, descriptor) => registry.register(descriptor),
	new FormulaStrategyRegistry(),
);

export function calculateMachineFormula(
	input: MachineFormulaInput,
	registry: FormulaStrategyRegistry = formulaStrategyRegistry,
): MachineFormulaResult {
	return registry.calculate(input);
}
