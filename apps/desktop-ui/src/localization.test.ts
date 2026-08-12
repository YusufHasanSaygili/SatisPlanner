import { describe, expect, it } from "vitest";
import { formatNumber, translate, type TranslationKey } from "./localization";

describe("UI localization", () => {
	it("has compile-time complete TR/EN catalogs and deterministic fallback", () => {
		const keys: TranslationKey[] = ["library", "profileSettings", "seedPolicy"];
		expect(keys.map((key) => translate("tr", key))).toEqual([
			"Kütüphane",
			"Oyun profili ve dil",
			"Seed yalnız referans için saklanır; SatisPlanner düğüm koordinatı üretmez.",
		]);
		expect(translate("en", "library")).toBe("Library");
	});

	it("formats numbers with the UI locale policy", () => {
		expect(formatNumber("en", 1234.5)).toBe("1,234.5");
		expect(formatNumber("tr", 1234.5)).toBe("1.234,5");
	});
});
