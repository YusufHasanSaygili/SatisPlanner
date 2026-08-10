export type GameDataErrorCode =
	| "SOURCE_NOT_FOUND"
	| "SOURCE_NOT_AUTHORIZED"
	| "SOURCE_NOT_READABLE"
	| "SOURCE_TOO_LARGE"
	| "UNSUPPORTED_ENCODING"
	| "MALFORMED_JSON"
	| "INVALID_DOCS_SHAPE"
	| "DUPLICATE_CLASS_ID"
	| "MISSING_CLASS_REFERENCE"
	| "UNKNOWN_ITEM_FORM"
	| "INVALID_RECIPE_DURATION"
	| "INVALID_COUNTED_ITEM"
	| "INVALID_BUILDING"
	| "INVALID_SNAPSHOT"
	| "ACTIVATION_REQUIRES_CONFIRMATION";

export interface GameDataDiagnostic {
	readonly severity: "error" | "warning";
	readonly code: GameDataErrorCode;
	readonly path: string;
	readonly message: string;
	readonly suggestion: string;
}

export class GameDataImportError extends Error {
	readonly diagnostic: GameDataDiagnostic;

	constructor(diagnostic: GameDataDiagnostic) {
		super(diagnostic.message);
		this.name = "GameDataImportError";
		this.diagnostic = diagnostic;
	}
}

export function errorDiagnostic(
	code: GameDataErrorCode,
	path: string,
	message: string,
	suggestion: string,
): GameDataDiagnostic {
	return { severity: "error", code, path, message, suggestion };
}

export function warningDiagnostic(
	code: GameDataErrorCode,
	path: string,
	message: string,
	suggestion: string,
): GameDataDiagnostic {
	return { severity: "warning", code, path, message, suggestion };
}
