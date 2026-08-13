const TURKISH_NAMES: Readonly<Record<string, string>> = Object.freeze({
	"Desc_OreIron_C::miner": "Demir Cevheri",
	"Desc_OreCopper_C::miner": "Bakır Cevheri",
	"Desc_Stone_C::miner": "Kireçtaşı",
	"Desc_Coal_C::miner": "Kömür",
	"Desc_OreGold_C::miner": "Kateriyum Cevheri",
	"Desc_Sulfur_C::miner": "Kükürt",
	"Desc_RawQuartz_C::miner": "Ham Kuvars",
	"Desc_OreBauxite_C::miner": "Boksit",
	"Desc_OreUranium_C::miner": "Uranyum",
	"Desc_SAM_C::miner": "SAM",
	"Desc_LiquidOil_C::oil-extractor": "Ham Petrol",
	"Desc_Water_C::water-extractor": "Su",
	"Desc_NitrogenGas_C::resource-well": "Azot Gazı",
	"building:Build_SmelterMk1_C": "Dökümcü",
	"building:Build_ConstructorMk1_C": "İmalatçı",
	"building:Build_FoundryMk1_C": "Dökümhane",
	"building:Build_AssemblerMk1_C": "Montajcı",
	"building:Build_ManufacturerMk1_C": "Üretici",
	"building:Build_OilRefinery_C": "Rafineri",
	"building:Build_Packager_C": "Paketleyici",
	"building:Build_Blender_C": "Karıştırıcı",
	"building:Build_HadronCollider_C": "Parçacık Hızlandırıcı",
	"building:Build_Converter_C": "Dönüştürücü",
	"building:Build_QuantumEncoder_C": "Kuantum Kodlayıcı",
	"Build_SmelterMk1_C::Recipe_IronIngot_C": "Dökümcü · Demir Külçe",
	"Build_ConstructorMk1_C::Recipe_IronPlate_C": "İmalatçı · Demir Plaka",
	"Build_ConstructorMk1_C::Recipe_IronRod_C": "İmalatçı · Demir Çubuk",
	"Build_FoundryMk1_C::Recipe_IngotSteel_C": "Dökümhane · Çelik Külçe",
	"Build_FoundryMk1_C::Recipe_IngotAluminum_C": "Dökümhane · Alüminyum Külçe",
	"Build_AssemblerMk1_C::Recipe_IronPlateReinforced_C": "Montajcı · Güçlendirilmiş Demir Plaka",
	"Build_AssemblerMk1_C::Recipe_Rotor_C": "Montajcı · Rotor",
	"Build_ManufacturerMk1_C::Recipe_Computer_C": "Üretici · Bilgisayar",
	"Build_ManufacturerMk1_C::Recipe_ModularFrameHeavy_C": "Üretici · Ağır Modüler Çerçeve",
	"Build_OilRefinery_C::Recipe_LiquidFuel_C": "Rafineri · Yakıt",
});

export function fallbackLocalizedName(
	classId: string,
	englishName: string,
	locale: string,
): string {
	return locale.toLocaleLowerCase("en-US").startsWith("tr")
		? (TURKISH_NAMES[classId] ?? englishName)
		: englishName;
}

export function fallbackLocalizedAliases(
	classId: string,
	englishName: string,
	aliases: readonly string[],
): readonly string[] {
	return [...new Set([englishName, TURKISH_NAMES[classId] ?? englishName, classId, ...aliases])];
}
