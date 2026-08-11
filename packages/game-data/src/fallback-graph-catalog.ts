import type { MachineNodeTemplate, ResourceNodeTemplate } from "@satisplanner/domain";

export const FALLBACK_GRAPH_CATALOG_VERSION = "fallback-graph-catalog-v2" as const;

/**
 * Versioned, redistribution-safe placeholders used until the user's normalized
 * Docs snapshot is loaded. IDs mirror public class-name conventions; no game
 * artwork or raw Docs content is included.
 */
export const FALLBACK_GRAPH_CATALOG: readonly MachineNodeTemplate[] = [
	{
		classId: "Build_SmelterMk1_C::Recipe_IronIngot_C",
		displayName: "Smelter · Iron Ingot",
		category: "Production",
		buildingId: "Build_SmelterMk1_C",
		recipeId: "Recipe_IronIngot_C",
		aliases: ["iron", "ingot", "smelter"],
		ports: [
			{
				key: "input-0",
				direction: "input",
				materialForm: "solid",
				materialId: "Desc_OreIron_C",
			},
			{
				key: "output-0",
				direction: "output",
				materialForm: "solid",
				materialId: "Desc_IronIngot_C",
			},
		],
	},
	{
		classId: "Build_ConstructorMk1_C::Recipe_IronPlate_C",
		displayName: "Constructor · Iron Plate",
		category: "Production",
		buildingId: "Build_ConstructorMk1_C",
		recipeId: "Recipe_IronPlate_C",
		aliases: ["iron", "plate", "constructor"],
		ports: [
			{
				key: "input-0",
				direction: "input",
				materialForm: "solid",
				materialId: "Desc_IronIngot_C",
			},
			{
				key: "output-0",
				direction: "output",
				materialForm: "solid",
				materialId: "Desc_IronPlate_C",
			},
		],
	},
	{
		classId: "Build_ConstructorMk1_C::Recipe_IronRod_C",
		displayName: "Constructor · Iron Rod",
		category: "Production",
		buildingId: "Build_ConstructorMk1_C",
		recipeId: "Recipe_IronRod_C",
		aliases: ["iron", "rod", "constructor"],
		ports: [
			{
				key: "input-0",
				direction: "input",
				materialForm: "solid",
				materialId: "Desc_IronIngot_C",
			},
			{
				key: "output-0",
				direction: "output",
				materialForm: "solid",
				materialId: "Desc_IronRod_C",
			},
		],
	},
	{
		classId: "Build_OilRefinery_C::Recipe_Fuel_C",
		displayName: "Refinery · Fuel",
		category: "Production",
		buildingId: "Build_OilRefinery_C",
		recipeId: "Recipe_Fuel_C",
		aliases: ["oil", "fuel", "fluid", "refinery"],
		ports: [
			{
				key: "input-0",
				direction: "input",
				materialForm: "fluid",
				materialId: "Desc_LiquidOil_C",
			},
			{
				key: "output-0",
				direction: "output",
				materialForm: "fluid",
				materialId: "Desc_LiquidFuel_C",
			},
		],
	},
];

export const FALLBACK_RESOURCE_CATALOG: readonly ResourceNodeTemplate[] = [
	{
		classId: "Desc_OreIron_C::miner",
		displayName: "Iron Ore",
		category: "Resources",
		resourceId: "Desc_OreIron_C",
		materialForm: "solid",
		extractorStrategyId: "miner",
		defaultTierId: "miner-mk1",
		availableTierIds: ["miner-mk1", "miner-mk2", "miner-mk3"],
		aliases: ["iron", "ore", "miner"],
	},
	{
		classId: "Desc_OreCopper_C::miner",
		displayName: "Copper Ore",
		category: "Resources",
		resourceId: "Desc_OreCopper_C",
		materialForm: "solid",
		extractorStrategyId: "miner",
		defaultTierId: "miner-mk1",
		availableTierIds: ["miner-mk1", "miner-mk2", "miner-mk3"],
		aliases: ["copper", "ore", "miner"],
	},
	{
		classId: "Desc_Stone_C::miner",
		displayName: "Limestone",
		category: "Resources",
		resourceId: "Desc_Stone_C",
		materialForm: "solid",
		extractorStrategyId: "miner",
		defaultTierId: "miner-mk1",
		availableTierIds: ["miner-mk1", "miner-mk2", "miner-mk3"],
		aliases: ["stone", "limestone", "miner"],
	},
	{
		classId: "Desc_LiquidOil_C::oil-extractor",
		displayName: "Crude Oil",
		category: "Resources",
		resourceId: "Desc_LiquidOil_C",
		materialForm: "fluid",
		extractorStrategyId: "oil-extractor",
		defaultTierId: "oil-extractor",
		availableTierIds: ["oil-extractor"],
		aliases: ["crude", "oil", "extractor", "fluid"],
	},
	{
		classId: "Desc_Water_C::water-extractor",
		displayName: "Water",
		category: "Resources",
		resourceId: "Desc_Water_C",
		materialForm: "fluid",
		extractorStrategyId: "water-extractor",
		defaultTierId: "water-extractor",
		availableTierIds: ["water-extractor"],
		aliases: ["water", "extractor", "fluid"],
	},
];
