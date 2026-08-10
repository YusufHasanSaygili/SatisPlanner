import { describe, expect, it } from "vitest";
import type { AppOwnedIconCache, IconSourceFile, ReadOnlyIconSource } from "./icon-cache";
import {
	buildIconCache,
	clearIconCache,
	createExtractedIconFolderSelection,
	pickExtractedIconFolder,
} from "./icon-cache";
import type { IconImageProcessor } from "./icon-image";
import { createIconMappings, resolveIcon } from "./icon-resolver";

function normalize(path: string): string {
	return path
		.replace(/\\/g, "/")
		.replace(/\/{2,}/g, "/")
		.replace(/\/$/, "")
		.toLowerCase();
}

class FakeReadOnlyIconSource implements ReadOnlyIconSource {
	readonly #root = "/extracted";
	readonly #files = new Map<string, { readonly relative: string; readonly bytes: Uint8Array }>();
	readonly #aliases = new Map<string, string>();
	reads = 0;

	set(relativePath: string, bytes: readonly number[]): this {
		const path = normalize(`${this.#root}/${relativePath}`);
		this.#files.set(path, {
			relative: relativePath.replace(/\\/g, "/"),
			bytes: Uint8Array.from(bytes),
		});
		return this;
	}

	alias(relativePath: string, target: string): this {
		this.#aliases.set(normalize(`${this.#root}/${relativePath}`), normalize(target));
		return this;
	}

	async canonicalPath(path: string): Promise<string> {
		const normalized = normalize(path);
		if (normalized === this.#root) return normalized;
		if (this.#aliases.has(normalized)) return this.#aliases.get(normalized) as string;
		if (!this.#files.has(normalized)) throw new Error("missing source");
		return normalized;
	}

	async directoryExists(path: string): Promise<boolean> {
		return normalize(path) === this.#root;
	}

	async listFilesRecursively(): Promise<readonly IconSourceFile[]> {
		return [...this.#files.entries()].map(([path, file]) => ({
			path,
			relativePath: file.relative,
			sizeBytes: file.bytes.byteLength,
		}));
	}

	async readFile(path: string): Promise<Uint8Array> {
		this.reads += 1;
		const value = this.#files.get(normalize(path));
		if (!value) throw new Error("missing source");
		return Uint8Array.from(value.bytes);
	}
}

class FakeAppOwnedIconCache implements AppOwnedIconCache {
	readonly directories = new Set(["/app"]);
	readonly files = new Map<string, Uint8Array>();
	readonly json = new Map<string, unknown>();
	readonly deleted: string[] = [];
	readonly aliases = new Map<string, string>();
	readonly deleteFailures = new Set<string>();

	async canonicalPath(path: string): Promise<string> {
		const normalized = normalize(path);
		return this.aliases.get(normalized) ?? normalized;
	}

	async directoryExists(path: string): Promise<boolean> {
		return this.directories.has(normalize(path));
	}

	async ensureDirectory(path: string): Promise<void> {
		this.directories.add(normalize(path));
	}

	async fileExists(path: string): Promise<boolean> {
		const normalized = normalize(path);
		return this.files.has(normalized) || this.json.has(normalized);
	}

	async readJson(path: string): Promise<unknown | null> {
		return this.json.get(normalize(path)) ?? null;
	}

	async writeFileAtomic(path: string, bytes: Uint8Array): Promise<void> {
		this.files.set(normalize(path), Uint8Array.from(bytes));
	}

	async writeJsonAtomic(path: string, value: unknown): Promise<void> {
		this.json.set(normalize(path), value);
	}

	async deleteFile(path: string): Promise<void> {
		const normalized = normalize(path);
		if (this.deleteFailures.has(normalized)) throw new Error("delete failed");
		this.files.delete(normalized);
		this.json.delete(normalized);
		this.deleted.push(normalized);
	}
}

