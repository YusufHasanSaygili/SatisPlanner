import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserIconImageProcessor } from "./icon-image";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("browser icon image processor", () => {
	it("decodes, bounds and re-encodes a source as WebP", async () => {
		const close = vi.fn();
		const drawImage = vi.fn();
		vi.stubGlobal(
			"createImageBitmap",
			vi.fn(async () => ({ width: 256, height: 128, close })),
		);
		vi.stubGlobal(
			"OffscreenCanvas",
			class {
				readonly width: number;
				readonly height: number;

				constructor(width: number, height: number) {
					this.width = width;
					this.height = height;
				}

				getContext() {
					return { drawImage };
				}

				async convertToBlob() {
					return new Blob([Uint8Array.from([82, 73, 70, 70, 4, 0, 0, 0, 87, 69, 66, 80])], {
						type: "image/webp",
					});
				}
			},
		);

		const result = await createBrowserIconImageProcessor().process(
			Uint8Array.from([137, 80, 78, 71]),
			"image/png",
		);
		expect(result).toMatchObject({ width: 128, height: 64, format: "webp" });
		expect(String.fromCharCode(...result.bytes.subarray(8, 12))).toBe("WEBP");
		expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 128, 64);
		expect(close).toHaveBeenCalledOnce();
	});

	it("rejects runtimes that silently fall back to a non-WebP blob", async () => {
		vi.stubGlobal(
			"createImageBitmap",
			vi.fn(async () => ({ width: 16, height: 16, close: vi.fn() })),
		);
		vi.stubGlobal(
			"OffscreenCanvas",
			class {
				getContext() {
					return { drawImage: vi.fn() };
				}

				async convertToBlob() {
					return new Blob([Uint8Array.from([1])], { type: "image/png" });
				}
			},
		);
		await expect(
			createBrowserIconImageProcessor().process(Uint8Array.from([1]), "image/png"),
		).rejects.toThrow("WebP encoding is unavailable");
	});
});
