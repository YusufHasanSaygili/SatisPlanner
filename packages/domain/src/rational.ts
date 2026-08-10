import { DomainValidationError } from "./errors";

export const MAX_RATIONAL_DIGITS = 256;

export interface RationalJson {
	readonly numerator: string;
	readonly denominator: string;
}

function absolute(value: bigint): bigint {
	return value < 0n ? -value : value;
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
	let a = absolute(left);
	let b = absolute(right);
	while (b !== 0n) {
		const remainder = a % b;
		a = b;
		b = remainder;
	}
	return a;
}

function digitCount(value: bigint): number {
	return absolute(value).toString().length;
}

function assertWithinLimits(numerator: bigint, denominator: bigint): void {
	if (
		digitCount(numerator) > MAX_RATIONAL_DIGITS ||
		digitCount(denominator) > MAX_RATIONAL_DIGITS
	) {
		throw new DomainValidationError(
			"RATIONAL_OVERFLOW",
			`Rational values are limited to ${MAX_RATIONAL_DIGITS} digits per component.`,
		);
	}
}

function parseInteger(value: string, path: string): bigint {
	if (!/^[+-]?\d+$/.test(value)) {
		throw new DomainValidationError("INVALID_RATIONAL", `Expected an integer at ${path}.`, path);
	}
	const unsigned = value.replace(/^[+-]/, "");
	if (unsigned.length > MAX_RATIONAL_DIGITS) {
		throw new DomainValidationError(
			"RATIONAL_OVERFLOW",
			`Rational values are limited to ${MAX_RATIONAL_DIGITS} digits per component.`,
			path,
		);
	}
	return BigInt(value);
}

export class Rational {
	readonly numerator: bigint;
	readonly denominator: bigint;

	private constructor(numerator: bigint, denominator: bigint) {
		this.numerator = numerator;
		this.denominator = denominator;
		Object.freeze(this);
	}

	static create(numerator: bigint, denominator = 1n): Rational {
		if (denominator === 0n) {
			throw new DomainValidationError("DIVISION_BY_ZERO", "A rational denominator cannot be zero.");
		}
		if (numerator === 0n) return new Rational(0n, 1n);

		const sign = denominator < 0n ? -1n : 1n;
		const divisor = greatestCommonDivisor(numerator, denominator);
		const normalizedNumerator = (numerator / divisor) * sign;
		const normalizedDenominator = absolute(denominator / divisor);
		assertWithinLimits(normalizedNumerator, normalizedDenominator);
		return new Rational(normalizedNumerator, normalizedDenominator);
	}

	static parse(value: string | RationalJson): Rational {
		if (typeof value !== "string") {
			return Rational.create(
				parseInteger(value.numerator, "$.numerator"),
				parseInteger(value.denominator, "$.denominator"),
			);
		}

		const source = value.trim();
		const fraction = /^([+-]?\d+)\/([+-]?\d+)$/.exec(source);
		if (fraction) {
			return Rational.create(
				parseInteger(fraction[1] ?? "", "$.numerator"),
				parseInteger(fraction[2] ?? "", "$.denominator"),
			);
		}

		const decimal = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(source);
		if (!decimal) {
			throw new DomainValidationError("INVALID_RATIONAL", `Invalid rational value: ${value}`);
		}
		const sign = decimal[1] === "-" ? -1n : 1n;
		const whole = decimal[2] ?? "";
		const fractionDigits = decimal[3] ?? "";
		const combined = `${whole}${fractionDigits}`;
		const numerator = parseInteger(combined, "$.numerator") * sign;
		const denominator = 10n ** BigInt(fractionDigits.length);
		return Rational.create(numerator, denominator);
	}

	add(other: Rational): Rational {
		return Rational.create(
			this.numerator * other.denominator + other.numerator * this.denominator,
			this.denominator * other.denominator,
		);
	}

	subtract(other: Rational): Rational {
		return Rational.create(
			this.numerator * other.denominator - other.numerator * this.denominator,
			this.denominator * other.denominator,
		);
	}

	multiply(other: Rational): Rational {
		return Rational.create(this.numerator * other.numerator, this.denominator * other.denominator);
	}

	divide(other: Rational): Rational {
		if (other.numerator === 0n) {
			throw new DomainValidationError("DIVISION_BY_ZERO", "Cannot divide by zero.");
		}
		return Rational.create(this.numerator * other.denominator, this.denominator * other.numerator);
	}

	compare(other: Rational): -1 | 0 | 1 {
		const difference = this.numerator * other.denominator - other.numerator * this.denominator;
		return difference < 0n ? -1 : difference > 0n ? 1 : 0;
	}

	equals(other: Rational): boolean {
		return this.numerator === other.numerator && this.denominator === other.denominator;
	}

	toDecimal(maxFractionDigits: number, trimTrailingZeros = true): string {
		if (!Number.isInteger(maxFractionDigits) || maxFractionDigits < 0 || maxFractionDigits > 20) {
			throw new DomainValidationError(
				"INVALID_RATIONAL",
				"Decimal formatting precision must be an integer between 0 and 20.",
			);
		}

		const scale = 10n ** BigInt(maxFractionDigits);
		const scaled = absolute(this.numerator) * scale;
		const quotient = scaled / this.denominator;
		const remainder = scaled % this.denominator;
		const rounded = remainder * 2n >= this.denominator ? quotient + 1n : quotient;
		const sign = this.numerator < 0n && rounded !== 0n ? "-" : "";
		if (maxFractionDigits === 0) return `${sign}${rounded}`;

		const whole = rounded / scale;
		let fraction = (rounded % scale).toString().padStart(maxFractionDigits, "0");
		if (trimTrailingZeros) fraction = fraction.replace(/0+$/, "");
		return fraction.length === 0 ? `${sign}${whole}` : `${sign}${whole}.${fraction}`;
	}

	toString(): string {
		return this.denominator === 1n
			? this.numerator.toString()
			: `${this.numerator}/${this.denominator}`;
	}

	toJSON(): RationalJson {
		return {
			numerator: this.numerator.toString(),
			denominator: this.denominator.toString(),
		};
	}
}
