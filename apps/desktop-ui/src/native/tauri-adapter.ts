import { invoke } from "@tauri-apps/api/core";
import type { NativeAdapter, NativeRequest } from "./contracts";

export function createTauriNativeAdapter(): NativeAdapter {
	return {
		request(request: NativeRequest) {
			return invoke<unknown>("native_request", { request });
		},
	};
}

export function isTauriRuntime(): boolean {
	return "__TAURI_INTERNALS__" in window;
}