class FakeImageProcessor implements IconImageProcessor {
	calls = 0;
	invalid = false;

	async process(bytes: Uint8Array) {
		this.calls += 1;
		if (this.invalid) throw new Error("invalid image");
		return {
			bytes: Uint8Array.from([82, 73, 70, 70, 4, 0, 0, 0, 87, 69, 66, 80, ...bytes]),
			width: 64,
			height: 64,
			format: "webp" as const,
		};
	}
}

const assetPath = "Texture2D /Game/FactoryGame/UI/Icon_A.Icon_A";

function mappings() {
	return createIconMappings([
		{ classId: "Desc_A_C", category: "material-solid", assetPath },
		{ classId: "Build_A_C", category: "building", assetPath: null },
	]).mappings;
}

function input(
	source: FakeReadOnlyIconSource,
	cache: FakeAppOwnedIconCache,
	processor: FakeImageProcessor,
) {
	return {
		selection: createExtractedIconFolderSelection("/extracted"),
		appDataRoot: "/app",
		cacheRoot: "/app/icon-cache",
		source,
		cache,
		processor,
		mappings: mappings(),
	};
}

describe("app-owned local icon cache", () => {
	it("keeps manual folder selection behind a platform-neutral picker port", async () => {
		await expect(
			pickExtractedIconFolder({ pickDirectory: async () => "  /extracted  " }),
		).resolves.toEqual({ path: "/extracted", selectedByUser: true });
		await expect(pickExtractedIconFolder({ pickDirectory: async () => null })).resolves.toBeNull();
	});

	it("imports, reuses and invalidates one changed source without mutating the source", async () => {
		const source = new FakeReadOnlyIconSource().set("Game/FactoryGame/UI/Icon_A.png", [1, 2, 3]);
		const cache = new FakeAppOwnedIconCache();
		const processor = new FakeImageProcessor();
		const first = await buildIconCache(input(source, cache, processor));
		expect(first.ok).toBe(true);
		expect(first.importedClassIds).toEqual(["Desc_A_C"]);
		expect(first.missingClassIds).toEqual(["Build_A_C"]);
		expect(first.manifest?.entries).toHaveLength(1);
		expect(first.manifest?.sourceRootHash).toMatch(/^[0-9a-f]{64}$/);
		expect(JSON.stringify(first.manifest)).not.toContain("/extracted");
		expect("writeFile" in source).toBe(false);

		const second = await buildIconCache(input(source, cache, processor));
		expect(second.reusedClassIds).toEqual(["Desc_A_C"]);
		expect(processor.calls).toBe(1);

		const oldCachePath = first.manifest?.entries[0]?.cacheRelativePath;
		source.set("Game/FactoryGame/UI/Icon_A.png", [4, 5, 6, 7]);
		const third = await buildIconCache(input(source, cache, processor));
		expect(third.importedClassIds).toEqual(["Desc_A_C"]);
		expect(third.manifest?.entries[0]?.sourceHash).not.toBe(first.manifest?.entries[0]?.sourceHash);
		expect(cache.deleted.some((path) => path.endsWith(oldCachePath ?? "missing"))).toBe(true);
		const mapping = mappings().find((entry) => entry.classId === "Desc_A_C");
		if (!mapping || !third.manifest) throw new Error("expected cache output");
		expect(resolveIcon(mapping, third.manifest).resource.kind).toBe("cache");
	});

	it("keeps fallback behavior for renamed, duplicate and invalid extracted images", async () => {
		const renamed = new FakeReadOnlyIconSource().set("Other/Renamed.png", [1]);
		const duplicate = new FakeReadOnlyIconSource()
			.set("One/Icon_A.png", [1])
			.set("Two/Icon_A.png", [2]);
		const invalid = new FakeReadOnlyIconSource().set("Game/FactoryGame/UI/Icon_A.png", [3]);
		const cache = new FakeAppOwnedIconCache();
		const processor = new FakeImageProcessor();

		const renamedResult = await buildIconCache(input(renamed, cache, processor));
		expect(renamedResult.missingClassIds).toContain("Desc_A_C");
		const duplicateResult = await buildIconCache(input(duplicate, cache, processor));
		expect(duplicateResult.diagnostics).toContainEqual(
			expect.objectContaining({ code: "DUPLICATE_SOURCE_ICON", classId: "Desc_A_C" }),
		);
		processor.invalid = true;
		const invalidResult = await buildIconCache(input(invalid, cache, processor));
		expect(invalidResult.diagnostics).toContainEqual(
			expect.objectContaining({ code: "INVALID_IMAGE", classId: "Desc_A_C" }),
		);
	});

	it("rejects source traversal and cache roots outside app data", async () => {
		const source = new FakeReadOnlyIconSource()
			.set("Game/FactoryGame/UI/Icon_A.png", [1, 2])
			.alias("Game/FactoryGame/UI/Icon_A.png", "/private/icon.png");
		const cache = new FakeAppOwnedIconCache();
		const processor = new FakeImageProcessor();
		const traversal = await buildIconCache(input(source, cache, processor));
		expect(traversal.diagnostics).toContainEqual(
			expect.objectContaining({ code: "SOURCE_NOT_AUTHORIZED" }),
		);

		const outside = await buildIconCache({
			...input(new FakeReadOnlyIconSource(), cache, processor),
			cacheRoot: "/outside/icon-cache",
		});
		expect(outside.ok).toBe(false);
		expect(outside.diagnostics).toContainEqual(
			expect.objectContaining({ code: "INVALID_CACHE_ROOT" }),
		);
	});

	it("clears only manifest-allowlisted app-owned files and rejects a tampered manifest", async () => {
		const source = new FakeReadOnlyIconSource().set("Game/FactoryGame/UI/Icon_A.png", [1, 2]);
		const cache = new FakeAppOwnedIconCache();
		const processor = new FakeImageProcessor();
		const built = await buildIconCache(input(source, cache, processor));
		if (!built.manifest) throw new Error("manifest missing");
		cache.files.set("/app/icon-cache/icons/untracked.webp", Uint8Array.from([9]));
		const cleared = await clearIconCache(cache, "/app", "/app/icon-cache", built.manifest);
		expect(cleared.ok).toBe(true);
		expect(cache.files.has("/app/icon-cache/icons/untracked.webp")).toBe(true);

		const tampered = {
			...built.manifest,
			entries: [
				{
					...built.manifest.entries[0],
					cacheRelativePath: "../../outside.webp",
				},
			],
		};
		const rejected = await clearIconCache(cache, "/app", "/app/icon-cache", tampered);
		expect(rejected.ok).toBe(false);
		expect(rejected.deleted).toEqual([]);
	});

	it("reports partial clear failure without touching any unlisted file", async () => {
		const source = new FakeReadOnlyIconSource().set("Game/FactoryGame/UI/Icon_A.png", [1, 2]);
		const cache = new FakeAppOwnedIconCache();
		const built = await buildIconCache(input(source, cache, new FakeImageProcessor()));
		const relativePath = built.manifest?.entries[0]?.cacheRelativePath;
		if (!built.manifest || !relativePath) throw new Error("manifest missing");
		cache.files.set("/app/icon-cache/icons/untracked.webp", Uint8Array.from([9]));
		cache.deleteFailures.add(normalize(`/app/icon-cache/${relativePath}`));
		const result = await clearIconCache(cache, "/app", "/app/icon-cache", built.manifest);
		expect(result.ok).toBe(false);
		expect(result.deleted).toEqual([]);
		expect(result.diagnostics).toContainEqual(
			expect.objectContaining({ code: "CACHE_CLEANUP_INCOMPLETE" }),
		);
		expect(cache.files.has("/app/icon-cache/icons/untracked.webp")).toBe(true);
	});
});
