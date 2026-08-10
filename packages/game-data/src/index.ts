export interface GameDataFoundationStatus {
	readonly kind: "game-data-foundation";
	readonly catalogLoaded: false;
}

export function getGameDataFoundationStatus(): GameDataFoundationStatus {
	return { kind: "game-data-foundation", catalogLoaded: false };
}

export * from "./catalog";
export * from "./canonical";
export * from "./discovery";
export * from "./docs-parser";
export * from "./encoding";
export * from "./errors";
export * from "./snapshot";
