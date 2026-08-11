export const NATIVE_CONTRACT_VERSION = 2 as const;

export type NativeErrorCode =
	| "CONTRACT_VERSION_MISMATCH"
	| "INVALID_REQUEST"
	| "MALFORMED_RESPONSE"
	| "NATIVE_UNAVAILABLE"
	| "SAVE_FAILED"
	| "SAVE_BUSY"
	| "NOT_FOUND"
	| "RECOVERY_UNAVAILABLE";

export interface RuntimeInfo {
	readonly applicationName: "SatisPlanner";
	readonly applicationVersion: string;
	readonly runtime: "desktop-native" | "browser-mock";
}

export type NativeCommand =
	| { readonly type: "system.runtime-info" }
	| { readonly type: "plan.save"; readonly planId: string; readonly contents: string }
	| { readonly type: "plan.inspect-recovery"; readonly planId: string }
	| {
			readonly type: "plan.load";
			readonly planId: string;
			readonly source: "primary" | "last-good";
	  };

export interface NativeRequest {
	readonly contractVersion: typeof NATIVE_CONTRACT_VERSION;
	readonly requestId: string;
	readonly command: NativeCommand;
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
	request(request: NativeRequest): Promise<unknown>;
}

export interface PlanSaveReceipt {
	readonly savedAt: string;
	readonly schemaVersion: number;
	readonly bytes: number;
	readonly backupCreated: boolean;
}

export interface RecoveryFileMetadata {
	readonly exists: boolean;
	readonly valid: boolean;
	readonly modifiedAt: string | null;
	readonly schemaVersion: number | null;
}

export interface RecoveryInspection {
	readonly primary: RecoveryFileMetadata;
	readonly lastGood: RecoveryFileMetadata;
	readonly interruptedTempPresent: boolean;
	readonly recoveryRecommended: boolean;
}

export interface PlanLoadData {
	readonly source: "primary" | "last-good";
	readonly contents: string;
	readonly modifiedAt: string;
}

export type NativeResult<T> =
	| { readonly ok: true; readonly data: T }
	| { readonly ok: false; readonly error: NativeError };

export type RuntimeInfoResult = NativeResult<RuntimeInfo>;

export function createNativeRequest(requestId: string, command: NativeCommand): NativeRequest {
	return { contractVersion: NATIVE_CONTRACT_VERSION, requestId, command };
}

function safeError(code: NativeErrorCode): NativeError {
	const messages: Record<NativeErrorCode, string> = {
		CONTRACT_VERSION_MISMATCH: "Desktop contract version is not supported.",
		INVALID_REQUEST: "Desktop request was rejected.",
		MALFORMED_RESPONSE: "Desktop returned an invalid response.",
		NATIVE_UNAVAILABLE: "Desktop service is unavailable.",
		SAVE_FAILED: "The plan could not be saved safely.",
		SAVE_BUSY: "Another save is already in progress.",
		NOT_FOUND: "The requested plan file was not found.",
		RECOVERY_UNAVAILABLE: "No valid recovery file is available.",
	};
	return { code, message: messages[code] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNativeErrorCode(value: unknown): value is NativeErrorCode {
	return [
		"CONTRACT_VERSION_MISMATCH",
		"INVALID_REQUEST",
		"MALFORMED_RESPONSE",
		"NATIVE_UNAVAILABLE",
		"SAVE_FAILED",
		"SAVE_BUSY",
		"NOT_FOUND",
		"RECOVERY_UNAVAILABLE",
	].includes(value as string);
}

function isRuntimeInfo(value: unknown): value is RuntimeInfo {
	return (
		isRecord(value) &&
		value.applicationName === "SatisPlanner" &&
		typeof value.applicationVersion === "string" &&
		(value.runtime === "desktop-native" || value.runtime === "browser-mock")
	);
}

function isPlanSaveReceipt(value: unknown): value is PlanSaveReceipt {
	return (
		isRecord(value) &&
		typeof value.savedAt === "string" &&
		typeof value.schemaVersion === "number" &&
		typeof value.bytes === "number" &&
		typeof value.backupCreated === "boolean"
	);
}

function isRecoveryMetadata(value: unknown): value is RecoveryFileMetadata {
	return (
		isRecord(value) &&
		typeof value.exists === "boolean" &&
		typeof value.valid === "boolean" &&
		(value.modifiedAt === null || typeof value.modifiedAt === "string") &&
		(value.schemaVersion === null || typeof value.schemaVersion === "number")
	);
}

function isRecoveryInspection(value: unknown): value is RecoveryInspection {
	return (
		isRecord(value) &&
		isRecoveryMetadata(value.primary) &&
		isRecoveryMetadata(value.lastGood) &&
		typeof value.interruptedTempPresent === "boolean" &&
		typeof value.recoveryRecommended === "boolean"
	);
}

function isPlanLoadData(value: unknown): value is PlanLoadData {
	return (
		isRecord(value) &&
		(value.source === "primary" || value.source === "last-good") &&
		typeof value.contents === "string" &&
		typeof value.modifiedAt === "string"
	);
}

async function requestNative<T>(
	adapter: NativeAdapter,
	requestId: string,
	command: NativeCommand,
	validate: (value: unknown) => value is T,
): Promise<NativeResult<T>> {
	try {
		const response = await adapter.request(createNativeRequest(requestId, command));
		if (
			!isRecord(response) ||
			typeof response.contractVersion !== "number" ||
			typeof response.requestId !== "string" ||
			typeof response.ok !== "boolean"
		)
			return { ok: false, error: safeError("MALFORMED_RESPONSE") };
		if (response.contractVersion !== NATIVE_CONTRACT_VERSION)
			return { ok: false, error: safeError("CONTRACT_VERSION_MISMATCH") };
		if (response.requestId !== requestId)
			return { ok: false, error: safeError("MALFORMED_RESPONSE") };
		if (!response.ok) {
			if (!isRecord(response.error) || !isNativeErrorCode(response.error.code))
				return { ok: false, error: safeError("MALFORMED_RESPONSE") };
			return { ok: false, error: safeError(response.error.code) };
		}
		if (!validate(response.data)) return { ok: false, error: safeError("MALFORMED_RESPONSE") };
		return { ok: true, data: response.data };
	} catch {
		return { ok: false, error: safeError("NATIVE_UNAVAILABLE") };
	}
}

export function requestRuntimeInfo(
	adapter: NativeAdapter,
	requestId: string,
): Promise<RuntimeInfoResult> {
	return requestNative(adapter, requestId, { type: "system.runtime-info" }, isRuntimeInfo);
}

export function requestPlanSave(
	adapter: NativeAdapter,
	requestId: string,
	planId: string,
	contents: string,
): Promise<NativeResult<PlanSaveReceipt>> {
	return requestNative(
		adapter,
		requestId,
		{ type: "plan.save", planId, contents },
		isPlanSaveReceipt,
	);
}

export function requestRecoveryInspection(
	adapter: NativeAdapter,
	requestId: string,
	planId: string,
): Promise<NativeResult<RecoveryInspection>> {
	return requestNative(
		adapter,
		requestId,
		{ type: "plan.inspect-recovery", planId },
		isRecoveryInspection,
	);
}

export function requestPlanLoad(
	adapter: NativeAdapter,
	requestId: string,
	planId: string,
	source: "primary" | "last-good",
): Promise<NativeResult<PlanLoadData>> {
	return requestNative(adapter, requestId, { type: "plan.load", planId, source }, isPlanLoadData);
}
