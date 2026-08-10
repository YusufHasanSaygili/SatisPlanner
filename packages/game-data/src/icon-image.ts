import { MAX_ICON_EDGE } from "./icon-types";

export interface ProcessedIconImage {
	readonly bytes: Uint8Array;
	readonly width: number;
	readonly height: number;
	readonly format: "webp";
}

export interface IconImageProcessor {
	process(
		bytes: Uint8Array,
		inputMimeType: "image/png" | "image/jpeg" | "image/webp",
	): Promise<ProcessedIconImage>;
}

async function htmlCanvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error("WebP encoding failed"))),
			"image/webp",
			0.86,
		);
	});
}

export function createBrowserIconImageProcessor(): IconImageProcessor {
	return {
		async process(bytes, inputMimeType) {
			if (typeof createImageBitmap !== "function") {
				throw new Error("This runtime cannot decode local images.");
			}
			const input = new Uint8Array(bytes.byteLength);
			input.set(bytes);
			const bitmap = await createImageBitmap(new Blob([input], { type: inputMimeType }));
			try {
				if (bitmap.width <= 0 || bitmap.height <= 0) throw new Error("Invalid image dimensions");
				const scale = Math.min(1, MAX_ICON_EDGE / Math.max(bitmap.width, bitmap.height));
				const width = Math.max(1, Math.round(bitmap.width * scale));
				const height = Math.max(1, Math.round(bitmap.height * scale));
				let blob: Blob;
				if (typeof OffscreenCanvas !== "undefined") {
					const canvas = new OffscreenCanvas(width, height);
					const context = canvas.getContext("2d");
					if (!context) throw new Error("Canvas context is unavailable");
					context.drawImage(bitmap, 0, 0, width, height);
					blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.86 });
				} else if (typeof document !== "undefined") {
					const canvas = document.createElement("canvas");
					canvas.width = width;
					canvas.height = height;
					const context = canvas.getContext("2d");
					if (!context) throw new Error("Canvas context is unavailable");
					context.drawImage(bitmap, 0, 0, width, height);
					blob = await htmlCanvasBlob(canvas);
				} else {
					throw new Error("This runtime cannot resize local images.");
				}
				if (blob.type !== "image/webp") throw new Error("WebP encoding is unavailable");
				return {
					bytes: new Uint8Array(await blob.arrayBuffer()),
					width,
					height,
					format: "webp",
				};
			} finally {
				bitmap.close();
			}
		},
	};
}
