import { describe, expect, it } from "vitest";
import { applyCommand, createMachineId, createPlan } from "./domain";

describe("typed domain command", () => {
	it("updates exactly one physical machine instance without mutating the source plan", () => {
		const source = createPlan(200);
		const result = applyCommand(source, {
			type: "machine.set-clock",
			machineId: createMachineId(137),
			clockPercent: 200,
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.plan).not.toBe(source);
		expect(source.machines[137].clockPercent).toBe(100);
		expect(result.plan.machines[137].clockPercent).toBe(200);
		expect(
			result.plan.machines.filter((machine) => machine.clockPercent !== 100),
		).toHaveLength(1);
		expect(result.plan.machines[0]).toBe(source.machines[0]);
	});

	it("rejects a clock outside the P0 range", () => {
		const result = applyCommand(createPlan(1), {
			type: "machine.set-clock",
			machineId: createMachineId(0),
			clockPercent: 251,
		});

		expect(result).toEqual({ ok: false, code: "CLOCK_OUT_OF_RANGE" });
	});
});
