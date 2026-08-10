import { GameDataImportError, errorDiagnostic } from "./errors";

export type CanonicalJsonValue =
	| boolean
	| number
	| string
	| null
	| readonly CanonicalJsonValue[]
	| { readonly [key: string]: CanonicalJsonValue };

export function canonicalJson(value: CanonicalJsonValue): string {
	if (
		value === null ||
		typeof value === "boolean" ||
		typeof value === "number" ||
		typeof value === "string"
	) {
		if (typeof value === "number" && !Number.isFinite(value)) {
			throw new GameDataImportError(
				errorDiagnostic(
					"INVALID_SNAPSHOT",
					"$",
					"Canonical JSON cannot contain a non-finite number.",
					"Replace the value with a finite decimal or rational representation.",
				),
			);
		}
		return JSON.stringify(value);
	}
	if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
	const objectValue = value as { readonly [key: string]: CanonicalJsonValue };
	return `{${Object.keys(objectValue)
		.sort()
		.map((key) => `${JSON.stringify(key)}:${canonicalJson(objectValue[key] as CanonicalJsonValue)}`)
		.join(",")}}`;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
	if (!globalThis.crypto?.subtle) {
		throw new GameDataImportError(
			errorDiagnostic(
				"INVALID_SNAPSHOT",
				"$",
				"This runtime does not provide SHA-256 support.",
				"Use a supported desktop or modern browser runtime.",
			),
		);
	}
	const data = new Uint8Array(bytes.byteLength);
	data.set(bytes);
	const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256Text(value: string): Promise<string> {
	return sha256Hex(new TextEncoder().encode(value));
}
