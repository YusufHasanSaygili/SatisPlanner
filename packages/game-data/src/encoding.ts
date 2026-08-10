import { GameDataImportError, errorDiagnostic } from "./errors";

export const MAX_DOCS_FILE_BYTES = 32 * 1024 * 1024;
export const MAX_DOCS_JSON_DEPTH = 64;

export type DocsEncoding = "utf-8" | "utf-16le" | "utf-16be";

export interface DecodedDocs {
	readonly encoding: DocsEncoding;
	readonly text: string;
}

function detectEncoding(bytes: Uint8Array): { encoding: DocsEncoding; offset: number } {
	if (bytes[0] === 0xff && bytes[1] === 0xfe) return { encoding: "utf-16le", offset: 2 };
	if (bytes[0] === 0xfe && bytes[1] === 0xff) return { encoding: "utf-16be", offset: 2 };
	if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
		return { encoding: "utf-8", offset: 3 };
	}

	const sampleLength = Math.min(bytes.length, 256);
	let evenZeros = 0;
	let oddZeros = 0;
	for (let index = 0; index < sampleLength; index += 1) {
		if (bytes[index] !== 0) continue;
		if (index % 2 === 0) evenZeros += 1;
		else oddZeros += 1;
	}
	if (oddZeros > sampleLength / 8 && evenZeros === 0) return { encoding: "utf-16le", offset: 0 };
	if (evenZeros > sampleLength / 8 && oddZeros === 0) return { encoding: "utf-16be", offset: 0 };
	return { encoding: "utf-8", offset: 0 };
}

export function decodeDocsBytes(bytes: Uint8Array): DecodedDocs {
	if (bytes.byteLength === 0) {
		throw new GameDataImportError(
			errorDiagnostic(
				"SOURCE_NOT_READABLE",
				"$source",
				"The selected Docs file is empty.",
				"Select a non-empty locale JSON file from CommunityResources/Docs.",
			),
		);
	}
	if (bytes.byteLength > MAX_DOCS_FILE_BYTES) {
		throw new GameDataImportError(
			errorDiagnostic(
				"SOURCE_TOO_LARGE",
				"$source",
				`The selected Docs file exceeds ${MAX_DOCS_FILE_BYTES} bytes.`,
				"Verify that the selected file is an official localized Docs JSON file.",
			),
		);
	}

	const { encoding, offset } = detectEncoding(bytes);
	try {
		const text = new TextDecoder(encoding, { fatal: true }).decode(bytes.subarray(offset));
		return { encoding, text: text.replace(/^\uFEFF/, "") };
	} catch {
		throw new GameDataImportError(
			errorDiagnostic(
				"UNSUPPORTED_ENCODING",
				"$source",
				"The Docs file is not valid UTF-8, UTF-16LE or UTF-16BE text.",
				"Choose an unmodified file from the game's CommunityResources/Docs folder.",
			),
		);
	}
}

export function assertJsonDepth(value: unknown, maximumDepth = MAX_DOCS_JSON_DEPTH): void {
	const stack: Array<{ readonly value: unknown; readonly depth: number }> = [{ value, depth: 1 }];
	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) break;
		if (current.depth > maximumDepth) {
			throw new GameDataImportError(
				errorDiagnostic(
					"INVALID_DOCS_SHAPE",
					"$",
					`Docs JSON nesting exceeds the ${maximumDepth}-level safety limit.`,
					"Use an official, unmodified Docs file.",
				),
			);
		}
		if (Array.isArray(current.value)) {
			for (const entry of current.value) stack.push({ value: entry, depth: current.depth + 1 });
		} else if (typeof current.value === "object" && current.value !== null) {
			for (const entry of Object.values(current.value)) {
				stack.push({ value: entry, depth: current.depth + 1 });
			}
		}
	}
}
