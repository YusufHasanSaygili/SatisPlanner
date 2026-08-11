import { describe, expect, it } from "vitest";
import type { FactoryPlanV3 } from "./plan-schema";
import {
	getTransportTier,
	minimumTransportTier,
	TRANSPORT_TIERS,
	transportMediumForMaterialForm,
	transportTiersForMedium,
	updateTransportEdgeTier,
} from "./transport";

function transportPlan(): FactoryPlanV3 {
	return {
		schemaVersion: 4,
		planId: "00000000-0000-4000-8000-000000000001",
		name: "Transport test",
		createdAt: "2026-08-11T00:00:00.000Z",
		updatedAt: "2026-08-11T00:00:00.000Z",
		gameDataSnapshotId: "test",
		gameProfile: { id: "satisfactory", version: "1.2" },
		nodes: [],
		edges: [
			{
				id: "00000000-0000-4000-8000-000000000002",
				fromPortId: "00000000-0000-4000-8000-000000000003",
				toPortId: "00000000-0000-4000-8000-000000000004",
				medium: "conveyor",
				transportTierId: "conveyor-mk1",
				itemOrFluidId: "Desc_Coal_C",
				requestedRate: { numerator: "0", denominator: "1" },
				actualRate: { numerator: "0", denominator: "1" },
			},
		],
		viewport: { x: 0, y: 0, zoom: 1 },
		userMetadata: {},
	};
}

describe("versioned transport tier catalog", () => {
	it("contains the exact conveyor and pipeline capacity matrices", () => {
		expect(
			transportTiersForMedium("conveyor").map((tier) => [
				tier.id,
				tier.capacityPerMinute?.numerator,
			]),
		).toEqual([
			["conveyor-mk1", "60"],
			["conveyor-mk2", "120"],
			["conveyor-mk3", "270"],
			["conveyor-mk4", "480"],
			["conveyor-mk5", "780"],
			["conveyor-mk6", "1200"],
		]);
		expect(
			transportTiersForMedium("pipeline").map((tier) => [
				tier.id,
				tier.capacityPerMinute?.numerator,
			]),
		).toEqual([
			["pipeline-mk1", "300"],
			["pipeline-mk2", "600"],
		]);
		expect(TRANSPORT_TIERS).toHaveLength(9);
	});

	it("enforces solid/conveyor and fluid-or-gas/pipeline policy", () => {
		expect(transportMediumForMaterialForm("solid")).toBe("conveyor");
		expect(transportMediumForMaterialForm("fluid")).toBe("pipeline");
		expect(transportMediumForMaterialForm("gas")).toBe("pipeline");
		expect(() =>
			updateTransportEdgeTier(transportPlan(), transportPlan().edges[0]?.id ?? "", "pipeline-mk1"),
		).toThrow(/cannot be used/);
	});

	it("persists tier changes and recommends the smallest sufficient unit-safe tier", () => {
		const edgeId = transportPlan().edges[0]?.id ?? "";
		const updated = updateTransportEdgeTier(transportPlan(), edgeId, "conveyor-mk5");
		expect(updated.edges[0]?.transportTierId).toBe("conveyor-mk5");
		expect(getTransportTier(updated.edges[0]?.transportTierId ?? "")?.capacityUnit).toBe(
			"items/min",
		);
		expect(minimumTransportTier("conveyor", { numerator: "781", denominator: "1" })?.id).toBe(
			"conveyor-mk6",
		);
		expect(minimumTransportTier("pipeline", { numerator: "301", denominator: "1" })?.id).toBe(
			"pipeline-mk2",
		);
	});
});
