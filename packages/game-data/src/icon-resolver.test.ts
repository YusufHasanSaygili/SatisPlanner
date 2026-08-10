import { describe, expect, it } from "vitest";
import type { NormalizedCatalog } from "./catalog";
import {
	FALLBACK_ICON_PATHS,
	createCatalogIconInputs,
	createIconMappings,
	normalizeUnrealIconAssetPath,
	resolveIcon,
} from "./icon-resolver";
import type { CatalogIconInput, IconCacheManifest } from "./icon-types";

const safeAsset =
	"Texture2D /Game/Synthetic/Resource/Ore/UI/IconDesc_SP_Ore_256.IconDesc_SP_Ore_256";

describe("local-only icon resolver", () => {
	it("normalizes Unreal asset keys but rejects URLs, Windows paths and traversal", () => {
		expect(normalizeUnrealIconAssetPath(safeAsset)).toBe(
			"/Game/Synthetic/Resource/Ore/UI/IconDesc_SP_Ore_256",
		);
		expect(normalizeUnrealIconAssetPath("https://example.test/Game/Icon.Icon")).toBeNull();
		expect(normalizeUnrealIconAssetPath("C:\\Game\\Icon.png")).toBeNull();
		expect(normalizeUnrealIconAssetPath("Texture2D /Game/../private/Icon.Icon")).toBeNull();
	});

	it("reports duplicate class mappings and preserves intentional shared assets", () => {
		const inputs: CatalogIconInput[] = [
			{ classId: "Desc_A_C", category: "material-solid", assetPath: safeAsset },
			{ classId: "Desc_B_C", category: "material-solid", assetPath: safeAsset },
			{ classId: "Desc_A_C", category: "unknown", assetPath: null },
		];
		const result = createIconMappings(inputs);
		expect(result.mappings).toHaveLength(2);
		expect(result.diagnostics.map((entry) => entry.code)).toEqual([
			"DUPLICATE_CLASS_MAPPING",
			"SHARED_ASSET_MAPPING",
		]);
	});

	it("derives item, building and recipe mappings from the normalized catalog", () => {
		const catalog: NormalizedCatalog = {
			items: [
				{
					id: "Desc_A_C",
					displayName: "A",
					description: "",
					iconAssetPath: safeAsset,
					form: "solid",
					materialForm: "solid",
				},
			],
			buildings: [
				{
					id: "Build_A_C",
					displayName: "Builder",
					powerConsumptionMW: { numerator: "4", denominator: "1" },
					powerShardSlots: 3,
					somersloopSlots: 1,
				},
			],
			recipes: [
				{
					id: "Recipe_A_C",
					displayName: "Recipe",
					durationSeconds: { numerator: "1", denominator: "1" },
					ingredients: [],
					products: [
						{
							itemId: "Desc_A_C",
							amount: { numerator: "1", denominator: "1" },
							ratePerMinute: { numerator: "60", denominator: "1" },
						},
					],
					producedIn: ["Build_A_C"],
				},
			],
		};
		const inputs = createCatalogIconInputs(catalog);
		expect(inputs).toEqual([
			{ classId: "Build_A_C", category: "building", assetPath: null },
			{ classId: "Desc_A_C", category: "material-solid", assetPath: safeAsset },
			{ classId: "Recipe_A_C", category: "recipe", assetPath: safeAsset },
		]);
	});

	it("uses only allowlisted generic fallbacks when cache entries are missing or unsafe", () => {
		const mapping = createIconMappings([
			{ classId: "Desc_A_C", category: "material-solid", assetPath: safeAsset },
		]).mappings[0];
		if (!mapping) throw new Error("mapping missing");
		const unsafeManifest = {
			entries: [
				{
					classId: "Desc_A_C",
					assetPath: mapping.normalizedAssetPath,
					cacheRelativePath: "../../private.png",
					cacheHash: "a".repeat(64),
				},
			],
		} as unknown as IconCacheManifest;
		expect(resolveIcon(mapping, null).resource).toEqual({
			kind: "fallback",
			classId: "Desc_A_C",
			fallbackId: "material-solid",
			relativePath: "fallback-icons/material-solid.svg",
		});
		expect(resolveIcon(mapping, unsafeManifest).resource.kind).toBe("fallback");
		expect(FALLBACK_ICON_PATHS).toMatchInlineSnapshot(`
			{
			  "building": "fallback-icons/building.svg",
			  "material-fluid": "fallback-icons/material-fluid.svg",
			  "material-solid": "fallback-icons/material-solid.svg",
			  "recipe": "fallback-icons/recipe.svg",
			  "unknown": "fallback-icons/unknown.svg",
			}
		`);
	});
});
