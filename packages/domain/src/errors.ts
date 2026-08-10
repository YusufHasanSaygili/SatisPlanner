export type DomainErrorCode =
	| "INVALID_RATIONAL"
	| "RATIONAL_OVERFLOW"
	| "DIVISION_BY_ZERO"
	| "INVALID_CLOCK_PERCENT"
	| "INVALID_POWER_SHARD_COUNT"
	| "CLOCK_EXCEEDS_SHARD_CAPACITY"
	| "INVALID_SOMERSLOOP_COUNT"
	| "INVALID_IDENTIFIER"
	| "INCOMPATIBLE_RECIPE"
	| "INVALID_PORT"
	| "INVALID_EXTRACTOR_CONFIG"
	| "INVALID_PLAN"
	| "UNSUPPORTED_SCHEMA_VERSION"
	| "MISSING_MIGRATION";

export class DomainValidationError extends Error {
	readonly code: DomainErrorCode;
	readonly path: string;

	constructor(code: DomainErrorCode, message: string, path = "$") {
		super(message);
		this.name = "DomainValidationError";
		this.code = code;
		this.path = path;
	}
}
