import { describe, expect, it } from "vitest";
import type { CatalogSnapshot } from "./catalog";
import {
	buildLocalizedSearchAliases,
	localizedSearchMatch,
	resolveCatalogLocale,
} from "./localization";

function snapshot(locale: string, itemName: string): CatalogSnapshot {
	return {
		schemaVersion: 2,
		snapshotId: `snapshot-${locale}`,
		provenance: {
			sourceKind: "custom",
			sourceFormat: "localized",
			sourceFileName: `${locale}.json`,
			sourceEncoding: "utf-8",
			sourceHash: "a".repeat(64),
			normalizedHash: "b".repeat(64),
			importerVersion: "1.1.0",
			gameVersion: "1.2",
			buildId: null,
			locale,
		},
		catalog: {
			items: [
				{
					id: "Desc_IronPlate_C",
					displayName: itemName,
					description: "",
					iconAssetPath: null,
					form: "solid",
					materialForm: "solid",
				},
			],
			buildings: [],
			recipes: [],
		},
	};
}

describe("localized game catalogs", () => {
	const english = snapshot("en-US", "Iron Plate");
	const turkish = snapshot("tr", "Demir Plaka");

	it("selects game-data locale independently and falls back deterministically", () => {
		expect(resolveCatalogLocale([english, turkish], "tr-TR")?.resolvedLocale).toBe("tr");
		expect(resolveCatalogLocale([english, turkish], "de-DE")?.resolvedLocale).toBe("en-US");
		expect(resolveCatalogLocale([], "tr")).toBeUndefined();
	});

	it("keeps stable ids while adding aliases from every locale", () => {
		const aliases = buildLocalizedSearchAliases([english.catalog, turkish.catalog]);
		expect(aliases.get("Desc_IronPlate_C")).toEqual([
			"Demir Plaka",
			"Desc_IronPlate_C",
			"Iron Plate",
		]);
		expect(localizedSearchMatch("DEMİR", aliases.get("Desc_IronPlate_C") ?? [], "tr")).toBe(true);
		expect(localizedSearchMatch("iron", aliases.get("Desc_IronPlate_C") ?? [], "tr")).toBe(true);
	});
});
