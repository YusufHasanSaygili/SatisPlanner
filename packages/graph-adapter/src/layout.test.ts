import { DEFAULT_SATISFACTORY_12_PROFILE, type FactoryPlanV3 } from "@satisplanner/domain";
import { describe, expect, it } from "vitest";
import { autoLayoutFactoryPlan } from "./layout";

function plan(size: number): FactoryPlanV3 {
	return {
		schemaVersion: 6,
		planId: "00000000-0000-4000-8000-000000000001",
		name: "Layout fixture",
		createdAt: "2026-08-12T00:00:00.000Z",
		updatedAt: "2026-08-12T00:00:00.000Z",
		gameDataSnapshotId: "test",
		gameProfile: DEFAULT_SATISFACTORY_12_PROFILE,
		localization: { uiLocale: "en", gameDataLocale: "en-US", gameDataFallbackLocale: "en-US" },
		nodes: Array.from({ length: size }, (_, index) => ({
			kind: "resource" as const,
			id: `00000000-0000-4000-8000-${String(index + 10).padStart(12, "0")}`,
			resourceId: "Desc_OreIron_C",
			displayName: `Source ${index}`,
			purity: "normal" as const,
			extractorStrategyId: "miner",
			extractorTierId: "miner-mk1",
			clockPercent: "100",
			powerShardCount: 0,
			position: { x: index * 3, y: index * 2 },
			ports: [
				{
					id: `10000000-0000-4000-8000-${String(index + 10).padStart(12, "0")}`,
					key: "output-0",
					direction: "output" as const,
					materialForm: "solid" as const,
					materialId: "Desc_OreIron_C",
				},
			],
		})),
		edges: [],
		viewport: { x: 0, y: 0, zoom: 1 },
		userMetadata: {},
	};
}

describe("explicit auto layout", () => {
	it("is deterministic and preserves locked manual nodes", () => {
		const input = plan(4);
		const locked = input.nodes[1];
		const first = autoLayoutFactoryPlan(input, { lockedNodeIds: new Set([locked?.id ?? ""]) });
		const second = autoLayoutFactoryPlan(input, { lockedNodeIds: new Set([locked?.id ?? ""]) });
		expect(first.nodes.map((node) => node.position)).toEqual(
			second.nodes.map((node) => node.position),
		);
		expect(first.nodes[1]?.position).toEqual(locked?.position);
		expect(first.nodes[0]?.position).toEqual({ x: 80, y: 80 });
	});

	it("lays out 500 nodes without blocking-scale work", () => {
		const started = performance.now();
		const result = autoLayoutFactoryPlan(plan(500));
		expect(result.nodes).toHaveLength(500);
		expect(performance.now() - started).toBeLessThan(250);
	});
});
