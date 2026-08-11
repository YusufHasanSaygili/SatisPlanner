import { describe, expect, it } from "vitest";
import { getCalculationFoundationStatus } from "./index";

describe("calculation package foundation", () => {
	it("exposes the resource extraction engine from its dedicated slice", () => {
		expect(getCalculationFoundationStatus()).toMatchObject({
			engineEnabled: true,
			resourceExtractionEnabled: true,
			materialFlowEnabled: true,
		});
	});
});
