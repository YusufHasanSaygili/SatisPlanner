import { describe, expect, it } from "vitest";
import { decodeDocsBytes } from "./encoding";
import { encodeUtf16 } from "./test-helpers";

describe("Docs encoding detection", () => {
	it("decodes UTF-16LE and UTF-16BE locale data", () => {
		const source = '[{"mDisplayName":"Üretici"}]';
		expect(decodeDocsBytes(encodeUtf16(source, "le"))).toEqual({
			encoding: "utf-16le",
			text: source,
		});
		expect(decodeDocsBytes(encodeUtf16(source, "be"))).toEqual({
			encoding: "utf-16be",
			text: source,
		});
	});

	it("decodes UTF-8 with or without BOM", () => {
		const source = '[{"ok":true}]';
		const plain = new TextEncoder().encode(source);
		const bom = new Uint8Array([0xef, 0xbb, 0xbf, ...plain]);
		expect(decodeDocsBytes(plain)).toEqual({ encoding: "utf-8", text: source });
		expect(decodeDocsBytes(bom)).toEqual({ encoding: "utf-8", text: source });
	});
});
