import { DomainValidationError } from "./errors";
import type { FactoryPlanV3, TransportEdgeV3 } from "./plan-schema";
import { Rational, type RationalJson } from "./rational";

export type TransportMedium = "conveyor" | "pipeline" | "virtual";
export type TransportMaterialForm = "solid" | "fluid" | "gas";

export interface TransportTierDescriptor {
	readonly id: string;
	readonly label: string;
	readonly medium: TransportMedium;
	readonly capacityPerMinute: RationalJson | null;
	readonly capacityUnit: "items/min" | "m³/min" | "unlimited";
}

const rate = (value: string): RationalJson => Rational.parse(value).toJSON();

export const TRANSPORT_TIERS: readonly TransportTierDescriptor[] = Object.freeze([
	{
		id: "conveyor-mk1",
		label: "Conveyor Mk.1",
		medium: "conveyor",
		capacityPerMinute: rate("60"),
		capacityUnit: "items/min",
	},
	{
		id: "conveyor-mk2",
		label: "Conveyor Mk.2",
		medium: "conveyor",
		capacityPerMinute: rate("120"),
		capacityUnit: "items/min",
	},
	{
		id: "conveyor-mk3",
		label: "Conveyor Mk.3",
		medium: "conveyor",
		capacityPerMinute: rate("270"),
		capacityUnit: "items/min",
	},
	{
		id: "conveyor-mk4",
		label: "Conveyor Mk.4",
		medium: "conveyor",
		capacityPerMinute: rate("480"),
		capacityUnit: "items/min",
	},
	{
		id: "conveyor-mk5",
		label: "Conveyor Mk.5",
		medium: "conveyor",
		capacityPerMinute: rate("780"),
		capacityUnit: "items/min",
	},
	{
		id: "conveyor-mk6",
		label: "Conveyor Mk.6",
		medium: "conveyor",
		capacityPerMinute: rate("1200"),
		capacityUnit: "items/min",
	},
	{
		id: "pipeline-mk1",
		label: "Pipeline Mk.1",
		medium: "pipeline",
		capacityPerMinute: rate("300"),
		capacityUnit: "m³/min",
	},
	{
		id: "pipeline-mk2",
		label: "Pipeline Mk.2",
		medium: "pipeline",
		capacityPerMinute: rate("600"),
		capacityUnit: "m³/min",
	},
	{
		id: "virtual-unlimited",
		label: "Virtual link",
		medium: "virtual",
		capacityPerMinute: null,
		capacityUnit: "unlimited",
	},
]);

const tiersById = new Map(TRANSPORT_TIERS.map((tier) => [tier.id, tier] as const));

export function transportMediumForMaterialForm(form: TransportMaterialForm): TransportMedium {
	return form === "solid" ? "conveyor" : "pipeline";
}

export function transportTiersForMedium(
	medium: TransportMedium,
): readonly TransportTierDescriptor[] {
	return TRANSPORT_TIERS.filter((tier) => tier.medium === medium);
}

export function getTransportTier(tierId: string): TransportTierDescriptor | undefined {
	return tiersById.get(tierId);
}

export function defaultTransportTierId(medium: TransportMedium): string {
	if (medium === "conveyor") return "conveyor-mk1";
	if (medium === "pipeline") return "pipeline-mk1";
	return "virtual-unlimited";
}

export function requireTransportTier(
	tierId: string,
	medium?: TransportMedium,
): TransportTierDescriptor {
	const tier = getTransportTier(tierId);
	if (!tier) throw new DomainValidationError("INVALID_PLAN", `Unknown transport tier ${tierId}.`);
	if (medium && tier.medium !== medium) {
		throw new DomainValidationError(
			"INVALID_PLAN",
			`${tier.label} cannot be used for ${medium} transport.`,
		);
	}
	return tier;
}

export function minimumTransportTier(
	medium: TransportMedium,
	requiredRate: RationalJson,
): TransportTierDescriptor | undefined {
	const required = Rational.parse(requiredRate);
	return transportTiersForMedium(medium).find(
		(tier) =>
			tier.capacityPerMinute === null ||
			Rational.parse(tier.capacityPerMinute).compare(required) >= 0,
	);
}

export function updateTransportEdgeTier(
	plan: FactoryPlanV3,
	edgeId: string,
	tierId: string,
): FactoryPlanV3 {
	const edge = plan.edges.find((candidate) => candidate.id === edgeId);
	if (!edge)
		throw new DomainValidationError("INVALID_PLAN", `Transport edge ${edgeId} was not found.`);
	requireTransportTier(tierId, edge.medium);
	const updatedAt = new Date(Math.max(Date.now(), Date.parse(plan.updatedAt) + 1)).toISOString();
	return {
		...plan,
		updatedAt,
		edges: plan.edges.map(
			(candidate): TransportEdgeV3 =>
				candidate.id === edgeId ? { ...candidate, transportTierId: tierId } : candidate,
		),
	};
}
