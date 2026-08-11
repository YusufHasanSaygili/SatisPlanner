import { Rational } from "@satisplanner/domain";
import { describe, expect, it } from "vitest";
import { calculateSomersloopMultiplier } from "./somersloop";

describe("Somersloop multiplier", () => {
	it("matches Constructor, Assembler and Manufacturer slot matrices exactly", () => {
		for (const [slots, expected] of [
			[1, ["1", "2"]],
			[2, ["1", "3/2", "2"]],
			[4, ["1", "5/4", "3/2", "7/4", "2"]],
		] as const) {
			for (const [count, multiplier] of expected.entries()) {
				expect(Rational.parse(calculateSomersloopMultiplier(count, slots)).toString()).toBe(
					multiplier,
				);
			}
		}
	});

	it("keeps zero-slot buildings at 1x and rejects impossible selections", () => {
		expect(calculateSomersloopMultiplier(0, 0)).toEqual({ numerator: "1", denominator: "1" });
		expect(() => calculateSomersloopMultiplier(1, 0)).toThrowError(RangeError);
		expect(() => calculateSomersloopMultiplier(3, 2)).toThrowError(RangeError);
	});
});
