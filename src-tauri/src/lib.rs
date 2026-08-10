use serde::{Deserialize, Serialize};

const CONTRACT_VERSION: u16 = 1;

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeRequest {
    contract_version: u16,
    request_id: String,
    command: NativeCommand,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "type")]
enum NativeCommand {
    #[serde(rename = "system.runtime-info")]
    RuntimeInfo,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeInfo {
    application_name: &'static str,
    application_version: &'static str,
    runtime: &'static str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeError {
    code: &'static str,
    message: &'static str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeResponse {
    contract_version: u16,
    request_id: String,
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<RuntimeInfo>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<NativeError>,
}

impl NativeResponse {
    fn success(request_id: String, data: RuntimeInfo) -> Self {
        Self {
            contract_version: CONTRACT_VERSION,
            request_id,
            ok: true,
            data: Some(data),
            error: None,
        }
    }

    fn error(request_id: String, code: &'static str, message: &'static str) -> Self {
        Self {
            contract_version: CONTRACT_VERSION,
            request_id,
            ok: false,
            data: None,
            error: Some(NativeError { code, message }),
        }
    }
}

fn handle_native_request(request: NativeRequest) -> NativeResponse {
    if request.contract_version != CONTRACT_VERSION {
        return NativeResponse::error(
            request.request_id,
            "CONTRACT_VERSION_MISMATCH",
            "Desktop contract version is not supported.",
        );
    }
    if request.request_id.trim().is_empty() {
        return NativeResponse::error(
            request.request_id,
            "INVALID_REQUEST",
            "Desktop request was rejected.",
        );
    }

    match request.command {
        NativeCommand::RuntimeInfo => NativeResponse::success(
            request.request_id,
            RuntimeInfo {
                application_name: "SatisPlanner",
                application_version: env!("CARGO_PKG_VERSION"),
                runtime: "desktop-native",
            },
        ),
    }
}

#[tauri::command]
fn native_request(request: NativeRequest) -> NativeResponse {
    handle_native_request(request)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![native_request])
        .run(tauri::generate_context!())
        .expect("SatisPlanner desktop runtime failed");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn runtime_request(version: u16) -> NativeRequest {
        NativeRequest {
            contract_version: version,
            request_id: "request-1".to_owned(),
            command: NativeCommand::RuntimeInfo,
        }
    }

    #[test]
    fn contract_round_trip_uses_frontend_field_names() {
        let request_json = r#"{
            "contractVersion": 1,
            "requestId": "request-1",
            "command": { "type": "system.runtime-info" }
        }"#;
        let request: NativeRequest =
            serde_json::from_str(request_json).expect("deserialize request");
        let response = handle_native_request(request);
        let response_json = serde_json::to_value(response).expect("serialize response");

        assert_eq!(response_json["contractVersion"], 1);
        assert_eq!(response_json["requestId"], "request-1");
        assert_eq!(response_json["ok"], true);
        assert_eq!(response_json["data"]["applicationName"], "SatisPlanner");
        assert_eq!(response_json["data"]["applicationVersion"], "0.6.0");
        assert_eq!(response_json["data"]["runtime"], "desktop-native");
        assert!(response_json.get("error").is_none());
    }

    #[test]
    fn version_mismatch_returns_a_safe_error_envelope() {
        let response = handle_native_request(runtime_request(CONTRACT_VERSION + 1));
        let response_json = serde_json::to_value(response).expect("serialize response");

        assert_eq!(response_json["ok"], false);
        assert_eq!(response_json["error"]["code"], "CONTRACT_VERSION_MISMATCH");
        assert_eq!(
            response_json["error"]["message"],
            "Desktop contract version is not supported."
        );
        assert!(response_json.get("data").is_none());
    }

    #[test]
    fn invalid_request_does_not_expose_paths_or_raw_exceptions() {
        let mut request = runtime_request(CONTRACT_VERSION);
        request.request_id.clear();
        let response = handle_native_request(request);
        let response_json = serde_json::to_string(&response).expect("serialize response");

        assert!(response_json.contains("INVALID_REQUEST"));
        assert!(!response_json.contains("\\\\"));
        assert!(!response_json.contains("Users"));
    }
}
