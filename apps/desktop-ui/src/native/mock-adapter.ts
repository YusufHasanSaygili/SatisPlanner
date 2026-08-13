import {
	NATIVE_CONTRACT_VERSION,
	type NativeAdapter,
	type NativeRequest,
	type NativeWireResponse,
} from "./contracts";

export interface MockNativeOptions {
	readonly respond?: (
		request: NativeRequest,
	) => NativeWireResponse<unknown> | Promise<NativeWireResponse<unknown>>;
}

interface MockFile {
	readonly contents: string;
	readonly modifiedAt: string;
}

export function createMockNativeAdapter(options: MockNativeOptions = {}): NativeAdapter {
	const files = new Map<string, MockFile>();
	const key = (planId: string, source: "primary" | "last-good") => `${planId}:${source}`;
	return {
		async request(request) {
			if (options.respond) return options.respond(request);
			const success = (data: unknown): NativeWireResponse<unknown> => ({
				contractVersion: NATIVE_CONTRACT_VERSION,
				requestId: request.requestId,
				ok: true,
				data,
			});
			if (request.command.type === "system.runtime-info") {
				return success({
					applicationName: "SatisPlanner",
					applicationVersion: "0.15.0",
					runtime: "browser-mock",
				});
			}
			if (request.command.type === "plan.save") {
				const parsed = JSON.parse(request.command.contents) as { schemaVersion?: number };
				const primaryKey = key(request.command.planId, "primary");
				const current = files.get(primaryKey);
				if (current) files.set(key(request.command.planId, "last-good"), current);
				const savedAt = new Date().toISOString();
				files.set(primaryKey, { contents: request.command.contents, modifiedAt: savedAt });
				return success({
					savedAt,
					schemaVersion: parsed.schemaVersion ?? 0,
					bytes: new TextEncoder().encode(request.command.contents).byteLength,
					backupCreated: current !== undefined,
				});
			}
			if (request.command.type === "plan.inspect-recovery") {
				const planId = request.command.planId;
				const metadata = (source: "primary" | "last-good") => {
					const file = files.get(key(planId, source));
					if (!file) return { exists: false, valid: false, modifiedAt: null, schemaVersion: null };
					try {
						const parsed = JSON.parse(file.contents) as { schemaVersion?: number };
						return {
							exists: true,
							valid: true,
							modifiedAt: file.modifiedAt,
							schemaVersion: parsed.schemaVersion ?? null,
						};
					} catch {
						return { exists: true, valid: false, modifiedAt: file.modifiedAt, schemaVersion: null };
					}
				};
				const primary = metadata("primary");
				const lastGood = metadata("last-good");
				return success({
					primary,
					lastGood,
					interruptedTempPresent: false,
					recoveryRecommended: !primary.valid && lastGood.valid,
				});
			}
			const file = files.get(key(request.command.planId, request.command.source));
			if (!file) {
				return {
					contractVersion: NATIVE_CONTRACT_VERSION,
					requestId: request.requestId,
					ok: false,
					error: { code: "NOT_FOUND", message: "Plan file not found." },
				};
			}
			return success({
				source: request.command.source,
				contents: file.contents,
				modifiedAt: file.modifiedAt,
			});
		},
	};
}
