import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseFactoryPlan } from "./plan-schema";
import { upsertWorkspaceGroup, workspaceGroups } from "./workspace-metadata";

function fixture() {
	const parsed = parseFactoryPlan(
		readFileSync(new URL("./fixtures/factory-plan-v4.json", import.meta.url), "utf8"),
	);
	if (!parsed.ok) throw new Error("Fixture must migrate.");
	return parsed.value;
}

describe("workspace metadata", () => {
	it("stores visual groups without changing calculation graph semantics", () => {
		const plan = fixture();
		const nodeIds = plan.nodes.slice(0, 2).map((node) => node.id);
		const grouped = upsertWorkspaceGroup(plan, {
			id: "group-smelters",
			label: "Smelters",
			note: "Visual workspace note",
			color: "#7c3aed",
			nodeIds,
		});

		expect(grouped.nodes).toBe(plan.nodes);
		expect(grouped.edges).toBe(plan.edges);
		expect(workspaceGroups(grouped)).toEqual([
			{
				id: "group-smelters",
				label: "Smelters",
				note: "Visual workspace note",
				color: "#7c3aed",
				nodeIds,
			},
		]);
	});
});
