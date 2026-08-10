import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CatalogSnapshot } from "./catalog";
import { importDocsSnapshot, serializeCatalogSnapshot } from "./snapshot";
import { encodeUtf16 } from "./test-helpers";

function fixture(name: string): string {
	return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

async function importFixture(
	name: string,
	options: { readonly endian?: "le" | "be"; readonly locale?: string } = {},
) {
	const source = fixture(name);
	const bytes = options.endian
		? encodeUtf16(source, options.endian)
		: new TextEncoder().encode(source);
	return importDocsSnapshot({
		bytes,
		fileName: name === "legacy-Docs.json" ? "Docs.json" : name,
		sourceKind: "custom",
		gameVersion: "1.2",
		buildId: "synthetic-build",
		locale: options.locale,
	});
}

function successfulSnapshot(result: Awaited<ReturnType<typeof importFixture>>): CatalogSnapshot {
	expect(result.ok).toBe(true);
	if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
	return result.snapshot;
}

describe("localized Docs importer", () => {
	it("normalizes UTF-16 en-US items, buildings, recipes and solid/fluid rates", async () => {
		const result = await importFixture("en-US.json", { endian: "le" });
		const snapshot = successfulSnapshot(result);
		expect(snapshot.provenance).toMatchObject({
			sourceEncoding: "utf-16le",
			sourceFormat: "localized",
			locale: "en-US",
			gameVersion: "1.2",
			buildId: "synthetic-build",
		});
		expect(snapshot.provenance.sourceHash).toMatch(/^[0-9a-f]{64}$/);
		expect(snapshot.provenance.normalizedHash).toMatch(/^[0-9a-f]{64}$/);
		expect(snapshot.catalog.items).toHaveLength(3);
		expect(snapshot.catalog.buildings[0]).toMatchObject({
			id: "Build_SP_Maker_C",
			powerShardSlots: 3,
			somersloopSlots: 1,
		});
		const recipe = snapshot.catalog.recipes[0];
		expect(recipe?.durationSeconds).toEqual({ numerator: "6", denominator: "1" });
		expect(recipe?.ingredients).toEqual([
			{
				itemId: "Desc_SP_Ore_C",
				amount: { numerator: "3", denominator: "1" },
				ratePerMinute: { numerator: "30", denominator: "1" },
			},
			{
				itemId: "Desc_SP_Water_C",
				amount: { numerator: "1", denominator: "1" },
				ratePerMinute: { numerator: "10", denominator: "1" },
			},
		]);
		expect(recipe?.products[0]?.ratePerMinute).toEqual({ numerator: "20", denominator: "1" });
		expect(Object.isFrozen(snapshot)).toBe(true);
	});

	it("keeps stable ids while applying a second UTF-16 locale", async () => {
		const english = successfulSnapshot(await importFixture("en-US.json", { endian: "le" }));
		const turkish = successfulSnapshot(
			await importFixture("tr.json", { endian: "be", locale: "tr" }),
		);
		expect(turkish.provenance.sourceEncoding).toBe("utf-16be");
		expect(turkish.catalog.items.map((item) => item.id)).toEqual(
			english.catalog.items.map((item) => item.id),
		);
		expect(turkish.catalog.items.map((item) => item.displayName)).not.toEqual(
			english.catalog.items.map((item) => item.displayName),
		);
	});

	it("supports the isolated legacy Docs adapter", async () => {
		const snapshot = successfulSnapshot(await importFixture("legacy-Docs.json"));
		expect(snapshot.provenance).toMatchObject({ sourceFormat: "legacy", locale: "legacy" });
		expect(snapshot.catalog.recipes).toHaveLength(1);
	});

	it("produces byte-identical canonical snapshots for the same source", async () => {
		const source = fixture("en-US.json");
		const bytes = encodeUtf16(source, "le");
		const before = Uint8Array.from(bytes);
		const input = {
			bytes,
			fileName: "en-US.json",
			sourceKind: "steam" as const,
			gameVersion: "1.2",
			buildId: "same-build",
		};
		const first = await importDocsSnapshot(input);
		const second = await importDocsSnapshot(input);
		const firstSnapshot = successfulSnapshot(first);
		const secondSnapshot = successfulSnapshot(second);
		expect(serializeCatalogSnapshot(firstSnapshot)).toBe(serializeCatalogSnapshot(secondSnapshot));
		expect(firstSnapshot.snapshotId).toBe(secondSnapshot.snapshotId);
		expect(bytes).toEqual(before);
	});

	it("fails loudly for malformed, duplicate, unknown-form, missing-reference and duration cases", async () => {
		const cases: Array<[string, string]> = [
			["malformed-docs.txt", "MALFORMED_JSON"],
			["duplicate-id.json", "DUPLICATE_CLASS_ID"],
			["unknown-form.json", "UNKNOWN_ITEM_FORM"],
			["missing-reference.json", "MISSING_CLASS_REFERENCE"],
		];
		for (const [name, expectedCode] of cases) {
			const result = await importFixture(name);
			expect(result.ok, name).toBe(false);
			if (!result.ok) {
				expect(
					result.diagnostics.map((entry) => entry.code),
					name,
				).toContain(expectedCode);
				expect(result.diagnostics[0]?.suggestion.length, name).toBeGreaterThan(0);
			}
		}

		const invalidDuration = fixture("en-US.json").replace(
			'"mManufactoringDuration": "6.000000"',
			'"mManufactoringDuration": "0"',
		);
		const result = await importDocsSnapshot({
			bytes: new TextEncoder().encode(invalidDuration),
			fileName: "en-US.json",
			sourceKind: "custom",
			gameVersion: "1.2",
		});
		expect(result.ok).toBe(false);
		if (!result.ok)
			expect(result.diagnostics.map((entry) => entry.code)).toContain("INVALID_RECIPE_DURATION");

		const missingReference = await importFixture("missing-reference.json");
		expect(missingReference.ok).toBe(false);
		if (!missingReference.ok) {
			expect(missingReference.diagnostics).toContainEqual(
				expect.objectContaining({
					severity: "warning",
					code: "MISSING_CLASS_REFERENCE",
					message: expect.stringContaining("Build_SP_Missing_C"),
				}),
			);
		}
	});

	it("normalizes a large deterministic synthetic catalog", async () => {
		const base = JSON.parse(fixture("en-US.json")) as Array<Record<string, unknown>>;
		const recipeGroup = base.find((group) => String(group.NativeClass).includes("FGRecipe"));
		expect(recipeGroup).toBeDefined();
		if (!recipeGroup) return;
		const recipe = (recipeGroup.Classes as Array<Record<string, unknown>>)[0];
		expect(recipe).toBeDefined();
		if (!recipe) return;
		recipeGroup.Classes = Array.from({ length: 500 }, (_, index) => ({
			...recipe,
			ClassName: `Recipe_SP_Large_${index.toString().padStart(3, "0")}_C`,
			mDisplayName: `Synthetic Large Recipe ${index}`,
		}));
		const source = JSON.stringify(base);
		const input = {
			bytes: encodeUtf16(source, "le"),
			fileName: "en-US.json",
			sourceKind: "custom" as const,
			gameVersion: "1.2",
		};
		const first = successfulSnapshot(await importDocsSnapshot(input));
		const second = successfulSnapshot(await importDocsSnapshot(input));
		expect(first.catalog.recipes).toHaveLength(500);
		expect(first.provenance.normalizedHash).toBe(second.provenance.normalizedHash);
	});
});
