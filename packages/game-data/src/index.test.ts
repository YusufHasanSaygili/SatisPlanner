import { describe, expect, it } from "vitest";
import { getGameDataFoundationStatus } from "./index";

describe("game-data package foundation", () => {
	it("reports the bundled complete normalized catalog", () => {
		expect(getGameDataFoundationStatus()).toEqual({
			kind: "game-data-foundation",
			catalogLoaded: true,
			catalogVersion: "satisfactory-1.2-normalized-v1",
		});
	});
});
