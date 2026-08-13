export interface GameDataFoundationStatus {
	readonly kind: "game-data-foundation";
	readonly catalogLoaded: true;
	readonly catalogVersion: "satisfactory-1.2-normalized-v1";
}

export function getGameDataFoundationStatus(): GameDataFoundationStatus {
	return {
		kind: "game-data-foundation",
		catalogLoaded: true,
		catalogVersion: "satisfactory-1.2-normalized-v1",
	};
}

export * from "./catalog";
export * from "./canonical";
export * from "./discovery";
export * from "./docs-parser";
export * from "./encoding";
export * from "./errors";
export * from "./fallback-graph-catalog";
export * from "./fallback-localization";
export * from "./icon-cache";
export * from "./icon-image";
export * from "./icon-resolver";
export * from "./icon-types";
export * from "./localization";
export * from "./snapshot";
export * from "./upstream-fcs";
