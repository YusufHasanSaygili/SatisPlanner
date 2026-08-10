import { describe, expect, expectTypeOf, it } from "vitest";
import type { DomainValidationError } from "./errors";
import { Rational } from "./rational";
import { ClockPercent, FluidRateM3PerMinute, ItemRatePerMinute, PowerMW } from "./units";

describe("unit-safe values", () => {
	it("keeps item and fluid rates nominally distinct", () => {
		const items = ItemRatePerMinute.from("1/3");
		const fluids = FluidRateM3PerMinute.from("1/3");
		expectTypeOf(items).not.toEqualTypeOf(fluids);
		expectTypeOf(items.add).parameter(0).toEqualTypeOf<ItemRatePerMinute>();
		expectTypeOf(fluids.add).parameter(0).toEqualTypeOf<FluidRateM3PerMinute>();
		expect(items.add(ItemRatePerMinute.from("2/3")).value.equals(Rational.create(1n))).toBe(true);
		expect(fluids.unit).toBe("m³/min");
	});

	it("formats for the UI without changing the domain value", () => {
		const rate = ItemRatePerMinute.from("1/3");
		const before = rate.toJSON();
		expect(rate.format(2)).toBe("0.33");
		expect(rate.toJSON()).toEqual(before);
		expect(PowerMW.from("12.3456").format(2)).toBe("12.35");
	});

	it("stores clock percent as an exact four-decimal value", () => {
		expect(ClockPercent.parse("1").toJSON()).toBe("1.0000");
		expect(ClockPercent.parse("125.25").toJSON()).toBe("125.2500");
		expect(ClockPercent.parse("250.0000").toJSON()).toBe("250.0000");
		for (const invalid of ["0.9999", "250.0001", "100.00001", "NaN", "1e2"]) {
			expect(() => ClockPercent.parse(invalid), invalid).toThrowError(
				expect.objectContaining<Partial<DomainValidationError>>({ code: "INVALID_CLOCK_PERCENT" }),
			);
		}
	});
});
