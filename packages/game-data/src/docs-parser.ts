import { Rational } from "@satisplanner/domain";
import type {
	CatalogBuilding,
	CatalogItem,
	CatalogItemForm,
	CatalogMaterialForm,
	CatalogRecipe,
	CatalogRecipeAmount,
	NormalizedCatalog,
} from "./catalog";
import { assertJsonDepth } from "./encoding";
import {
	type GameDataDiagnostic,
	GameDataImportError,
	errorDiagnostic,
	warningDiagnostic,
} from "./errors";

interface RawClassGroup {
	readonly NativeClass: string;
	readonly Classes: readonly Record<string, unknown>[];
}

export interface ParsedDocs {
	readonly groups: readonly RawClassGroup[];
	readonly format: "localized" | "legacy";
}

export interface CatalogNormalizationResult {
	readonly ok: boolean;
	readonly catalog?: NormalizedCatalog;
	readonly diagnostics: readonly GameDataDiagnostic[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rawString(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function parseDocsRoot(value: unknown, format: "localized" | "legacy"): readonly unknown[] {
	if (Array.isArray(value)) return value;
	if (format === "legacy" && isRecord(value) && Array.isArray(value.NativeClasses)) {
		return value.NativeClasses;
	}
	throw new GameDataImportError(
		errorDiagnostic(
			"INVALID_DOCS_SHAPE",
			"$",
			"Docs JSON must contain an array of NativeClass/Classes groups.",
			"Select an official locale JSON or legacy Docs.json file.",
		),
	);
}

export function parseDocsJson(text: string, fileName: string): ParsedDocs {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		throw new GameDataImportError(
			errorDiagnostic(
				"MALFORMED_JSON",
				"$",
				"The selected Docs file is not valid JSON.",
				"Verify the game files and retry with an unmodified locale file.",
			),
		);
	}
	assertJsonDepth(raw);
	const format = fileName.toLowerCase() === "docs.json" ? "legacy" : "localized";
	const groups: RawClassGroup[] = [];
	for (const [index, entry] of parseDocsRoot(raw, format).entries()) {
		if (
			!isRecord(entry) ||
			typeof entry.NativeClass !== "string" ||
			!Array.isArray(entry.Classes)
		) {
			throw new GameDataImportError(
				errorDiagnostic(
					"INVALID_DOCS_SHAPE",
					`$[${index}]`,
					"Every Docs group must contain NativeClass and Classes fields.",
					"Use an official Docs file matching the supported game version.",
				),
			);
		}
		const classes: Record<string, unknown>[] = [];
		for (const [classIndex, classEntry] of entry.Classes.entries()) {
			if (!isRecord(classEntry)) {
				throw new GameDataImportError(
					errorDiagnostic(
						"INVALID_DOCS_SHAPE",
						`$[${index}].Classes[${classIndex}]`,
						"Every Docs class entry must be an object.",
						"Use an official, unmodified Docs file.",
					),
				);
			}
			classes.push(classEntry);
		}
		groups.push({ NativeClass: entry.NativeClass, Classes: classes });
	}
	return { groups, format };
}

function parseItemForm(value: unknown): {
	readonly form?: CatalogItemForm;
	readonly materialForm?: CatalogMaterialForm;
} {
	if (value === "RF_SOLID") return { form: "solid", materialForm: "solid" };
	if (value === "RF_LIQUID") return { form: "liquid", materialForm: "fluid" };
	if (value === "RF_GAS") return { form: "gas", materialForm: "fluid" };
	return {};
}

function parseInteger(value: unknown, fallback: number): number {
	if (typeof value !== "string" && typeof value !== "number") return fallback;
	const parsed = Number(value);
	return Number.isInteger(parsed) ? parsed : fallback;
}

function extractClassReferences(value: unknown): readonly string[] {
	if (typeof value !== "string") return [];
	const ids = new Set<string>();
	for (const match of value.matchAll(/([A-Za-z][A-Za-z0-9_]*_C)(?=['"])/g)) {
		const id = match[1];
		if (id) ids.add(id);
	}
	return [...ids].sort();
}

function parseCountedItems(
	value: unknown,
	path: string,
	diagnostics: GameDataDiagnostic[],
): readonly { readonly itemId: string; readonly rawAmount: Rational }[] {
	if (typeof value !== "string") {
		diagnostics.push(
			errorDiagnostic(
				"INVALID_COUNTED_ITEM",
				path,
				"Recipe ingredients/products must use the counted-item string format.",
				"Verify the Docs schema for this game build.",
			),
		);
		return [];
	}
	if (value.trim() === "" || value.trim() === "()") return [];

	const result: Array<{ readonly itemId: string; readonly rawAmount: Rational }> = [];
	const pattern = /ItemClass="[^"]*?([A-Za-z][A-Za-z0-9_]*_C)'?",Amount=([+-]?\d+(?:\.\d+)?)/g;
	for (const match of value.matchAll(pattern)) {
		const itemId = match[1];
		const amount = match[2];
		if (!itemId || !amount) continue;
		try {
			result.push({ itemId, rawAmount: Rational.parse(amount) });
		} catch {
			diagnostics.push(
				errorDiagnostic(
					"INVALID_COUNTED_ITEM",
					path,
					`Recipe amount for ${itemId} is not a valid decimal.`,
					"Verify the Docs file is not truncated or modified.",
				),
			);
		}
	}
	if (result.length === 0) {
		diagnostics.push(
			errorDiagnostic(
				"INVALID_COUNTED_ITEM",
				path,
				"No counted items could be parsed from a non-empty recipe field.",
				"Update the importer adapter for this Docs schema before activating the snapshot.",
			),
		);
	}
	return result;
}

function normalizeRecipeAmounts(
	rawAmounts: readonly { readonly itemId: string; readonly rawAmount: Rational }[],
	duration: Rational,
	items: ReadonlyMap<string, CatalogItem>,
	path: string,
	diagnostics: GameDataDiagnostic[],
): readonly CatalogRecipeAmount[] {
	const normalized: CatalogRecipeAmount[] = [];
	for (const [index, raw] of rawAmounts.entries()) {
		const item = items.get(raw.itemId);
		if (!item) {
			diagnostics.push(
				errorDiagnostic(
					"MISSING_CLASS_REFERENCE",
					`${path}[${index}].itemId`,
					`Recipe references missing item class ${raw.itemId}.`,
					"Repair/verify the game files; do not activate this snapshot.",
				),
			);
			continue;
		}
		const amount =
			item.materialForm === "fluid" ? raw.rawAmount.divide(Rational.create(1_000n)) : raw.rawAmount;
		const ratePerMinute = amount.multiply(Rational.create(60n)).divide(duration);
		normalized.push({
			itemId: raw.itemId,
			amount: amount.toJSON(),
			ratePerMinute: ratePerMinute.toJSON(),
		});
	}
	return normalized.sort((left, right) => left.itemId.localeCompare(right.itemId));
}

function addUnique<T extends { readonly id: string }>(
	map: Map<string, T>,
	entry: T,
	path: string,
	diagnostics: GameDataDiagnostic[],
): void {
	if (map.has(entry.id)) {
		diagnostics.push(
			errorDiagnostic(
				"DUPLICATE_CLASS_ID",
				path,
				`Duplicate normalized class id ${entry.id}.`,
				"Verify the source file or update the class-group adapter before activation.",
			),
		);
		return;
	}
	map.set(entry.id, entry);
}

export function normalizeDocs(parsed: ParsedDocs): CatalogNormalizationResult {
	const diagnostics: GameDataDiagnostic[] = [];
	const classIds = new Set<string>();
	const items = new Map<string, CatalogItem>();
	const buildings = new Map<string, CatalogBuilding>();
	const recipes = new Map<string, CatalogRecipe>();

	for (const [groupIndex, group] of parsed.groups.entries()) {
		for (const [classIndex, entry] of group.Classes.entries()) {
			const classId = rawString(entry.ClassName);
			if (classId) classIds.add(classId);
			if (!("mForm" in entry)) continue;
			if (entry.mForm === "RF_INVALID") continue;
			const { form, materialForm } = parseItemForm(entry.mForm);
			if (!form || !materialForm) {
				diagnostics.push(
					errorDiagnostic(
						"UNKNOWN_ITEM_FORM",
						`$[${groupIndex}].Classes[${classIndex}].mForm`,
						`Unknown item form ${String(entry.mForm)} for ${classId || "unnamed class"}.`,
						"Update the importer form mapping before activating this snapshot.",
					),
				);
				continue;
			}
			if (!classId) continue;
			addUnique(
				items,
				{
					id: classId,
					displayName: rawString(entry.mDisplayName) || classId,
					description: rawString(entry.mDescription),
					form,
					materialForm,
				},
				`$[${groupIndex}].Classes[${classIndex}].ClassName`,
				diagnostics,
			);
		}
	}

	for (const [groupIndex, group] of parsed.groups.entries()) {
		if (!group.NativeClass.includes("FGBuildableManufacturer")) continue;
		for (const [classIndex, entry] of group.Classes.entries()) {
			const classId = rawString(entry.ClassName);
			if (!classId) continue;
			const shardSlots =
				rawString(entry.mOverridePotentialShardSlots).toLowerCase() === "true"
					? parseInteger(entry.mPotentialShardSlots, 3)
					: 3;
			const somersloopSlots = parseInteger(entry.mProductionShardSlotSize, 0);
			if (shardSlots < 0 || shardSlots > 3 || somersloopSlots < 0 || somersloopSlots > 4) {
				diagnostics.push(
					errorDiagnostic(
						"INVALID_BUILDING",
						`$[${groupIndex}].Classes[${classIndex}]`,
						`Building ${classId} has invalid shard or Somersloop slot metadata.`,
						"Verify the source build and update the building adapter if the schema changed.",
					),
				);
				continue;
			}
			try {
				addUnique(
					buildings,
					{
						id: classId,
						displayName: rawString(entry.mDisplayName) || classId,
						powerConsumptionMW: Rational.parse(rawString(entry.mPowerConsumption) || "0").toJSON(),
						powerShardSlots: shardSlots,
						somersloopSlots,
					},
					`$[${groupIndex}].Classes[${classIndex}].ClassName`,
					diagnostics,
				);
			} catch {
				diagnostics.push(
					errorDiagnostic(
						"INVALID_BUILDING",
						`$[${groupIndex}].Classes[${classIndex}].mPowerConsumption`,
						`Building ${classId} has invalid power metadata.`,
						"Verify the source file and game build.",
					),
				);
			}
		}
	}

	for (const [groupIndex, group] of parsed.groups.entries()) {
		if (!/\.FGRecipe'$/.test(group.NativeClass)) continue;
		for (const [classIndex, entry] of group.Classes.entries()) {
			const classId = rawString(entry.ClassName);
			if (!classId) continue;
			const producedInRefs = extractClassReferences(entry.mProducedIn);
			for (const reference of producedInRefs) {
				if (reference.startsWith("Build_") && !classIds.has(reference)) {
					diagnostics.push(
						warningDiagnostic(
							"MISSING_CLASS_REFERENCE",
							`$[${groupIndex}].Classes[${classIndex}].mProducedIn`,
							`Recipe ${classId} references unavailable producer class ${reference}.`,
							"The unavailable producer is excluded; review it if no supported machine remains.",
						),
					);
				}
			}
			const producedIn = producedInRefs.filter((id) => buildings.has(id)).sort();
			if (producedIn.length === 0) continue;

			let duration: Rational;
			try {
				duration = Rational.parse(rawString(entry.mManufactoringDuration));
				if (duration.compare(Rational.create(0n)) <= 0) throw new Error("non-positive duration");
			} catch {
				diagnostics.push(
					errorDiagnostic(
						"INVALID_RECIPE_DURATION",
						`$[${groupIndex}].Classes[${classIndex}].mManufactoringDuration`,
						`Recipe ${classId} has a missing, zero or negative duration.`,
						"Verify the Docs source and importer adapter before activation.",
					),
				);
				continue;
			}

			const basePath = `$[${groupIndex}].Classes[${classIndex}]`;
			const ingredients = normalizeRecipeAmounts(
				parseCountedItems(entry.mIngredients, `${basePath}.mIngredients`, diagnostics),
				duration,
				items,
				`${basePath}.ingredients`,
				diagnostics,
			);
			const products = normalizeRecipeAmounts(
				parseCountedItems(entry.mProduct, `${basePath}.mProduct`, diagnostics),
				duration,
				items,
				`${basePath}.products`,
				diagnostics,
			);
			if (products.length === 0) continue;
			addUnique(
				recipes,
				{
					id: classId,
					displayName: rawString(entry.mDisplayName) || classId,
					durationSeconds: duration.toJSON(),
					ingredients,
					products,
					producedIn,
				},
				`${basePath}.ClassName`,
				diagnostics,
			);
		}
	}

	if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
		return { ok: false, diagnostics: Object.freeze(diagnostics) };
	}
	return {
		ok: true,
		catalog: {
			items: [...items.values()].sort((left, right) => left.id.localeCompare(right.id)),
			buildings: [...buildings.values()].sort((left, right) => left.id.localeCompare(right.id)),
			recipes: [...recipes.values()].sort((left, right) => left.id.localeCompare(right.id)),
		},
		diagnostics: Object.freeze(diagnostics),
	};
}
