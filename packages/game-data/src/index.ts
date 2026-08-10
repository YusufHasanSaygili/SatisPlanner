export interface GameDataFoundationStatus {
	readonly kind: "game-data-foundation";
	readonly catalogLoaded: false;
}

export function getGameDataFoundationStatus(): GameDataFoundationStatus {
	return { kind: "game-data-foundation", catalogLoaded: false };
}
