import { type CanonicalJsonValue, canonicalJson, sha256Hex, sha256Text } from "./canonical";
import type { IconImageProcessor, ProcessedIconImage } from "./icon-image";
import { isSafeCacheRelativePath, normalizeUnrealIconAssetPath } from "./icon-resolver";
import {
	ICON_CACHE_MANIFEST_FILE,
	ICON_CACHE_SCHEMA_VERSION,
	ICON_RESOLVER_VERSION,
	MAX_ICON_CACHE_BYTES,
	MAX_ICON_EDGE,
	MAX_ICON_SOURCE_BYTES,
	type IconCacheManifest,
	type IconCacheManifestEntry,
	type IconDiagnostic,
	type IconMapping,
	iconDiagnostic,
	isIconCategory,
} from "./icon-types";

export interface ExtractedIconFolderSelection {
	readonly path: string;
	readonly selectedByUser: true;
}

export interface ExtractedIconFolderPicker {
	pickDirectory(): Promise<string | null>;
}

export interface IconSourceFile {
	readonly path: string;
	readonly relativePath: string;
	readonly sizeBytes: number;
}

export interface ReadOnlyIconSource {
	canonicalPath(path: string): Promise<string>;
	directoryExists(path: string): Promise<boolean>;
	listFilesRecursively(path: string): Promise<readonly IconSourceFile[]>;
	readFile(path: string): Promise<Uint8Array>;
}

export interface AppOwnedIconCache {
	canonicalPath(path: string): Promise<string>;
	directoryExists(path: string): Promise<boolean>;
	ensureDirectory(path: string): Promise<void>;
	fileExists(path: string): Promise<boolean>;
	readJson(path: string): Promise<unknown | null>;
	writeFileAtomic(path: string, bytes: Uint8Array): Promise<void>;
	writeJsonAtomic(path: string, value: unknown): Promise<void>;
	deleteFile(path: string): Promise<void>;
}

export interface IconCacheBuildInput {
	readonly selection: ExtractedIconFolderSelection;
	readonly appDataRoot: string;
	readonly cacheRoot: string;
	readonly source: ReadOnlyIconSource;
	readonly cache: AppOwnedIconCache;
	readonly processor: IconImageProcessor;
	readonly mappings: readonly IconMapping[];
}

export interface IconCacheBuildResult {
	readonly ok: boolean;
	readonly manifest?: IconCacheManifest;
	readonly diagnostics: readonly IconDiagnostic[];
	readonly importedClassIds: readonly string[];
	readonly reusedClassIds: readonly string[];
	readonly missingClassIds: readonly string[];
}

export interface IconCacheClearResult {
	readonly ok: boolean;
	readonly deleted: readonly string[];
	readonly diagnostics: readonly IconDiagnostic[];
}

const SOURCE_MIME_TYPES: Readonly<Record<string, "image/png" | "image/jpeg" | "image/webp">> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	webp: "image/webp",
};

function normalizePath(path: string): string {
	const normalized = path
		.trim()
		.replace(/\\/g, "/")
		.replace(/\/{2,}/g, "/");
	return normalized.length > 1 ? normalized.replace(/\/$/, "") : normalized;
}

function joinPath(parent: string, child: string): string {
	return `${normalizePath(parent)}/${child.replace(/^[/\\]+/, "")}`;
}

function isWithin(parent: string, child: string): boolean {
	const root = normalizePath(parent).toLowerCase();
	const candidate = normalizePath(child).toLowerCase();
	return candidate === root || candidate.startsWith(`${root}/`);
}

function hasTraversal(path: string): boolean {
	return normalizePath(path)
		.split("/")
		.some((segment) => segment === "..");
}

function normalizeRelativePath(path: string): string | null {
	const normalized = path
		.replace(/\\/g, "/")
		.replace(/^\/+/, "")
		.replace(/\/{2,}/g, "/");
	if (
		normalized.length === 0 ||
		normalized.startsWith("../") ||
		normalized.includes("/../") ||
		normalized.includes(":")
	) {
		return null;
	}
	return normalized;
}

