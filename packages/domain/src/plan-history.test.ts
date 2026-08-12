import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseFactoryPlan } from "./plan-schema";
import { PlanCommandHistory } from "./plan-history";

function fixture() {
	const parsed = parseFactoryPlan(
		readFileSync(new URL("./fixtures/factory-plan-v4.json", import.meta.url), "utf8"),
	);
	if (!parsed.ok) throw new Error("Fixture must migrate.");
	return parsed.value;
}

describe("plan command history", () => {
	it("undoes and redoes immutable domain commands", () => {
		const initial = fixture();
		const history = new PlanCommandHistory(initial);
		const changed = history.execute("rename", (plan) => ({ ...plan, name: "Changed" }));
		expect(changed.name).toBe("Changed");
		expect(history.undo()).toBe(initial);
		expect(history.redo()).toBe(changed);
	});

	it("groups clock and shard updates into one transaction", () => {
		const history = new PlanCommandHistory(fixture());
		const original = history.current.nodes.find((node) => node.kind === "machine");
		const changed = history.transaction("clock + auto-shard", [
			(plan) => ({
				...plan,
				nodes: plan.nodes.map((node) =>
					node === original ? { ...node, powerShardCount: 1 } : node,
				),
			}),
			(plan) => ({
				...plan,
				nodes: plan.nodes.map((node) =>
					node.id === original?.id && node.kind === "machine"
						? { ...node, clockPercent: "150.0000" }
						: node,
				),
			}),
		]);
		expect(changed.nodes.find((node) => node.id === original?.id)).toMatchObject({
			powerShardCount: 1,
			clockPercent: "150.0000",
		});
		expect(history.undo().nodes.find((node) => node.id === original?.id)).toEqual(original);
		expect(history.state.canUndo).toBe(false);
	});

	it("clears redo after a divergent command and reset starts a new session", () => {
		const history = new PlanCommandHistory(fixture());
		history.execute("one", (plan) => ({ ...plan, name: "One" }));
		history.undo();
		history.execute("two", (plan) => ({ ...plan, name: "Two" }));
		expect(history.state.canRedo).toBe(false);
		history.reset(fixture());
		expect(history.state).toMatchObject({ canUndo: false, canRedo: false });
	});
});
