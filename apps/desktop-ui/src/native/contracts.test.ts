import { describe, expect, it } from "vitest";
import { createMockNativeAdapter } from "./mock-adapter";
import { NATIVE_CONTRACT_VERSION, requestRuntimeInfo, type RuntimeInfo } from "./contracts";

describe("native/frontend contract", () => {
	it("round-trips through a mock adapter without Tauri", async () => {
		const result = await requestRuntimeInfo(createMockNativeAdapter(), "request-1");
		expect(result).toEqual({
			ok: true,
			data: {
				applicationName: "SatisPlanner",
				applicationVersion: "0.4.0",
				runtime: "browser-mock",
			},
		});
	});

	it("maps a version mismatch to a safe, actionable error", async () => {
		const result = await requestRuntimeInfo(
			createMockNativeAdapter({
				respond: (request) => ({
					contractVersion: NATIVE_CONTRACT_VERSION + 1,
					requestId: request.requestId,
					ok: true,
					data: {
						applicationName: "SatisPlanner",
						applicationVersion: "future",
						runtime: "desktop-native",
					} satisfies RuntimeInfo,
				}),
			}),
			"request-2",
		);

		expect(result).toEqual({
			ok: false,
			error: {
				code: "CONTRACT_VERSION_MISMATCH",
				message: "Desktop contract version is not supported.",
			},
		});
	});

	it("does not leak a raw native exception", async () => {
		const result = await requestRuntimeInfo(
			createMockNativeAdapter({
				respond: () => {
					throw new Error("C:\\Users\\private\\CommunityResources\\Docs\\en-US.json");
				},
			}),
			"request-3",
		);

		expect(result).toEqual({
			ok: false,
			error: {
				code: "NATIVE_UNAVAILABLE",
				message: "Desktop service is unavailable.",
			},
		});
	});
});
