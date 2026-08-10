export const NATIVE_CONTRACT_VERSION = 1 as const;

export type NativeErrorCode =
	| "CONTRACT_VERSION_MISMATCH"
	| "INVALID_REQUEST"
	| "MALFORMED_RESPONSE"
	| "NATIVE_UNAVAILABLE";

export interface RuntimeInfo {
	readonly applicationName: "SatisPlanner";
	readonly applicationVersion: string;
	readonly runtime: "desktop-native" | "browser-mock";
}

export interface RuntimeInfoRequest {
	readonly contractVersion: typeof NATIVE_CONTRACT_VERSION;
	readonly requestId: string;
	readonly command: {
		readonly type: "system.runtime-info";
	};
}

export interface NativeError {
	readonly code: NativeErrorCode;
	readonly message: string;
}

export interface NativeSuccessResponse<T> {
	readonly contractVersion: number;
	readonly requestId: string;
	readonly ok: true;
	readonly data: T;
}

export interface NativeErrorResponse {
	readonly contractVersion: number;
	readonly requestId: string;
	readonly ok: false;
	readonly error: NativeError;
}

export type NativeWireResponse<T> = NativeSuccessResponse<T> | NativeErrorResponse;

export interface NativeAdapter {
	request(request: RuntimeInfoRequest): Promise<unknown>;
}

export type RuntimeInfoResult =
	| { readonly ok: true; readonly data: RuntimeInfo }
	| { readonly ok: false; readonly error: NativeError };

export function createRuntimeInfoRequest(requestId: string): RuntimeInfoRequest {
	return {
		contractVersion: NATIVE_CONTRACT_VERSION,
		requestId,
		command: { type: "system.runtime-info" },
	};
}

function safeError(code: NativeErrorCode): NativeError {
	const messages: Record<NativeErrorCode, string> = {
		CONTRACT_VERSION_MISMATCH: "Desktop contract version is not supported.",
		INVALID_REQUEST: "Desktop request was rejected.",
		MALFORMED_RESPONSE: "Desktop returned an invalid response.",
		NATIVE_UNAVAILABLE: "Desktop service is unavailable.",
	};
	return { code, message: messages[code] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isNativeErrorCode(value: unknown): value is NativeErrorCode {
	return (
		value === "CONTRACT_VERSION_MISMATCH" ||
		value === "INVALID_REQUEST" ||
		value === "MALFORMED_RESPONSE" ||
		value === "NATIVE_UNAVAILABLE"
	);
}

function isRuntimeInfo(value: unknown): value is RuntimeInfo {
	return (
		isRecord(value) &&
		value.applicationName === "SatisPlanner" &&
		typeof value.applicationVersion === "string" &&
		(value.runtime === "desktop-native" || value.runtime === "browser-mock")
	);
}

export async function requestRuntimeInfo(
	adapter: NativeAdapter,
	requestId: string,
): Promise<RuntimeInfoResult> {
	try {
		const response = await adapter.request(createRuntimeInfoRequest(requestId));
		if (
			!isRecord(response) ||
			typeof response.contractVersion !== "number" ||
			typeof response.requestId !== "string" ||
			typeof response.ok !== "boolean"
		) {
			return { ok: false, error: safeError("MALFORMED_RESPONSE") };
		}
		if (response.contractVersion !== NATIVE_CONTRACT_VERSION) {
			return { ok: false, error: safeError("CONTRACT_VERSION_MISMATCH") };
		}
		if (response.requestId !== requestId) {
			return { ok: false, error: safeError("MALFORMED_RESPONSE") };
		}
		if (!response.ok) {
			if (!isRecord(response.error) || !isNativeErrorCode(response.error.code)) {
				return { ok: false, error: safeError("MALFORMED_RESPONSE") };
			}
			return { ok: false, error: safeError(response.error.code) };
		}
		if (!isRuntimeInfo(response.data)) {
			return { ok: false, error: safeError("MALFORMED_RESPONSE") };
		}
		return { ok: true, data: response.data };
	} catch {
		return { ok: false, error: safeError("NATIVE_UNAVAILABLE") };
	}
}
