import { DomainValidationError } from "./errors";
import { Rational, type RationalJson } from "./rational";

const CLOCK_SCALE = 10_000n;
const MIN_CLOCK_SCALED = CLOCK_SCALE;
const MAX_CLOCK_SCALED = 250n * CLOCK_SCALE;

function parseClockScaled(value: string): bigint {
	const match = /^(\d{1,3})(?:\.(\d{1,4}))?$/.exec(value.trim());
	if (!match) {
		throw new DomainValidationError(
			"INVALID_CLOCK_PERCENT",
			"Clock percent must be a decimal string with at most four fractional digits.",
		);
	}
	const whole = BigInt(match[1] ?? "0");
	const fraction = (match[2] ?? "").padEnd(4, "0");
	const scaled = whole * CLOCK_SCALE + BigInt(fraction || "0");
	if (scaled < MIN_CLOCK_SCALED || scaled > MAX_CLOCK_SCALED) {
		throw new DomainValidationError(
			"INVALID_CLOCK_PERCENT",
			"Clock percent must be between 1.0000 and 250.0000.",
		);
	}
	return scaled;
}

abstract class MaterialRate<UnitName extends string> {
	readonly value: Rational;
	abstract readonly unit: UnitName;

	protected constructor(value: Rational) {
		this.value = value;
	}

	toJSON(): RationalJson {
		return this.value.toJSON();
	}

	format(maxFractionDigits: number): string {
		return this.value.toDecimal(maxFractionDigits);
	}
}

export class ItemRatePerMinute extends MaterialRate<"items/min"> {
	readonly unit = "items/min" as const;
	readonly #itemRateBrand = true;

	private constructor(value: Rational) {
		super(value);
		Object.freeze(this);
	}

	static from(value: Rational | string): ItemRatePerMinute {
		return new ItemRatePerMinute(typeof value === "string" ? Rational.parse(value) : value);
	}

	add(other: ItemRatePerMinute): ItemRatePerMinute {
		return ItemRatePerMinute.from(this.value.add(other.value));
	}

	get isItemRate(): boolean {
		return this.#itemRateBrand;
	}
}

export class FluidRateM3PerMinute extends MaterialRate<"m³/min"> {
	readonly unit = "m³/min" as const;
	readonly #fluidRateBrand = true;

	private constructor(value: Rational) {
		super(value);
		Object.freeze(this);
	}

	static from(value: Rational | string): FluidRateM3PerMinute {
		return new FluidRateM3PerMinute(typeof value === "string" ? Rational.parse(value) : value);
	}

	add(other: FluidRateM3PerMinute): FluidRateM3PerMinute {
		return FluidRateM3PerMinute.from(this.value.add(other.value));
	}

	get isFluidRate(): boolean {
		return this.#fluidRateBrand;
	}
}

export class PowerMW {
	readonly value: Rational;

	private constructor(value: Rational) {
		this.value = value;
		Object.freeze(this);
	}

	static from(value: Rational | string): PowerMW {
		return new PowerMW(typeof value === "string" ? Rational.parse(value) : value);
	}

	toJSON(): RationalJson {
		return this.value.toJSON();
	}

	format(maxFractionDigits: number): string {
		return this.value.toDecimal(maxFractionDigits);
	}
}

export class ClockPercent {
	readonly scaledValue: bigint;

	private constructor(scaledValue: bigint) {
		this.scaledValue = scaledValue;
		Object.freeze(this);
	}

	static parse(value: string): ClockPercent {
		return new ClockPercent(parseClockScaled(value));
	}

	static maximumForShardCount(powerShardCount: number): ClockPercent {
		if (!Number.isInteger(powerShardCount) || powerShardCount < 0 || powerShardCount > 3) {
			throw new DomainValidationError(
				"INVALID_POWER_SHARD_COUNT",
				"Power shard count must be an integer between 0 and 3.",
			);
		}
		return ClockPercent.parse(`${100 + powerShardCount * 50}`);
	}

	compare(other: ClockPercent): -1 | 0 | 1 {
		return this.scaledValue < other.scaledValue ? -1 : this.scaledValue > other.scaledValue ? 1 : 0;
	}

	toString(): string {
		const whole = this.scaledValue / CLOCK_SCALE;
		const fraction = (this.scaledValue % CLOCK_SCALE).toString().padStart(4, "0");
		return `${whole}.${fraction}`;
	}

	toJSON(): string {
		return this.toString();
	}
}
