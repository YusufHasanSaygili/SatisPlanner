import { describe, expect, it } from "vitest";
import { createMockNativeAdapter } from "./mock-adapter";
import {
	NATIVE_CONTRACT_VERSION,
	requestPlanLoad,
	requestPlanSave,
	requestRecoveryInspection,
	requestRuntimeInfo,
	type RuntimeInfo,
} from "./contracts";

describe("native/frontend contract", () => {
	it("round-trips through a mock adapter without Tauri", async () => {
		const result = await requestRuntimeInfo(createMockNativeAdapter(), "request-1");
		expect(result).toEqual({
			ok: true,
			data: {
				applicationName: "SatisPlanner",
				applicationVersion: "0.11.0",
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

	it("autosave creates a last-good revision and exposes typed recovery metadata", async () => {
		const adapter = createMockNativeAdapter();
		const first = JSON.stringify({ schemaVersion: 4, revision: 1 });
		const second = JSON.stringify({ schemaVersion: 4, revision: 2 });
		expect(await requestPlanSave(adapter, "save-1", "plan-1", first)).toMatchObject({
			ok: true,
			data: { schemaVersion: 4, backupCreated: false },
		});
		expect(await requestPlanSave(adapter, "save-2", "plan-1", second)).toMatchObject({
			ok: true,
			data: { backupCreated: true },
		});
		expect(await requestRecoveryInspection(adapter, "inspect-1", "plan-1")).toMatchObject({
			ok: true,
			data: {
				primary: { exists: true, valid: true, schemaVersion: 4 },
				lastGood: { exists: true, valid: true, schemaVersion: 4 },
			},
		});
		const recovered = await requestPlanLoad(adapter, "load-1", "plan-1", "last-good");
		expect(recovered.ok).toBe(true);
		if (recovered.ok) expect(recovered.data.contents).toBe(first);
	});
});
