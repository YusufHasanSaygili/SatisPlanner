import { Rational } from "@satisplanner/domain";
import {
	CATALOG_SCHEMA_VERSION,
	GAME_DATA_IMPORTER_VERSION,
	type CatalogRecipe,
	type CatalogSnapshot,
	type CatalogSnapshotDiff,
	type NormalizedCatalog,
} from "./catalog";
import { type CanonicalJsonValue, canonicalJson, sha256Hex, sha256Text } from "./canonical";
import { decodeDocsBytes } from "./encoding";
import { normalizeDocs, parseDocsJson } from "./docs-parser";
import { type GameDataDiagnostic, GameDataImportError, errorDiagnostic } from "./errors";

export interface DocsImportInput {
	readonly bytes: Uint8Array;
	readonly fileName: string;
	readonly sourceKind: "steam" | "epic" | "custom";
	readonly gameVersion: string;
	readonly buildId?: string;
	readonly locale?: string;
}

export type DocsImportResult =
	| {
			readonly ok: true;
			readonly snapshot: CatalogSnapshot;
			readonly diagnostics: readonly GameDataDiagnostic[];
	  }
	| { readonly ok: false; readonly diagnostics: readonly GameDataDiagnostic[] };

export interface CatalogActivationPreview {
	readonly currentSnapshot: CatalogSnapshot;
	readonly nextSnapshot: CatalogSnapshot;
	readonly diff: CatalogSnapshotDiff;
	readonly breakingRecipeIds: readonly string[];
}

export type CatalogActivationResult =
	| {
			readonly ok: true;
			readonly activeSnapshot: CatalogSnapshot;
			readonly rollbackSnapshot: CatalogSnapshot;
	  }
	| { readonly ok: false; readonly diagnostic: GameDataDiagnostic };

function deepFreeze<T>(value: T): T {
	if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
	Object.freeze(value);
	for (const child of Object.values(value)) deepFreeze(child);
	return value;
}

function localeFromFileName(fileName: string): string {
	if (fileName.toLowerCase() === "docs.json") return "legacy";
	return fileName.replace(/\.json$/i, "") || "unknown";
}

function canonicalCatalog(catalog: NormalizedCatalog): string {
	return canonicalJson(catalog as unknown as CanonicalJsonValue);
}

function validateHash(value: string): boolean {
	return /^[0-9a-f]{64}$/.test(value);
}

