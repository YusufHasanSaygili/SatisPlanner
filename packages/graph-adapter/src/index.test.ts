import { describe, expect, it } from "vitest";
import { createFoundationCanvasNodes } from "./index";

describe("graph adapter foundation", () => {
	it("projects a view-only placeholder with a stable identity", () => {
		const nodes = createFoundationCanvasNodes();
		expect(nodes).toHaveLength(1);
		expect(nodes[0]?.id).toBe("foundation-placeholder");
	});
});
