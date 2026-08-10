import type { RationalJson } from "@satisplanner/domain";
import type { DocsEncoding } from "./encoding";

export const CATALOG_SCHEMA_VERSION = 1 as const;
export const GAME_DATA_IMPORTER_VERSION = "1.0.0" as const;

export type CatalogItemForm = "solid" | "liquid" | "gas";
export type CatalogMaterialForm = "solid" | "fluid";

export interface CatalogItem {
	readonly id: string;
	readonly displayName: string;
	readonly description: string;
	readonly form: CatalogItemForm;
	readonly materialForm: CatalogMaterialForm;
}

export interface CatalogBuilding {
	readonly id: string;
	readonly displayName: string;
	readonly powerConsumptionMW: RationalJson;
	readonly powerShardSlots: number;
	readonly somersloopSlots: number;
}

export interface CatalogRecipeAmount {
	readonly itemId: string;
	readonly amount: RationalJson;
	readonly ratePerMinute: RationalJson;
}

export interface CatalogRecipe {
	readonly id: string;
	readonly displayName: string;
	readonly durationSeconds: RationalJson;
	readonly ingredients: readonly CatalogRecipeAmount[];
	readonly products: readonly CatalogRecipeAmount[];
	readonly producedIn: readonly string[];
}

export interface NormalizedCatalog {
	readonly items: readonly CatalogItem[];
	readonly buildings: readonly CatalogBuilding[];
	readonly recipes: readonly CatalogRecipe[];
}

export interface CatalogProvenance {
	readonly sourceKind: "steam" | "epic" | "custom";
	readonly sourceFormat: "localized" | "legacy";
	readonly sourceFileName: string;
	readonly sourceEncoding: DocsEncoding;
	readonly sourceHash: string;
	readonly normalizedHash: string;
	readonly importerVersion: typeof GAME_DATA_IMPORTER_VERSION;
	readonly gameVersion: string;
	readonly buildId: string | null;
	readonly locale: string;
}

export interface CatalogSnapshot {
	readonly schemaVersion: typeof CATALOG_SCHEMA_VERSION;
	readonly snapshotId: string;
	readonly provenance: CatalogProvenance;
	readonly catalog: NormalizedCatalog;
}

export interface CatalogRecipeChange {
	readonly id: string;
	readonly before: CatalogRecipe;
	readonly after: CatalogRecipe;
}

export interface CatalogSnapshotDiff {
	readonly fromSnapshotId: string;
	readonly toSnapshotId: string;
	readonly addedRecipeIds: readonly string[];
	readonly removedRecipeIds: readonly string[];
	readonly changedRecipes: readonly CatalogRecipeChange[];
}