function extension(path: string): string {
	return path.split(".").at(-1)?.toLowerCase() ?? "";
}

function slugClassId(classId: string): string {
	const slug = classId
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 64);
	return slug || "catalog-icon";
}

function isHash(value: unknown): value is string {
	return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function isPositiveInteger(value: unknown): value is number {
	return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function createExtractedIconFolderSelection(path: string): ExtractedIconFolderSelection {
	return { path, selectedByUser: true };
}

export async function pickExtractedIconFolder(
	picker: ExtractedIconFolderPicker,
): Promise<ExtractedIconFolderSelection | null> {
	const path = await picker.pickDirectory();
	return path?.trim() ? createExtractedIconFolderSelection(path.trim()) : null;
}

export function validateIconCacheManifest(value: unknown): value is IconCacheManifest {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
	const manifest = value as Partial<IconCacheManifest>;
	if (
		manifest.schemaVersion !== ICON_CACHE_SCHEMA_VERSION ||
		manifest.resolverVersion !== ICON_RESOLVER_VERSION ||
		!isHash(manifest.sourceRootHash) ||
		!isHash(manifest.sourceSetHash) ||
		!Array.isArray(manifest.entries)
	) {
		return false;
	}
	const classIds = new Set<string>();
	return manifest.entries.every((entry) => {
		if (
			typeof entry !== "object" ||
			entry === null ||
			typeof entry.classId !== "string" ||
			classIds.has(entry.classId) ||
			!isIconCategory(entry.category) ||
			typeof entry.assetPath !== "string" ||
			normalizeUnrealIconAssetPath(entry.assetPath) !== entry.assetPath ||
			typeof entry.sourceRelativePath !== "string" ||
			!normalizeRelativePath(entry.sourceRelativePath) ||
			!isHash(entry.sourceHash) ||
			!isSafeCacheRelativePath(entry.cacheRelativePath) ||
			!isHash(entry.cacheHash) ||
			!isPositiveInteger(entry.width) ||
			!isPositiveInteger(entry.height) ||
			entry.width > MAX_ICON_EDGE ||
			entry.height > MAX_ICON_EDGE ||
			entry.format !== "webp"
		) {
			return false;
		}
		classIds.add(entry.classId);
		return true;
	});
}

function validateProcessedImage(image: ProcessedIconImage): boolean {
	return (
		image.format === "webp" &&
		image.bytes.byteLength >= 12 &&
		image.bytes.byteLength <= MAX_ICON_CACHE_BYTES &&
		String.fromCharCode(...image.bytes.subarray(0, 4)) === "RIFF" &&
		String.fromCharCode(...image.bytes.subarray(8, 12)) === "WEBP" &&
		isPositiveInteger(image.width) &&
		isPositiveInteger(image.height) &&
		image.width <= MAX_ICON_EDGE &&
		image.height <= MAX_ICON_EDGE
	);
}

async function authorizeRoots(input: IconCacheBuildInput): Promise<{
	readonly sourceRoot?: string;
	readonly cacheRoot?: string;
	readonly diagnostics: readonly IconDiagnostic[];
}> {
	const diagnostics: IconDiagnostic[] = [];
	try {
		if (!(await input.source.directoryExists(input.selection.path))) {
			throw new Error("missing source");
		}
		const sourceRoot = await input.source.canonicalPath(input.selection.path);
		if (!(await input.cache.directoryExists(input.appDataRoot))) {
			diagnostics.push(
				iconDiagnostic(
					"error",
					"INVALID_CACHE_ROOT",
					"$.appDataRoot",
					"The application data root does not exist.",
					"Create the SatisPlanner application data directory before importing icons.",
				),
			);
			return { diagnostics };
		}
		const appDataRoot = await input.cache.canonicalPath(input.appDataRoot);
		if (hasTraversal(input.cacheRoot) || !isWithin(appDataRoot, input.cacheRoot)) {
			diagnostics.push(
				iconDiagnostic(
					"error",
					"INVALID_CACHE_ROOT",
					"$.cacheRoot",
					"The icon cache root is outside the application-owned data directory.",
					"Use an icon-cache directory below the SatisPlanner application data root.",
				),
			);
			return { diagnostics };
		}
		await input.cache.ensureDirectory(input.cacheRoot);
		const cacheRoot = await input.cache.canonicalPath(input.cacheRoot);
		if (!isWithin(appDataRoot, cacheRoot)) {
			diagnostics.push(
				iconDiagnostic(
					"error",
					"INVALID_CACHE_ROOT",
					"$.cacheRoot",
					"The canonical icon cache path escapes the application data root.",
					"Remove symlink redirection and retry with an app-owned cache directory.",
				),
			);
			return { diagnostics };
		}
		return { sourceRoot, cacheRoot, diagnostics };
	} catch {
		diagnostics.push(
			iconDiagnostic(
				"error",
				"SOURCE_NOT_READABLE",
				"$.selection.path",
				"The selected extracted icon folder could not be read.",
				"Choose a readable folder containing exported PNG, JPEG or WebP files.",
			),
		);
		return { diagnostics };
	}
}

function matchingFiles(
	mapping: IconMapping,
	files: readonly { readonly source: IconSourceFile; readonly relative: string }[],
): readonly { readonly source: IconSourceFile; readonly relative: string }[] {
	if (!mapping.normalizedAssetPath) return [];
	const structuredCandidates = mapping.sourceCandidates.filter((candidate) =>
		candidate.includes("/"),
	);
	const structured = files.filter(({ relative }) =>
		structuredCandidates.some(
			(candidate) =>
				relative.toLowerCase() === candidate || relative.toLowerCase().endsWith(`/${candidate}`),
		),
	);
	if (structured.length > 0) return structured;
	const leafCandidates = new Set(
		mapping.sourceCandidates
			.filter((candidate) => !candidate.includes("/"))
			.map((value) => value.toLowerCase()),
	);
	return files.filter(({ relative }) =>
		leafCandidates.has(relative.split("/").at(-1)?.toLowerCase() ?? ""),
	);
}

async function safeDeleteManifestEntries(
	cache: AppOwnedIconCache,
	cacheRoot: string,
	entries: readonly IconCacheManifestEntry[],
): Promise<{ readonly deleted: readonly string[]; readonly failed: boolean }> {
	const relativePaths = [...new Set(entries.map((entry) => entry.cacheRelativePath))];
	if (relativePaths.some((path) => !isSafeCacheRelativePath(path))) {
		return { deleted: [], failed: true };
	}
	const deleted: string[] = [];
	for (const relativePath of relativePaths) {
		const target = joinPath(cacheRoot, relativePath);
		if (!isWithin(cacheRoot, target)) return { deleted, failed: true };
		try {
			if (await cache.fileExists(target)) {
				await cache.deleteFile(target);
				deleted.push(relativePath);
			}
		} catch {
			return { deleted, failed: true };
		}
	}
	return { deleted, failed: false };
}

export async function buildIconCache(input: IconCacheBuildInput): Promise<IconCacheBuildResult> {
	const authorization = await authorizeRoots(input);
	const diagnostics = [...authorization.diagnostics];
	if (!authorization.sourceRoot || !authorization.cacheRoot) {
		return {
			ok: false,
			diagnostics,
			importedClassIds: [],
			reusedClassIds: [],
			missingClassIds: input.mappings.map((mapping) => mapping.classId),
		};
	}
	const { sourceRoot, cacheRoot } = authorization;
	const manifestPath = joinPath(cacheRoot, ICON_CACHE_MANIFEST_FILE);
	const rawPreviousManifest = await input.cache.readJson(manifestPath);
	const previousManifest = validateIconCacheManifest(rawPreviousManifest)
		? rawPreviousManifest
		: null;
	if (rawPreviousManifest !== null && !previousManifest) {
		diagnostics.push(
			iconDiagnostic(
				"warning",
				"INVALID_CACHE_MANIFEST",
				"$.manifest",
				"The existing icon-cache manifest is invalid and will not authorize deletion or reuse.",
				"Rebuild the cache; remove the invalid app-owned manifest manually if it persists.",
			),
		);
	}

	let listed: readonly IconSourceFile[];
	try {
		listed = await input.source.listFilesRecursively(sourceRoot);
	} catch {
		return {
			ok: false,
			diagnostics: [
				...diagnostics,
				iconDiagnostic(
					"error",
					"SOURCE_NOT_READABLE",
					"$.selection.path",
					"The extracted icon folder could not be enumerated.",
					"Check folder permissions and retry.",
				),
			],
			importedClassIds: [],
			reusedClassIds: [],
			missingClassIds: input.mappings.map((mapping) => mapping.classId),
		};
	}

	const files: Array<{ readonly source: IconSourceFile; readonly relative: string }> = [];
	for (const [index, file] of listed.entries()) {
		const relative = normalizeRelativePath(file.relativePath);
		if (!relative || !SOURCE_MIME_TYPES[extension(relative)]) continue;
		try {
			const canonical = await input.source.canonicalPath(file.path);
			if (!isWithin(sourceRoot, canonical)) {
				diagnostics.push(
					iconDiagnostic(
						"error",
						"SOURCE_NOT_AUTHORIZED",
						`$source[${index}]`,
						"A source icon resolves outside the selected extracted folder.",
						"Remove symlink/path traversal entries before importing.",
					),
				);
				continue;
			}
			if (file.sizeBytes <= 0 || file.sizeBytes > MAX_ICON_SOURCE_BYTES) {
				diagnostics.push(
					iconDiagnostic(
						"warning",
						"SOURCE_TOO_LARGE",
						`$source[${index}]`,
						`The source image ${relative} is empty or exceeds the icon size limit.`,
						"Export a valid image smaller than 8 MiB.",
					),
				);
				continue;
			}
			files.push({ source: { ...file, path: canonical }, relative });
		} catch {
			diagnostics.push(
				iconDiagnostic(
					"warning",
					"SOURCE_NOT_READABLE",
					`$source[${index}]`,
					`The source image ${relative} could not be authorized.`,
					"Check the extracted folder for broken links or permissions.",
				),
			);
		}
	}

	const importedClassIds: string[] = [];
	const reusedClassIds: string[] = [];
	const missingClassIds: string[] = [];
	const entries: IconCacheManifestEntry[] = [];
	const sourceSet: Array<{ readonly relativePath: string; readonly sourceHash: string }> = [];
	const previousEntries = new Map(previousManifest?.entries.map((entry) => [entry.classId, entry]));

	for (const mapping of input.mappings) {
		const matches = matchingFiles(mapping, files);
		if (matches.length !== 1 || !mapping.normalizedAssetPath) {
			missingClassIds.push(mapping.classId);
			if (matches.length > 1) {
				diagnostics.push(
					iconDiagnostic(
						"warning",
						"DUPLICATE_SOURCE_ICON",
						`$icons.${mapping.classId}`,
						`Multiple extracted images match ${mapping.classId}; no arbitrary file was selected.`,
						"Keep one path-preserving export or remove duplicate leaf-name files.",
						mapping.classId,
					),
				);
			}
			continue;
		}
		const match = matches[0];
		if (!match) continue;
		let bytes: Uint8Array;
		try {
			bytes = await input.source.readFile(match.source.path);
		} catch {
			missingClassIds.push(mapping.classId);
			diagnostics.push(
				iconDiagnostic(
					"warning",
					"SOURCE_NOT_READABLE",
					`$icons.${mapping.classId}`,
					`The matched image for ${mapping.classId} could not be read.`,
					"Re-export the image or fix folder permissions.",
					mapping.classId,
				),
			);
			continue;
		}
		if (bytes.byteLength !== match.source.sizeBytes || bytes.byteLength > MAX_ICON_SOURCE_BYTES) {
			missingClassIds.push(mapping.classId);
			diagnostics.push(
				iconDiagnostic(
					"warning",
					"SOURCE_TOO_LARGE",
					`$icons.${mapping.classId}`,
					`The matched image for ${mapping.classId} changed during import or exceeds the size limit.`,
					"Retry after the extracted folder is no longer being modified.",
					mapping.classId,
				),
			);
			continue;
		}
		const sourceHash = await sha256Hex(bytes);
		sourceSet.push({ relativePath: match.relative, sourceHash });
		const previous = previousEntries.get(mapping.classId);
		if (
			previous?.assetPath === mapping.normalizedAssetPath &&
			previous.sourceHash === sourceHash &&
			(await input.cache.fileExists(joinPath(cacheRoot, previous.cacheRelativePath)))
		) {
			entries.push(previous);
			reusedClassIds.push(mapping.classId);
			continue;
		}

		try {
			const mimeType = SOURCE_MIME_TYPES[extension(match.relative)];
			if (!mimeType) throw new Error("unsupported source format");
			const processed = await input.processor.process(bytes, mimeType);
			if (!validateProcessedImage(processed)) throw new Error("invalid processed image");
			const cacheHash = await sha256Hex(processed.bytes);
			const classHash = await sha256Text(mapping.classId);
			const cacheRelativePath = `icons/${slugClassId(mapping.classId).slice(0, 48)}-${classHash.slice(0, 8)}-${sourceHash.slice(0, 16)}.webp`;
			if (!isSafeCacheRelativePath(cacheRelativePath)) throw new Error("unsafe cache path");
			await input.cache.ensureDirectory(joinPath(cacheRoot, "icons"));
			await input.cache.writeFileAtomic(joinPath(cacheRoot, cacheRelativePath), processed.bytes);
			entries.push({
				classId: mapping.classId,
				category: mapping.category,
				assetPath: mapping.normalizedAssetPath,
				sourceRelativePath: match.relative,
				sourceHash,
				cacheRelativePath,
				cacheHash,
				width: processed.width,
				height: processed.height,
				format: "webp",
			});
			importedClassIds.push(mapping.classId);
		} catch {
			missingClassIds.push(mapping.classId);
			diagnostics.push(
				iconDiagnostic(
					"warning",
					"INVALID_IMAGE",
					`$icons.${mapping.classId}`,
					`The matched image for ${mapping.classId} could not be decoded into a safe cache entry.`,
					"Export a valid PNG, JPEG or WebP image and retry; the generic fallback remains active.",
					mapping.classId,
				),
			);
		}
	}

	entries.sort((left, right) => left.classId.localeCompare(right.classId));
	sourceSet.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
	const manifest: IconCacheManifest = {
		schemaVersion: ICON_CACHE_SCHEMA_VERSION,
		resolverVersion: ICON_RESOLVER_VERSION,
		sourceRootHash: await sha256Text(normalizePath(sourceRoot).toLowerCase()),
		sourceSetHash: await sha256Text(canonicalJson(sourceSet as unknown as CanonicalJsonValue)),
		entries,
	};
	try {
		await input.cache.writeJsonAtomic(manifestPath, manifest);
	} catch {
		const imported = new Set(importedClassIds);
		await safeDeleteManifestEntries(
			input.cache,
			cacheRoot,
			entries.filter((entry) => imported.has(entry.classId)),
		);
		return {
			ok: false,
			diagnostics: [
				...diagnostics,
				iconDiagnostic(
					"error",
					"CACHE_WRITE_FAILED",
					"$.cache",
					"The app-owned icon cache could not be committed atomically.",
					"Keep the previous manifest active and check application data permissions.",
				),
			],
			importedClassIds,
			reusedClassIds,
			missingClassIds,
		};
	}
	if (previousManifest) {
		const active = new Set(entries.map((entry) => entry.cacheRelativePath));
		const cleanup = await safeDeleteManifestEntries(
			input.cache,
			cacheRoot,
			previousManifest.entries.filter((entry) => !active.has(entry.cacheRelativePath)),
		);
		if (cleanup.failed) {
			diagnostics.push(
				iconDiagnostic(
					"warning",
					"CACHE_CLEANUP_INCOMPLETE",
					"$.cache",
					"The new manifest is active, but one stale allowlisted cache entry could not be removed.",
					"Retry the clear action after checking application data permissions.",
				),
			);
		}
	}
	return {
		ok: true,
		manifest: Object.freeze(manifest),
		diagnostics: Object.freeze(diagnostics),
		importedClassIds: Object.freeze(importedClassIds.sort()),
		reusedClassIds: Object.freeze(reusedClassIds.sort()),
		missingClassIds: Object.freeze([...new Set(missingClassIds)].sort()),
	};
}

export async function clearIconCache(
	cache: AppOwnedIconCache,
	appDataRootPath: string,
	cacheRootPath: string,
	manifestValue: unknown,
): Promise<IconCacheClearResult> {
	if (!validateIconCacheManifest(manifestValue)) {
		return {
			ok: false,
			deleted: [],
			diagnostics: [
				iconDiagnostic(
					"error",
					"CACHE_CLEAR_REJECTED",
					"$.manifest",
					"Cache clearing was rejected because the manifest allowlist is invalid.",
					"Do not perform recursive deletion; repair or replace the app-owned manifest.",
				),
			],
		};
	}
	try {
		const appDataRoot = await cache.canonicalPath(appDataRootPath);
		const cacheRoot = await cache.canonicalPath(cacheRootPath);
		if (!isWithin(appDataRoot, cacheRoot)) throw new Error("cache root escape");
		const cleanup = await safeDeleteManifestEntries(cache, cacheRoot, manifestValue.entries);
		const deleted = [...cleanup.deleted];
		if (cleanup.failed) {
			return {
				ok: false,
				deleted: Object.freeze(deleted.sort()),
				diagnostics: [
					iconDiagnostic(
						"error",
						"CACHE_CLEANUP_INCOMPLETE",
						"$.cache",
						"Cache clearing stopped after a manifest-allowlisted file could not be removed.",
						"Retry after checking application data permissions; no unlisted path was touched.",
					),
				],
			};
		}
		const manifestPath = joinPath(cacheRoot, ICON_CACHE_MANIFEST_FILE);
		if (await cache.fileExists(manifestPath)) {
			try {
				await cache.deleteFile(manifestPath);
				deleted.push(ICON_CACHE_MANIFEST_FILE);
			} catch {
				return {
					ok: false,
					deleted: Object.freeze(deleted.sort()),
					diagnostics: [
						iconDiagnostic(
							"error",
							"CACHE_CLEANUP_INCOMPLETE",
							"$.manifest",
							"Allowlisted icon files were removed, but the cache manifest could not be deleted.",
							"Retry after checking application data permissions.",
						),
					],
				};
			}
		}
		return { ok: true, deleted: Object.freeze(deleted.sort()), diagnostics: [] };
	} catch {
		return {
			ok: false,
			deleted: [],
			diagnostics: [
				iconDiagnostic(
					"error",
					"CACHE_CLEAR_REJECTED",
					"$.cacheRoot",
					"Cache clearing was rejected because the canonical cache root is not app-owned.",
					"Choose the SatisPlanner icon-cache directory under application data.",
				),
			],
		};
	}
}
