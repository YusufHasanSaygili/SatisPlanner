import { describe, expect, it } from "vitest";
import { getGameDataFoundationStatus } from "./index";

describe("game-data package foundation", () => {
	it("does not pretend that game data is loaded", () => {
		expect(getGameDataFoundationStatus().catalogLoaded).toBe(false);
	});
});
