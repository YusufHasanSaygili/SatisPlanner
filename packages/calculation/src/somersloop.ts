import { Rational, type RationalJson } from "@satisplanner/domain";

export function calculateSomersloopMultiplier(
	somersloopCount: number,
	somersloopSlots: number,
): RationalJson {
	if (!Number.isInteger(somersloopSlots) || somersloopSlots < 0 || somersloopSlots > 4) {
		throw new RangeError("Somersloop slots must be an integer between 0 and 4.");
	}
	if (
		!Number.isInteger(somersloopCount) ||
		somersloopCount < 0 ||
		somersloopCount > somersloopSlots
	) {
		throw new RangeError(`Somersloop count must be between 0 and ${somersloopSlots}.`);
	}
	if (somersloopSlots === 0) return Rational.parse("1").toJSON();
	return Rational.parse("1")
		.add(Rational.create(BigInt(somersloopCount), BigInt(somersloopSlots)))
		.toJSON();
}