export function validateCatalogSnapshot(snapshot: CatalogSnapshot): readonly GameDataDiagnostic[] {
	const diagnostics: GameDataDiagnostic[] = [];
	if (snapshot.schemaVersion !== CATALOG_SCHEMA_VERSION) {
		diagnostics.push(
			errorDiagnostic(
				"INVALID_SNAPSHOT",
				"$.schemaVersion",
				`Unsupported catalog schema version ${snapshot.schemaVersion}.`,
				`Use catalog schema version ${CATALOG_SCHEMA_VERSION}.`,
			),
		);
	}
	if (!validateHash(snapshot.provenance.sourceHash)) {
		diagnostics.push(
			errorDiagnostic(
				"INVALID_SNAPSHOT",
				"$.provenance.sourceHash",
				"Snapshot sourceHash is not a SHA-256 digest.",
				"Re-import the source rather than editing snapshot metadata.",
			),
		);
	}
	if (!validateHash(snapshot.provenance.normalizedHash)) {
		diagnostics.push(
			errorDiagnostic(
				"INVALID_SNAPSHOT",
				"$.provenance.normalizedHash",
				"Snapshot normalizedHash is not a SHA-256 digest.",
				"Re-import the source rather than editing snapshot metadata.",
			),
		);
	}

	const itemIds = new Set<string>();
	for (const [index, item] of snapshot.catalog.items.entries()) {
		if (itemIds.has(item.id)) {
			diagnostics.push(
				errorDiagnostic(
					"DUPLICATE_CLASS_ID",
					`$.catalog.items[${index}].id`,
					`Duplicate item id ${item.id}.`,
					"Reject this snapshot and re-import the source.",
				),
			);
		}
		itemIds.add(item.id);
	}
	const buildingIds = new Set<string>();
	for (const [index, building] of snapshot.catalog.buildings.entries()) {
		if (buildingIds.has(building.id)) {
			diagnostics.push(
				errorDiagnostic(
					"DUPLICATE_CLASS_ID",
					`$.catalog.buildings[${index}].id`,
					`Duplicate building id ${building.id}.`,
					"Reject this snapshot and re-import the source.",
				),
			);
		}
		buildingIds.add(building.id);
	}
	const recipeIds = new Set<string>();
	for (const [index, recipe] of snapshot.catalog.recipes.entries()) {
		const path = `$.catalog.recipes[${index}]`;
		if (recipeIds.has(recipe.id)) {
			diagnostics.push(
				errorDiagnostic(
					"DUPLICATE_CLASS_ID",
					`${path}.id`,
					`Duplicate recipe id ${recipe.id}.`,
					"Reject this snapshot and re-import the source.",
				),
			);
		}
		recipeIds.add(recipe.id);
		try {
			if (Rational.parse(recipe.durationSeconds).compare(Rational.create(0n)) <= 0) {
				throw new Error("non-positive duration");
			}
		} catch {
			diagnostics.push(
				errorDiagnostic(
					"INVALID_RECIPE_DURATION",
					`${path}.durationSeconds`,
					`Recipe ${recipe.id} has an invalid duration.`,
					"Reject this snapshot and re-import the source.",
				),
			);
		}
		for (const [amountIndex, amount] of [...recipe.ingredients, ...recipe.products].entries()) {
			if (!itemIds.has(amount.itemId)) {
				diagnostics.push(
					errorDiagnostic(
						"MISSING_CLASS_REFERENCE",
						`${path}.amounts[${amountIndex}].itemId`,
						`Recipe ${recipe.id} references missing item ${amount.itemId}.`,
						"Reject this snapshot and re-import the source.",
					),
				);
			}
		}
		for (const [buildingIndex, buildingId] of recipe.producedIn.entries()) {
			if (!buildingIds.has(buildingId)) {
				diagnostics.push(
					errorDiagnostic(
						"MISSING_CLASS_REFERENCE",
						`${path}.producedIn[${buildingIndex}]`,
						`Recipe ${recipe.id} references missing building ${buildingId}.`,
						"Reject this snapshot and re-import the source.",
					),
				);
			}
		}
	}
	return diagnostics;
}

export async function verifyCatalogSnapshotIntegrity(
	snapshot: CatalogSnapshot,
): Promise<readonly GameDataDiagnostic[]> {
	const diagnostics = [...validateCatalogSnapshot(snapshot)];
	const calculatedHash = await sha256Text(canonicalCatalog(snapshot.catalog));
	if (calculatedHash !== snapshot.provenance.normalizedHash) {
		diagnostics.push(
			errorDiagnostic(
				"INVALID_SNAPSHOT",
				"$.provenance.normalizedHash",
				"Snapshot content does not match its normalizedHash.",
				"Reject the snapshot and re-import the original Docs source.",
			),
		);
	}
	return diagnostics;
}

export async function importDocsSnapshot(input: DocsImportInput): Promise<DocsImportResult> {
	try {
		if (input.gameVersion.trim().length === 0) {
			throw new GameDataImportError(
				errorDiagnostic(
					"INVALID_SNAPSHOT",
					"$.gameVersion",
					"A game version is required for catalog provenance.",
					"Provide the detected or user-confirmed Satisfactory version.",
				),
			);
		}
		const sourceHash = await sha256Hex(input.bytes);
		const decoded = decodeDocsBytes(input.bytes);
		const parsed = parseDocsJson(decoded.text, input.fileName);
		const normalized = normalizeDocs(parsed);
		if (!normalized.ok || !normalized.catalog) {
			return { ok: false, diagnostics: normalized.diagnostics };
		}
		const normalizedHash = await sha256Text(canonicalCatalog(normalized.catalog));
		const snapshot: CatalogSnapshot = {
			schemaVersion: CATALOG_SCHEMA_VERSION,
			snapshotId: `satisfactory-${input.gameVersion}-${normalizedHash.slice(0, 24)}`,
			provenance: {
				sourceKind: input.sourceKind,
				sourceFormat: parsed.format,
				sourceFileName: input.fileName,
				sourceEncoding: decoded.encoding,
				sourceHash,
				normalizedHash,
				importerVersion: GAME_DATA_IMPORTER_VERSION,
				gameVersion: input.gameVersion,
				buildId: input.buildId ?? null,
				locale: input.locale ?? localeFromFileName(input.fileName),
			},
			catalog: normalized.catalog,
		};
		const validation = validateCatalogSnapshot(snapshot);
		if (validation.some((diagnostic) => diagnostic.severity === "error")) {
			return { ok: false, diagnostics: validation };
		}
		return {
			ok: true,
			snapshot: deepFreeze(snapshot),
			diagnostics: Object.freeze([...normalized.diagnostics, ...validation]),
		};
	} catch (error) {
		if (error instanceof GameDataImportError) {
			return { ok: false, diagnostics: [error.diagnostic] };
		}
		return {
			ok: false,
			diagnostics: [
				errorDiagnostic(
					"INVALID_SNAPSHOT",
					"$",
					"The Docs import failed without producing a partial snapshot.",
					"Verify the selected file and retry; report the importer version if the problem persists.",
				),
			],
		};
	}
}

