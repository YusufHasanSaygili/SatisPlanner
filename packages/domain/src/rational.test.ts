import { describe, expect, it } from "vitest";
import type { DomainValidationError } from "./errors";
import { MAX_RATIONAL_DIGITS, Rational } from "./rational";

describe("Rational", () => {
	it("keeps recurring material arithmetic exact", () => {
		const third = Rational.create(1n, 3n);
		expect(third.add(third).add(third).equals(Rational.create(1n))).toBe(true);
		expect(third.toDecimal(4)).toBe("0.3333");
		expect(third.toString()).toBe("1/3");
	});

	it("normalizes signs and produces deterministic JSON", () => {
		const value = Rational.create(12n, -18n);
		expect(value.toJSON()).toEqual({ numerator: "-2", denominator: "3" });
		expect(JSON.stringify(value)).toBe('{"numerator":"-2","denominator":"3"}');
		expect(Rational.parse(value.toJSON()).equals(value)).toBe(true);
		expect(Rational.parse("-1.2500").toString()).toBe("-5/4");
	});

	it("satisfies addition identity, inverse and associativity over a deterministic property matrix", () => {
		let seed = 0x5a17;
		const next = () => {
			seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
			return seed;
		};
		for (let index = 0; index < 500; index += 1) {
			const a = Rational.create(BigInt((next() % 2_001) - 1_000), BigInt((next() % 97) + 1));
			const b = Rational.create(BigInt((next() % 2_001) - 1_000), BigInt((next() % 97) + 1));
			const c = Rational.create(BigInt((next() % 2_001) - 1_000), BigInt((next() % 97) + 1));
			expect(a.add(Rational.create(0n)).equals(a)).toBe(true);
			expect(a.add(b).subtract(b).equals(a)).toBe(true);
			expect(
				a
					.add(b)
					.add(c)
					.equals(a.add(b.add(c))),
			).toBe(true);
		}
	});

	it("reports zero division and bounded input overflow explicitly", () => {
		expect(() => Rational.create(1n, 0n)).toThrowError(
			expect.objectContaining<Partial<DomainValidationError>>({ code: "DIVISION_BY_ZERO" }),
		);
		expect(() => Rational.create(1n).divide(Rational.create(0n))).toThrowError(
			expect.objectContaining<Partial<DomainValidationError>>({ code: "DIVISION_BY_ZERO" }),
		);
		expect(() => Rational.parse("9".repeat(MAX_RATIONAL_DIGITS + 1))).toThrowError(
			expect.objectContaining<Partial<DomainValidationError>>({ code: "RATIONAL_OVERFLOW" }),
		);
		const atLimit = Rational.parse("9".repeat(MAX_RATIONAL_DIGITS));
		expect(() => atLimit.multiply(Rational.create(10n))).toThrowError(
			expect.objectContaining<Partial<DomainValidationError>>({ code: "RATIONAL_OVERFLOW" }),
		);
	});
});
