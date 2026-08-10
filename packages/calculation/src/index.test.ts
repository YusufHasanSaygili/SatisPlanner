import { describe, expect, it } from "vitest";
import { getCalculationFoundationStatus } from "./index";

describe("calculation package foundation", () => {
	it("keeps formulas disabled until their dedicated slice", () => {
		expect(getCalculationFoundationStatus().engineEnabled).toBe(false);
	});
});
