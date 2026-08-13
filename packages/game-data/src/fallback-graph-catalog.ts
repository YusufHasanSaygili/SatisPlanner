import type {
	MachineBuildingDefinition,
	MachineNodeTemplate,
	ResourceNodeTemplate,
} from "@satisplanner/domain";
import normalizedCatalogJson from "./satisfactory-1.2-normalized.json";
import type {
	CatalogBuilding,
	CatalogItemForm,
	CatalogMaterialForm,
	CatalogRecipe,
} from "./catalog";

export const FALLBACK_GRAPH_CATALOG_VERSION = "satisfactory-1.2-normalized-v1" as const;

interface GraphCatalogItem {
	readonly id: string;
	readonly displayName: string;
	readonly form: CatalogItemForm;
	readonly materialForm: CatalogMaterialForm;
}

export interface GraphCatalogSource {
	readonly items: readonly GraphCatalogItem[];
	readonly buildings: readonly CatalogBuilding[];
	readonly recipes: readonly CatalogRecipe[];
}

export interface GraphCatalogBundle {
	readonly version: string;
	readonly machineRecipes: readonly MachineNodeTemplate[];
	readonly machineLibrary: readonly MachineNodeTemplate[];
	readonly machineBuildings: readonly MachineBuildingDefinition[];
	readonly resources: readonly ResourceNodeTemplate[];
}

interface ResourceDefinition {
	readonly resourceId: string;
	readonly strategyId: "miner" | "oil-extractor" | "water-extractor" | "resource-well";
	readonly defaultTierId: string;
	readonly availableTierIds: readonly string[];
	readonly aliases: readonly string[];
}

const RESOURCE_DEFINITIONS: readonly ResourceDefinition[] = [
	{
		resourceId: "Desc_OreIron_C",
		strategyId: "miner",
		defaultTierId: "miner-mk1",
		availableTierIds: ["miner-mk1", "miner-mk2", "miner-mk3"],
		aliases: ["iron", "ore"],
	},
	{
		resourceId: "Desc_OreCopper_C",
		strategyId: "miner",
		defaultTierId: "miner-mk1",
		availableTierIds: ["miner-mk1", "miner-mk2", "miner-mk3"],
		aliases: ["copper", "ore"],
	},
	{
		resourceId: "Desc_Stone_C",
		strategyId: "miner",
		defaultTierId: "miner-mk1",
		availableTierIds: ["miner-mk1", "miner-mk2", "miner-mk3"],
		aliases: ["stone", "limestone"],
	},
	{
		resourceId: "Desc_Coal_C",
		strategyId: "miner",
		defaultTierId: "miner-mk1",
		availableTierIds: ["miner-mk1", "miner-mk2", "miner-mk3"],
		aliases: ["coal", "fuel"],
	},
	{
		resourceId: "Desc_OreGold_C",
		strategyId: "miner",
		defaultTierId: "miner-mk1",
		availableTierIds: ["miner-mk1", "miner-mk2", "miner-mk3"],
		aliases: ["caterium", "gold", "ore"],
	},
	{
		resourceId: "Desc_Sulfur_C",
		strategyId: "miner",
		defaultTierId: "miner-mk1",
		availableTierIds: ["miner-mk1", "miner-mk2", "miner-mk3"],
		aliases: ["sulfur", "sulphur"],
	},
	{
		resourceId: "Desc_RawQuartz_C",
		strategyId: "miner",
		defaultTierId: "miner-mk1",
		availableTierIds: ["miner-mk1", "miner-mk2", "miner-mk3"],
		aliases: ["raw", "quartz"],
	},
	{
		resourceId: "Desc_OreBauxite_C",
		strategyId: "miner",
		defaultTierId: "miner-mk1",
		availableTierIds: ["miner-mk1", "miner-mk2", "miner-mk3"],
		aliases: ["bauxite", "aluminum"],
	},
	{
		resourceId: "Desc_OreUranium_C",
		strategyId: "miner",
		defaultTierId: "miner-mk1",
		availableTierIds: ["miner-mk1", "miner-mk2", "miner-mk3"],
		aliases: ["uranium", "ore"],
	},
	{
		resourceId: "Desc_SAM_C",
		strategyId: "miner",
		defaultTierId: "miner-mk1",
		availableTierIds: ["miner-mk1", "miner-mk2", "miner-mk3"],
		aliases: ["sam", "strange alien matter"],
	},
	{
		resourceId: "Desc_LiquidOil_C",
		strategyId: "oil-extractor",
		defaultTierId: "oil-extractor",
		availableTierIds: ["oil-extractor"],
		aliases: ["crude", "oil"],
	},
	{
		resourceId: "Desc_Water_C",
		strategyId: "water-extractor",
		defaultTierId: "water-extractor",
		availableTierIds: ["water-extractor"],
		aliases: ["water"],
	},
	{
		resourceId: "Desc_NitrogenGas_C",
		strategyId: "resource-well",
		defaultTierId: "resource-well-extractor",
		availableTierIds: ["resource-well-extractor"],
		aliases: ["nitrogen", "gas", "resource well"],
	},
];

const PREFERRED_RECIPE_IDS: Readonly<Record<string, string>> = Object.freeze({
	Build_SmelterMk1_C: "Recipe_IngotIron_C",
	Build_ConstructorMk1_C: "Recipe_IronPlate_C",
	Build_FoundryMk1_C: "Recipe_IngotSteel_C",
	Build_AssemblerMk1_C: "Recipe_IronPlateReinforced_C",
	Build_ManufacturerMk1_C: "Recipe_Computer_C",
	Build_OilRefinery_C: "Recipe_LiquidFuel_C",
	Build_Packager_C: "Recipe_PackagedWater_C",
	Build_Blender_C: "Recipe_Battery_C",
	Build_HadronCollider_C: "Recipe_SpaceElevatorPart_9_C",
	Build_Converter_C: "Recipe_TimeCrystal_C",
	Build_QuantumEncoder_C: "Recipe_SuperpositionOscillator_C",
});

