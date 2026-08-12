import type { CatalogSnapshot, NormalizedCatalog } from "./catalog";

export interface LocaleResolution {
	readonly requestedLocale: string;
	readonly resolvedLocale: string;
	readonly fallbackUsed: boolean;
	readonly snapshot: CatalogSnapshot;
}

function localeCandidates(requested: string, fallback: string): readonly string[] {
	const language = requested.split("-")[0];
	return [
		...new Set(
			[requested, language, fallback, "en-US", "en"].filter(
				(candidate): candidate is string => typeof candidate === "string" && candidate.length > 0,
			),
		),
	];
}

export function resolveCatalogLocale(
	snapshots: readonly CatalogSnapshot[],
	requestedLocale: string,
	fallbackLocale = "en-US",
): LocaleResolution | undefined {
	const byLocale = new Map(
		snapshots.map((snapshot) => [snapshot.provenance.locale.toLocaleLowerCase("en-US"), snapshot]),
	);
	for (const candidate of localeCandidates(requestedLocale, fallbackLocale)) {
		const exact = byLocale.get(candidate.toLocaleLowerCase("en-US"));
		if (exact)
			return {
				requestedLocale,
				resolvedLocale: exact.provenance.locale,
				fallbackUsed:
					exact.provenance.locale.toLocaleLowerCase("en-US") !==
					requestedLocale.toLocaleLowerCase("en-US"),
				snapshot: exact,
			};
		const languageMatch = snapshots.find(
			(snapshot) =>
				snapshot.provenance.locale.split("-")[0]?.toLocaleLowerCase("en-US") ===
				candidate.toLocaleLowerCase("en-US"),
		);
		if (languageMatch)
			return {
				requestedLocale,
				resolvedLocale: languageMatch.provenance.locale,
				fallbackUsed: languageMatch.provenance.locale !== requestedLocale,
				snapshot: languageMatch,
			};
	}
	const first = [...snapshots].sort((left, right) =>
		left.provenance.locale.localeCompare(right.provenance.locale),
	)[0];
	return first
		? {
				requestedLocale,
				resolvedLocale: first.provenance.locale,
				fallbackUsed: true,
				snapshot: first,
			}
		: undefined;
}

export function buildLocalizedSearchAliases(
	catalogs: readonly NormalizedCatalog[],
): ReadonlyMap<string, readonly string[]> {
	const aliases = new Map<string, Set<string>>();
	for (const catalog of catalogs) {
		for (const entry of [...catalog.items, ...catalog.buildings, ...catalog.recipes]) {
			const values = aliases.get(entry.id) ?? new Set<string>();
			values.add(entry.displayName);
			values.add(entry.id);
			aliases.set(entry.id, values);
		}
	}
	return new Map(
		[...aliases].map(([id, values]) => [
			id,
			[...values].sort((left, right) => left.localeCompare(right)),
		]),
	);
}

export function localizedSearchMatch(
	query: string,
	values: readonly string[],
	locale: string,
): boolean {
	const casingLocale = locale.toLocaleLowerCase("en-US").startsWith("tr") ? "tr-TR" : locale;
	const normalize = (value: string) =>
		value
			.toLocaleLowerCase(casingLocale)
			.normalize("NFD")
			.replace(/\p{Diacritic}/gu, "")
			.replaceAll("ı", "i");
	const needle = normalize(query.trim());
	return values.some((value) => normalize(value).includes(needle));
}
