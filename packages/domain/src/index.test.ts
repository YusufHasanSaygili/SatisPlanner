import { describe, expect, it } from "vitest";
import { getDomainFoundationStatus } from "./index";

describe("domain package foundation", () => {
	it("runs without a UI or native runtime", () => {
		expect(getDomainFoundationStatus()).toEqual({
			kind: "domain-foundation",
			version: 1,
			frameworkIndependent: true,
		});
	});
});
