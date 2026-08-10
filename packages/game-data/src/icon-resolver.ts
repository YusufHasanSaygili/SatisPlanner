import type { NormalizedCatalog } from "./catalog";
import {
	type CatalogIconInput,
	type IconCacheManifest,
	type IconCategory,
	type IconMapping,
	type IconMappingResult,
	type IconResolution,
	iconDiagnostic,
} from "./icon-types";

const SOURCE_EXTENSIONS = ["png", "webp", "jpg", "jpeg"] as const;

export const FALLBACK_ICON_PATHS: Readonly<Record<IconCategory, string>> = Object.freeze({
	"material-solid": "fallback-icons/material-solid.svg",
	"material-fluid": "fallback-icons/material-fluid.svg",
	building: "fallback-icons/building.svg",
	recipe: "fallback-icons/recipe.svg",
	unknown: "fallback-icons/unknown.svg",
});

function normalizedRelativePath(path: string): string {
	return path
		.replace(/\\/g, "/")
		.replace(/^\/+/, "")
		.replace(/\/{2,}/g, "/")
		.toLowerCase();
}

export function isSafeCacheRelativePath(path: string): boolean {
	return /^icons\/[a-z0-9][a-z0-9-]{0,96}-[0-9a-f]{16}\.webp$/.test(path);
}

export function normalizeUnrealIconAssetPath(value: string): string | null {
	const trimmed = value.trim();
	if (
		trimmed.length === 0 ||
		trimmed.includes("://") ||
		/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ||
		trimmed.includes("\\")
	) {
		return null;
	}
	const match = /\/Game\/[A-Za-z0-9_./-]+/.exec(trimmed);
	if (!match) return null;
	const segments = match[0].split("/").filter(Boolean);
	if (segments[0]?.toLowerCase() !== "game" || segments.some((segment) => segment === "..")) {
		return null;
	}
	const leaf = segments.at(-1);
	if (!leaf) return null;
	const packageLeaf = leaf.split(".")[0];
	if (!packageLeaf || !/^[A-Za-z0-9_-]+$/.test(packageLeaf)) return null;
	segments[segments.length - 1] = packageLeaf;
	return `/${segments.join("/")}`;
}

function sourceCandidates(assetPath: string): readonly string[] {
	const withoutLeadingSlash = assetPath.replace(/^\//, "");
	const withoutGame = withoutLeadingSlash.replace(/^Game\//i, "");
	const leaf = withoutLeadingSlash.split("/").at(-1);
	if (!leaf) return [];
	const candidates = new Set<string>();
	for (const extension of SOURCE_EXTENSIONS) {
		candidates.add(normalizedRelativePath(`${withoutLeadingSlash}.${extension}`));
		candidates.add(normalizedRelativePath(`${withoutGame}.${extension}`));
		candidates.add(normalizedRelativePath(`${leaf}.${extension}`));
	}
	return Object.freeze([...candidates]);
}

export function createCatalogIconInputs(catalog: NormalizedCatalog): readonly CatalogIconInput[] {
	const items = new Map(catalog.items.map((item) => [item.id, item]));
	const inputs: CatalogIconInput[] = catalog.items.map((item) => ({
		classId: item.id,
		category: item.materialForm === "fluid" ? "material-fluid" : "material-solid",
		assetPath: item.iconAssetPath,
	}));
	for (const building of catalog.buildings) {
		inputs.push({ classId: building.id, category: "building", assetPath: null });
	}
	for (const recipe of catalog.recipes) {
		const productIcon = recipe.products
			.map((product) => items.get(product.itemId)?.iconAssetPath)
			.find((assetPath): assetPath is string => Boolean(assetPath));
		inputs.push({ classId: recipe.id, category: "recipe", assetPath: productIcon ?? null });
	}
	return Object.freeze(inputs.sort((left, right) => left.classId.localeCompare(right.classId)));
}

export function createIconMappings(inputs: readonly CatalogIconInput[]): IconMappingResult {
	const diagnostics = [];
	const mappings: IconMapping[] = [];
	const classIds = new Set<string>();
	const assetOwners = new Map<string, string[]>();

	for (const [index, input] of inputs.entries()) {
		if (classIds.has(input.classId)) {
			diagnostics.push(
				iconDiagnostic(
					"error",
					"DUPLICATE_CLASS_MAPPING",
					`$inputs[${index}].classId`,
					`Icon mapping for ${input.classId} is duplicated.`,
					"Keep one deterministic mapping per stable catalog class id.",
					input.classId,
				),
			);
			continue;
		}
		classIds.add(input.classId);
		const normalizedAssetPath = input.assetPath
			? normalizeUnrealIconAssetPath(input.assetPath)
			: null;
		if (input.assetPath && !normalizedAssetPath) {
			diagnostics.push(
				iconDiagnostic(
					"warning",
					"INVALID_ASSET_PATH",
					`$inputs[${index}].assetPath`,
					`The icon asset key for ${input.classId} is not a safe /Game path.`,
					"Use the generic fallback and re-import a supported Docs snapshot.",
					input.classId,
				),
			);
		}
		if (normalizedAssetPath) {
			const owners = assetOwners.get(normalizedAssetPath) ?? [];
			owners.push(input.classId);
			assetOwners.set(normalizedAssetPath, owners);
		}
		mappings.push({
			classId: input.classId,
			category: input.category,
			normalizedAssetPath,
			sourceCandidates: normalizedAssetPath ? sourceCandidates(normalizedAssetPath) : [],
		});
	}

	for (const [assetPath, owners] of assetOwners) {
		if (owners.length < 2) continue;
		diagnostics.push(
			iconDiagnostic(
				"warning",
				"SHARED_ASSET_MAPPING",
				"$inputs",
				`${owners.length} catalog classes intentionally share ${assetPath}.`,
				"The cache will create independently addressed entries from the same source image.",
			),
		);
	}

	return {
		mappings: Object.freeze(
			mappings.sort((left, right) => left.classId.localeCompare(right.classId)),
		),
		diagnostics: Object.freeze(diagnostics),
	};
}

export function resolveIcon(
	mapping: IconMapping,
	manifest: IconCacheManifest | null,
): IconResolution {
	const cached = manifest?.entries.find(
		(entry) =>
			entry.classId === mapping.classId &&
			entry.assetPath === mapping.normalizedAssetPath &&
			isSafeCacheRelativePath(entry.cacheRelativePath) &&
			/^[0-9a-f]{64}$/.test(entry.cacheHash),
	);
	if (cached) {
		return {
			resource: {
				kind: "cache",
				classId: mapping.classId,
				relativePath: cached.cacheRelativePath,
				contentHash: cached.cacheHash,
			},
			diagnostics: [],
		};
	}
	return {
		resource: {
			kind: "fallback",
			classId: mapping.classId,
			fallbackId: mapping.category,
			relativePath: FALLBACK_ICON_PATHS[mapping.category],
		},
		diagnostics: [
			iconDiagnostic(
				"warning",
				"ICON_NOT_AVAILABLE",
				`$icons.${mapping.classId}`,
				`No verified local cache entry is available for ${mapping.classId}.`,
				"The generic category fallback is active; choose an extracted asset folder to import icons.",
				mapping.classId,
			),
		],
	};
}
