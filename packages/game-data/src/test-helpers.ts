export function encodeUtf16(text: string, endian: "le" | "be"): Uint8Array {
	const bytes = new Uint8Array(2 + text.length * 2);
	bytes[0] = endian === "le" ? 0xff : 0xfe;
	bytes[1] = endian === "le" ? 0xfe : 0xff;
	for (let index = 0; index < text.length; index += 1) {
		const code = text.charCodeAt(index);
		const offset = 2 + index * 2;
		bytes[offset] = endian === "le" ? code & 0xff : code >> 8;
		bytes[offset + 1] = endian === "le" ? code >> 8 : code & 0xff;
	}
	return bytes;
}
