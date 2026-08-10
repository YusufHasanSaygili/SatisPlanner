export const ICON_CACHE_SCHEMA_VERSION = 1 as const;
export const ICON_RESOLVER_VERSION = "1.0.0" as const;
export const ICON_CACHE_MANIFEST_FILE = "icon-cache-manifest.json" as const;
export const MAX_ICON_SOURCE_BYTES = 8 * 1024 * 1024;
export const MAX_ICON_CACHE_BYTES = 2 * 1024 * 1024;
export const MAX_ICON_EDGE = 128;

export type IconCategory = "material-solid" | "material-fluid" | "building" | "recipe" | "unknown";

export function isIconCategory(value: unknown): value is IconCategory {
	return ["material-solid", "material-fluid", "building", "recipe", "unknown"].includes(
		String(value),
	);
}

export type IconDiagnosticCode =
	| "INVALID_ASSET_PATH"
	| "DUPLICATE_CLASS_MAPPING"
	| "SHARED_ASSET_MAPPING"
	| "ICON_NOT_AVAILABLE"
	| "SOURCE_NOT_READABLE"
	| "SOURCE_NOT_AUTHORIZED"
	| "SOURCE_TOO_LARGE"
	| "INVALID_IMAGE"
	| "DUPLICATE_SOURCE_ICON"
	| "INVALID_CACHE_ROOT"
	| "INVALID_CACHE_MANIFEST"
	| "CACHE_WRITE_FAILED"
	| "CACHE_CLEANUP_INCOMPLETE"
	| "CACHE_CLEAR_REJECTED";

export interface IconDiagnostic {
	readonly severity: "error" | "warning";
	readonly code: IconDiagnosticCode;
	readonly path: string;
	readonly classId?: string;
	readonly message: string;
	readonly suggestion: string;
}

export interface CatalogIconInput {
	readonly classId: string;
	readonly category: IconCategory;
	readonly assetPath: string | null;
}

export interface IconMapping {
	readonly classId: string;
	readonly category: IconCategory;
	readonly normalizedAssetPath: string | null;
	readonly sourceCandidates: readonly string[];
}

export interface IconMappingResult {
	readonly mappings: readonly IconMapping[];
	readonly diagnostics: readonly IconDiagnostic[];
}

export interface IconCacheManifestEntry {
	readonly classId: string;
	readonly category: IconCategory;
	readonly assetPath: string;
	readonly sourceRelativePath: string;
	readonly sourceHash: string;
	readonly cacheRelativePath: string;
	readonly cacheHash: string;
	readonly width: number;
	readonly height: number;
	readonly format: "webp";
}

export interface IconCacheManifest {
	readonly schemaVersion: typeof ICON_CACHE_SCHEMA_VERSION;
	readonly resolverVersion: typeof ICON_RESOLVER_VERSION;
	readonly sourceRootHash: string;
	readonly sourceSetHash: string;
	readonly entries: readonly IconCacheManifestEntry[];
}

export type IconResource =
	| {
			readonly kind: "cache";
			readonly classId: string;
			readonly relativePath: string;
			readonly contentHash: string;
	  }
	| {
			readonly kind: "fallback";
			readonly classId: string;
			readonly fallbackId: IconCategory;
			readonly relativePath: string;
	  };

export interface IconResolution {
	readonly resource: IconResource;
	readonly diagnostics: readonly IconDiagnostic[];
}

export function iconDiagnostic(
	severity: IconDiagnostic["severity"],
	code: IconDiagnosticCode,
	path: string,
	message: string,
	suggestion: string,
	classId?: string,
): IconDiagnostic {
	return classId
		? { severity, code, path, classId, message, suggestion }
		: { severity, code, path, message, suggestion };
}
