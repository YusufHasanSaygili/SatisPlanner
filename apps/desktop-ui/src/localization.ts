export type UiLocale = "en" | "tr";

const english = {
	appSubtitle: "Domain-backed graph workspace",
	library: "Library",
	inspector: "Inspector",
	searchPlaceholder: "Search resources, buildings or class id",
	resources: "Resources",
	production: "Production",
	entries: "entries",
	noCatalogMatch: "No catalog match",
	profileSettings: "Game profile & language",
	uiLanguage: "UI language",
	gameDataLanguage: "Game data names",
	profile: "Satisfactory 1.2 profile",
	recipeCost: "Recipe parts cost",
	powerConsumption: "Power consumption",
	resourcePurity: "Resource node purity",
	nodeRandomization: "Node randomization",
	worldSeed: "World seed (metadata only)",
	defaultProfile: "Vanilla default",
	customProfile: "Custom profile",
	seedPolicy: "Seed is stored for reference; SatisPlanner does not generate node coordinates.",
	flowSolved: "Flow solved",
	flowUnresolved: "Flow unresolved",
	nodes: "nodes",
	errors: "errors",
} as const;

export type TranslationKey = keyof typeof english;

const turkish: Record<TranslationKey, string> = {
	appSubtitle: "Domain destekli fabrika çalışma alanı",
	library: "Kütüphane",
	inspector: "Denetçi",
	searchPlaceholder: "Kaynak, bina veya class id ara",
	resources: "Kaynaklar",
	production: "Üretim",
	entries: "kayıt",
	noCatalogMatch: "Katalog eşleşmesi yok",
	profileSettings: "Oyun profili ve dil",
	uiLanguage: "Arayüz dili",
	gameDataLanguage: "Oyun verisi adları",
	profile: "Satisfactory 1.2 profili",
	recipeCost: "Tarif parça maliyeti",
	powerConsumption: "Güç tüketimi",
	resourcePurity: "Kaynak düğümü saflığı",
	nodeRandomization: "Düğüm rastgeleleştirme",
	worldSeed: "Dünya seed'i (yalnız metadata)",
	defaultProfile: "Vanilla varsayılan",
	customProfile: "Özel profil",
	seedPolicy: "Seed yalnız referans için saklanır; SatisPlanner düğüm koordinatı üretmez.",
	flowSolved: "Akış çözüldü",
	flowUnresolved: "Akış çözülemedi",
	nodes: "düğüm",
	errors: "hata",
};

const catalogs: Record<UiLocale, Record<TranslationKey, string>> = { en: english, tr: turkish };

export function translate(locale: UiLocale, key: TranslationKey): string {
	return catalogs[locale]?.[key] ?? english[key];
}

export function formatNumber(locale: UiLocale, value: number, maximumFractionDigits = 4): string {
	return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
		maximumFractionDigits,
	}).format(value);
}
