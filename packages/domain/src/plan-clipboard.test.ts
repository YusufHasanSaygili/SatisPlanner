import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { copyPlanSubgraph, pastePlanSubgraph } from "./plan-clipboard";
import { parseFactoryPlan } from "./plan-schema";

function fixture() {
	const parsed = parseFactoryPlan(
		readFileSync(new URL("./fixtures/factory-plan-v4.json", import.meta.url), "utf8"),
	);
	if (!parsed.ok) throw new Error("Fixture must migrate.");
	return parsed.value;
}

function uuids() {
	let value = 100;
	return () => `00000000-0000-4000-8000-${String(value++).padStart(12, "0")}`;
}

describe("plan subgraph clipboard", () => {
	it("remaps every UUID, keeps internal edges and excludes external edges", () => {
		const plan = fixture();
		const selectedIds = plan.nodes.map((node) => node.id);
		const payload = copyPlanSubgraph(plan, selectedIds);
		const result = pastePlanSubgraph(plan, payload, uuids());
		expect(result.pastedNodeIds).toHaveLength(2);
		expect(result.pastedEdgeIds).toHaveLength(1);
		expect(new Set(result.plan.nodes.map((node) => node.id)).size).toBe(result.plan.nodes.length);
		expect(
			new Set(result.plan.nodes.flatMap((node) => node.ports.map((port) => port.id))).size,
		).toBe(4);
		const pastedPorts = new Set(
			result.plan.nodes
				.filter((node) => result.pastedNodeIds.includes(node.id))
				.flatMap((node) => node.ports.map((port) => port.id)),
		);
		const pastedEdge = result.plan.edges.find((edge) => result.pastedEdgeIds.includes(edge.id));
		expect(pastedPorts.has(pastedEdge?.fromPortId ?? "")).toBe(true);
		expect(pastedPorts.has(pastedEdge?.toPortId ?? "")).toBe(true);
	});

	it("rejects malformed and external-edge clipboard data", () => {
		const plan = fixture();
		expect(() => pastePlanSubgraph(plan, "not json", uuids())).toThrowError(/valid JSON/);
		const payload = JSON.parse(
			copyPlanSubgraph(
				plan,
				plan.nodes.map((node) => node.id),
			),
		) as { edges: Array<Record<string, unknown>> };
		if (payload.edges[0]) payload.edges[0].toPortId = "00000000-0000-4000-8000-999999999999";
		expect(() => pastePlanSubgraph(plan, JSON.stringify(payload), uuids())).toThrowError(
			/external/,
		);
	});
});