const BUILDING_LIBRARY_ORDER = [
	"Build_SmelterMk1_C",
	"Build_ConstructorMk1_C",
	"Build_FoundryMk1_C",
	"Build_AssemblerMk1_C",
	"Build_ManufacturerMk1_C",
	"Build_OilRefinery_C",
	"Build_Packager_C",
	"Build_Blender_C",
	"Build_HadronCollider_C",
	"Build_Converter_C",
	"Build_QuantumEncoder_C",
] as const;

function recipeTemplate(
	building: CatalogBuilding,
	recipe: CatalogRecipe,
	items: ReadonlyMap<string, GraphCatalogItem>,
): MachineNodeTemplate {
	const ports = [
		...recipe.ingredients.map((amount, index) => ({
			key: `input-${index}`,
			direction: "input" as const,
			materialForm: items.get(amount.itemId)?.materialForm ?? "solid",
			materialId: amount.itemId,
		})),
		...recipe.products.map((amount, index) => ({
			key: `output-${index}`,
			direction: "output" as const,
			materialForm: items.get(amount.itemId)?.materialForm ?? "solid",
			materialId: amount.itemId,
		})),
	];
	const materialNames = [...recipe.ingredients, ...recipe.products].map(
		(amount) => items.get(amount.itemId)?.displayName ?? amount.itemId,
	);
	return {
		classId: `${building.id}::${recipe.id}`,
		displayName: `${building.displayName} · ${recipe.displayName}`,
		category: "Production",
		buildingId: building.id,
		recipeId: recipe.id,
		aliases: [building.displayName, recipe.displayName, recipe.id, ...materialNames],
		ports,
	};
}

export function createGraphCatalogBundle(
	catalog: GraphCatalogSource,
	version: string,
): GraphCatalogBundle {
	const items = new Map(catalog.items.map((item) => [item.id, item]));
	const machineRecipes = catalog.buildings.flatMap((building) =>
		catalog.recipes
			.filter((recipe) => recipe.producedIn.includes(building.id))
			.map((recipe) => recipeTemplate(building, recipe, items)),
	);
	const machineBuildings = catalog.buildings
		.map((building) => ({
			buildingId: building.id,
			displayName: building.displayName,
			compatibleRecipeIds: machineRecipes
				.filter((recipe) => recipe.buildingId === building.id)
				.map((recipe) => recipe.recipeId),
			powerShardSlots: building.powerShardSlots,
			somersloopSlots: building.somersloopSlots,
		}))
		.sort((left, right) => {
			const leftIndex = BUILDING_LIBRARY_ORDER.indexOf(
				left.buildingId as (typeof BUILDING_LIBRARY_ORDER)[number],
			);
			const rightIndex = BUILDING_LIBRARY_ORDER.indexOf(
				right.buildingId as (typeof BUILDING_LIBRARY_ORDER)[number],
			);
			return (
				(leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex) -
					(rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex) ||
				left.displayName.localeCompare(right.displayName)
			);
		});
	const machineLibrary = machineBuildings.flatMap((definition) => {
		const compatible = machineRecipes.filter(
			(recipe) => recipe.buildingId === definition.buildingId,
		);
		const preferred =
			compatible.find(
				(recipe) => recipe.recipeId === PREFERRED_RECIPE_IDS[definition.buildingId],
			) ?? compatible[0];
		if (!preferred) return [];
		return [
			{
				...preferred,
				classId: `building:${definition.buildingId}`,
				aliases: [
					definition.displayName,
					definition.buildingId,
					...compatible.flatMap((recipe) => [
						recipe.displayName,
						recipe.recipeId,
						...recipe.aliases,
					]),
				],
			},
		];
	});
	const resources = RESOURCE_DEFINITIONS.flatMap((definition) => {
		const item = items.get(definition.resourceId);
		if (!item) return [];
		return [
			{
				classId: `${definition.resourceId}::${definition.strategyId}`,
				displayName: item.displayName,
				category: "Resources" as const,
				resourceId: definition.resourceId,
				materialForm: item.materialForm,
				extractorStrategyId: definition.strategyId,
				defaultTierId: definition.defaultTierId,
				availableTierIds: definition.availableTierIds,
				aliases: [item.displayName, definition.strategyId, ...definition.aliases],
			},
		];
	});
	return Object.freeze({
		version,
		machineRecipes: Object.freeze(machineRecipes),
		machineLibrary: Object.freeze(machineLibrary),
		machineBuildings: Object.freeze(machineBuildings),
		resources: Object.freeze(resources),
	});
}

const normalizedCatalog = normalizedCatalogJson as unknown as GraphCatalogSource;

export const BUNDLED_GRAPH_CATALOG = createGraphCatalogBundle(
	normalizedCatalog,
	FALLBACK_GRAPH_CATALOG_VERSION,
);

export const FALLBACK_GRAPH_CATALOG = BUNDLED_GRAPH_CATALOG.machineRecipes;
export const FALLBACK_MACHINE_LIBRARY = BUNDLED_GRAPH_CATALOG.machineLibrary;
export const FALLBACK_MACHINE_BUILDINGS = BUNDLED_GRAPH_CATALOG.machineBuildings;
export const FALLBACK_RESOURCE_CATALOG = BUNDLED_GRAPH_CATALOG.resources;
export const NORMALIZED_SATISFACTORY_12_CATALOG = normalizedCatalog;