export function serializeCatalogSnapshot(snapshot: CatalogSnapshot): string {
	const diagnostics = validateCatalogSnapshot(snapshot);
	if (diagnostics.length > 0) throw new GameDataImportError(diagnostics[0] as GameDataDiagnostic);
	return `${canonicalJson(snapshot as unknown as CanonicalJsonValue)}\n`;
}

function recipeMap(snapshot: CatalogSnapshot): ReadonlyMap<string, CatalogRecipe> {
	return new Map(snapshot.catalog.recipes.map((recipe) => [recipe.id, recipe]));
}

export function diffCatalogSnapshots(
	current: CatalogSnapshot,
	next: CatalogSnapshot,
): CatalogSnapshotDiff {
	const before = recipeMap(current);
	const after = recipeMap(next);
	const addedRecipeIds = [...after.keys()].filter((id) => !before.has(id)).sort();
	const removedRecipeIds = [...before.keys()].filter((id) => !after.has(id)).sort();
	const changedRecipes = [...before.keys()]
		.filter((id) => after.has(id))
		.flatMap((id) => {
			const beforeRecipe = before.get(id);
			const afterRecipe = after.get(id);
			if (!beforeRecipe || !afterRecipe) return [];
			if (
				canonicalJson(beforeRecipe as unknown as CanonicalJsonValue) ===
				canonicalJson(afterRecipe as unknown as CanonicalJsonValue)
			) {
				return [];
			}
			return [{ id, before: beforeRecipe, after: afterRecipe }];
		})
		.sort((left, right) => left.id.localeCompare(right.id));
	return {
		fromSnapshotId: current.snapshotId,
		toSnapshotId: next.snapshotId,
		addedRecipeIds,
		removedRecipeIds,
		changedRecipes,
	};
}

export function prepareCatalogActivation(
	currentSnapshot: CatalogSnapshot,
	nextSnapshot: CatalogSnapshot,
	activePlanRecipeIds: readonly string[],
): CatalogActivationPreview {
	const diff = diffCatalogSnapshots(currentSnapshot, nextSnapshot);
	const removed = new Set(diff.removedRecipeIds);
	const changed = new Set(diff.changedRecipes.map((entry) => entry.id));
	const breakingRecipeIds = [...new Set(activePlanRecipeIds)]
		.filter((id) => removed.has(id) || changed.has(id))
		.sort();
	return deepFreeze({ currentSnapshot, nextSnapshot, diff, breakingRecipeIds });
}

export function activateCatalogSnapshot(
	preview: CatalogActivationPreview,
	confirmBreakingChanges: boolean,
): CatalogActivationResult {
	if (preview.breakingRecipeIds.length > 0 && !confirmBreakingChanges) {
		return {
			ok: false,
			diagnostic: errorDiagnostic(
				"ACTIVATION_REQUIRES_CONFIRMATION",
				"$.activation",
				`Catalog activation would affect ${preview.breakingRecipeIds.length} active recipe(s).`,
				"Review the diff and explicitly confirm activation, or keep the current snapshot.",
			),
		};
	}
	return {
		ok: true,
		activeSnapshot: preview.nextSnapshot,
		rollbackSnapshot: preview.currentSnapshot,
	};
}

export function rollbackCatalogActivation(
	activation: Extract<CatalogActivationResult, { readonly ok: true }>,
): CatalogSnapshot {
	return activation.rollbackSnapshot;
}
