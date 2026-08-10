import {
	NATIVE_CONTRACT_VERSION,
	type NativeAdapter,
	type NativeWireResponse,
	type RuntimeInfo,
	type RuntimeInfoRequest,
} from "./contracts";

export interface MockNativeOptions {
	readonly respond?: (
		request: RuntimeInfoRequest,
	) => NativeWireResponse<RuntimeInfo> | Promise<NativeWireResponse<RuntimeInfo>>;
}

export function createMockNativeAdapter(options: MockNativeOptions = {}): NativeAdapter {
	return {
		async request(request) {
			if (options.respond) return options.respond(request);
			return {
				contractVersion: NATIVE_CONTRACT_VERSION,
				requestId: request.requestId,
				ok: true,
				data: {
					applicationName: "SatisPlanner",
					applicationVersion: "0.5.0",
					runtime: "browser-mock",
				},
			};
		},
	};
}
