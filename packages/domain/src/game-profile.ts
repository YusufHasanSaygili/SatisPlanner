import { Rational, type RationalJson } from "./rational";

export const SATISFACTORY_12_PROFILE_VERSION = "1.2" as const;
export const SATISFACTORY_12_SOURCE_URL =
	"https://satisfactory.wiki.gg/wiki/Patch_1.2.0.0" as const;

export const RECIPE_COST_MULTIPLIERS = [
	"0.25",
	"0.50",
	"0.75",
	"1",
	"1.25",
	"1.50",
	"1.75",
	"2",
] as const;
export const POWER_CONSUMPTION_MULTIPLIERS = ["0.25", "0.50", "0.75", "1", "2", "5"] as const;
export const SPACE_ELEVATOR_COST_MULTIPLIERS = [
	"0.25",
	"0.50",
	"0.75",
	"1",
	"2",
	"5",
	"10",
	"25",
	"50",
	"100",
] as const;
export const RESOURCE_RANDOMIZATION_MODES = [
	"default",
	"random",
	"basic-resource-rich",
	"advanced-resource-rich",
	"fossil-fuel-rich",
] as const;
export const RESOURCE_PURITY_MODES = [
	"default",
	"all-pure",
	"mostly-pure",
	"average",
	"mostly-impure",
	"all-impure",
	"random",
] as const;

export type RecipeCostMultiplier = (typeof RECIPE_COST_MULTIPLIERS)[number];
export type PowerConsumptionMultiplier = (typeof POWER_CONSUMPTION_MULTIPLIERS)[number];
export type SpaceElevatorCostMultiplier = (typeof SPACE_ELEVATOR_COST_MULTIPLIERS)[number];
export type ResourceRandomizationMode = (typeof RESOURCE_RANDOMIZATION_MODES)[number];
export type ResourcePurityMode = (typeof RESOURCE_PURITY_MODES)[number];

export interface Satisfactory12GameProfile {
	readonly id: "satisfactory-1.2-default" | "satisfactory-1.2-custom";
	readonly version: typeof SATISFACTORY_12_PROFILE_VERSION;
	readonly kind: "default" | "custom";
	readonly recipePartsCostMultiplier: RecipeCostMultiplier;
	readonly powerConsumptionMultiplier: PowerConsumptionMultiplier;
	readonly spaceElevatorCostMultiplier: SpaceElevatorCostMultiplier;
	readonly resourceNodeRandomization: ResourceRandomizationMode;
	readonly resourceNodePurity: ResourcePurityMode;
	/** Metadata only. SatisPlanner never derives resource coordinates from this seed. */
	readonly worldSeed: string;
	readonly source: {
		readonly kind: "official-1.2-patch-notes";
		readonly url: typeof SATISFACTORY_12_SOURCE_URL;
	};
}

export interface ResolvedGameProfileMultipliers {
	readonly recipePartsCost: RationalJson;
	readonly powerConsumption: RationalJson;
	readonly spaceElevatorCost: RationalJson;
}

export const DEFAULT_SATISFACTORY_12_PROFILE: Satisfactory12GameProfile = Object.freeze({
	id: "satisfactory-1.2-default",
	version: SATISFACTORY_12_PROFILE_VERSION,
	kind: "default",
	recipePartsCostMultiplier: "1",
	powerConsumptionMultiplier: "1",
	spaceElevatorCostMultiplier: "1",
	resourceNodeRandomization: "default",
	resourceNodePurity: "default",
	worldSeed: "0",
	source: {
		kind: "official-1.2-patch-notes" as const,
		url: SATISFACTORY_12_SOURCE_URL,
	},
});

export function createSatisfactory12Profile(
	patch: Partial<Omit<Satisfactory12GameProfile, "id" | "version" | "kind" | "source">> = {},
): Satisfactory12GameProfile {
	const profile = { ...DEFAULT_SATISFACTORY_12_PROFILE, ...patch };
	const custom = Object.entries(patch).some(
		([key, value]) => value !== DEFAULT_SATISFACTORY_12_PROFILE[key as keyof typeof patch],
	);
	return Object.freeze({
		...profile,
		id: custom ? "satisfactory-1.2-custom" : "satisfactory-1.2-default",
		kind: custom ? "custom" : "default",
	});
}

export function resolveGameProfileMultipliers(
	profile: Satisfactory12GameProfile,
): ResolvedGameProfileMultipliers {
	return {
		recipePartsCost: Rational.parse(profile.recipePartsCostMultiplier).toJSON(),
		powerConsumption: Rational.parse(profile.powerConsumptionMultiplier).toJSON(),
		spaceElevatorCost: Rational.parse(profile.spaceElevatorCostMultiplier).toJSON(),
	};
}

export function gameProfileSummary(profile: Satisfactory12GameProfile): string {
	if (profile.kind === "default") return "Vanilla 1.2 · all multipliers ×1";
	return `Custom 1.2 · recipe ×${profile.recipePartsCostMultiplier} · power ×${profile.powerConsumptionMultiplier} · purity ${profile.resourceNodePurity} · nodes ${profile.resourceNodeRandomization} · seed ${profile.worldSeed}`;
}
