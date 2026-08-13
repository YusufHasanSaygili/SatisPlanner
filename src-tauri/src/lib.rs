use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;

const CONTRACT_VERSION: u16 = 2;

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
    #[serde(rename = "plan.save", rename_all = "camelCase")]
    SavePlan { plan_id: String, contents: String },
    #[serde(rename = "plan.inspect-recovery", rename_all = "camelCase")]
    InspectRecovery { plan_id: String },
    #[serde(rename = "plan.load", rename_all = "camelCase")]
    LoadPlan { plan_id: String, source: PlanSource },
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
enum PlanSource {
    Primary,
    LastGood,
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
    data: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<NativeError>,
}

impl NativeResponse {
    fn success(request_id: String, data: Value) -> Self {
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

#[derive(Debug)]
struct PlanPaths {
    primary: PathBuf,
    last_good: PathBuf,
    temporary: PathBuf,
    backup_temporary: PathBuf,
    lock: PathBuf,
}

impl PlanPaths {
    fn new(app_data_root: &Path, plan_id: &str) -> Self {
        let plans = app_data_root.join("plans");
        Self {
            primary: plans.join(format!("{plan_id}.json")),
            last_good: plans.join(format!("{plan_id}.last-good.json")),
            temporary: plans.join(format!("{plan_id}.tmp")),
            backup_temporary: plans.join(format!("{plan_id}.last-good.tmp")),
            lock: plans.join(format!("{plan_id}.lock")),
        }
    }
}

struct SaveLock {
    path: PathBuf,
}

impl Drop for SaveLock {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.path);
    }
}

fn validate_plan_id(plan_id: &str) -> bool {
    !plan_id.is_empty()
        && plan_id.len() <= 80
        && plan_id.chars().all(|character| {
            character.is_ascii_alphanumeric() || character == '-' || character == '_'
        })
}

fn plan_metadata(contents: &str) -> Option<(u64, String)> {
    let value: Value = serde_json::from_str(contents).ok()?;
    let schema_version = value.get("schemaVersion")?.as_u64()?;
    let updated_at = value
        .get("updatedAt")
        .and_then(Value::as_str)
        .unwrap_or("unknown")
        .to_owned();
    Some((schema_version, updated_at))
}

fn filesystem_timestamp(metadata: &fs::Metadata) -> String {
    let milliseconds = metadata
        .modified()
        .unwrap_or(SystemTime::UNIX_EPOCH)
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    format!("unix-ms:{milliseconds}")
}

fn write_and_sync(path: &Path, contents: &[u8]) -> std::io::Result<()> {
    let mut file = OpenOptions::new()
        .create(true)
        .truncate(true)
        .write(true)
        .open(path)?;
    file.write_all(contents)?;
    file.flush()?;
    file.sync_all()
}

#[cfg(unix)]
fn replace_file_atomically(source: &Path, destination: &Path) -> std::io::Result<()> {
    fs::rename(source, destination)
}

#[cfg(windows)]
fn replace_file_atomically(source: &Path, destination: &Path) -> std::io::Result<()> {
    use std::os::windows::ffi::OsStrExt;
    use std::ptr;
    use windows_sys::Win32::Storage::FileSystem::ReplaceFileW;

    if !destination.exists() {
        return fs::rename(source, destination);
    }
    let destination_wide: Vec<u16> = destination
        .as_os_str()
        .encode_wide()
        .chain(Some(0))
        .collect();
    let source_wide: Vec<u16> = source.as_os_str().encode_wide().chain(Some(0)).collect();
    let replaced = unsafe {
        ReplaceFileW(
            destination_wide.as_ptr(),
            source_wide.as_ptr(),
            ptr::null(),
            0,
            ptr::null_mut(),
            ptr::null_mut(),
        )
    };
    if replaced == 0 {
        Err(std::io::Error::last_os_error())
    } else {
        Ok(())
    }
}

#[cfg(not(any(unix, windows)))]
fn replace_file_atomically(source: &Path, destination: &Path) -> std::io::Result<()> {
    fs::rename(source, destination)
}

#[cfg(unix)]
fn sync_directory(path: &Path) -> std::io::Result<()> {
    File::open(path)?.sync_all()
}

#[cfg(not(unix))]
fn sync_directory(_path: &Path) -> std::io::Result<()> {
    Ok(())
}

fn acquire_save_lock(path: &Path) -> Result<SaveLock, &'static str> {
    match OpenOptions::new().write(true).create_new(true).open(path) {
        Ok(_) => Ok(SaveLock {
            path: path.to_owned(),
        }),
        Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => Err("SAVE_BUSY"),
        Err(_) => Err("SAVE_FAILED"),
    }
}

fn save_plan(app_data_root: &Path, plan_id: &str, contents: &str) -> Result<Value, &'static str> {
    if !validate_plan_id(plan_id) || plan_metadata(contents).is_none() {
        return Err("INVALID_REQUEST");
    }
    let paths = PlanPaths::new(app_data_root, plan_id);
    let plans_directory = paths.primary.parent().ok_or("SAVE_FAILED")?;
    fs::create_dir_all(plans_directory).map_err(|_| "SAVE_FAILED")?;
    let _lock = acquire_save_lock(&paths.lock)?;

    write_and_sync(&paths.temporary, contents.as_bytes()).map_err(|_| "SAVE_FAILED")?;
    let mut backup_created = false;
    if let Ok(existing) = fs::read_to_string(&paths.primary)
        && plan_metadata(&existing).is_some()
    {
        write_and_sync(&paths.backup_temporary, existing.as_bytes()).map_err(|_| "SAVE_FAILED")?;
        replace_file_atomically(&paths.backup_temporary, &paths.last_good)
            .map_err(|_| "SAVE_FAILED")?;
        backup_created = true;
    }
    replace_file_atomically(&paths.temporary, &paths.primary).map_err(|_| "SAVE_FAILED")?;
    sync_directory(plans_directory).map_err(|_| "SAVE_FAILED")?;
    let (schema_version, saved_at) = plan_metadata(contents).ok_or("INVALID_REQUEST")?;
    Ok(json!({
        "savedAt": saved_at,
        "schemaVersion": schema_version,
        "bytes": contents.len(),
        "backupCreated": backup_created
    }))
}

fn inspect_file(path: &Path) -> Value {
    let Ok(metadata) = fs::metadata(path) else {
        return json!({ "exists": false, "valid": false, "modifiedAt": null, "schemaVersion": null });
    };
    let modified_at = filesystem_timestamp(&metadata);
    let Ok(contents) = fs::read_to_string(path) else {
        return json!({ "exists": true, "valid": false, "modifiedAt": modified_at, "schemaVersion": null });
    };
    match plan_metadata(&contents) {
        Some((schema_version, updated_at)) => json!({
            "exists": true,
            "valid": true,
            "modifiedAt": if updated_at == "unknown" { modified_at } else { updated_at },
            "schemaVersion": schema_version
        }),
        None => {
            json!({ "exists": true, "valid": false, "modifiedAt": modified_at, "schemaVersion": null })
        }
    }
}

fn inspect_recovery(app_data_root: &Path, plan_id: &str) -> Result<Value, &'static str> {
    if !validate_plan_id(plan_id) {
        return Err("INVALID_REQUEST");
    }
    let paths = PlanPaths::new(app_data_root, plan_id);
    let primary = inspect_file(&paths.primary);
    let last_good = inspect_file(&paths.last_good);
    let interrupted_temp_present = paths.temporary.exists() || paths.backup_temporary.exists();
    let recovery_recommended = (!primary["valid"].as_bool().unwrap_or(false)
        || interrupted_temp_present)
        && last_good["valid"].as_bool().unwrap_or(false);
    Ok(json!({
        "primary": primary,
        "lastGood": last_good,
        "interruptedTempPresent": interrupted_temp_present,
        "recoveryRecommended": recovery_recommended
    }))
}

fn load_plan(
    app_data_root: &Path,
    plan_id: &str,
    source: PlanSource,
) -> Result<Value, &'static str> {
    if !validate_plan_id(plan_id) {
        return Err("INVALID_REQUEST");
    }
    let paths = PlanPaths::new(app_data_root, plan_id);
    let (path, source_name) = match source {
        PlanSource::Primary => (&paths.primary, "primary"),
        PlanSource::LastGood => (&paths.last_good, "last-good"),
    };
    let mut contents = String::new();
    File::open(path)
        .map_err(|_| "NOT_FOUND")?
        .read_to_string(&mut contents)
        .map_err(|_| "RECOVERY_UNAVAILABLE")?;
    let (_, updated_at) = plan_metadata(&contents).ok_or("RECOVERY_UNAVAILABLE")?;
    Ok(json!({ "source": source_name, "contents": contents, "modifiedAt": updated_at }))
}

fn native_error(request_id: String, code: &'static str) -> NativeResponse {
    let message = match code {
        "INVALID_REQUEST" => "Desktop request was rejected.",
        "SAVE_BUSY" => "Another save is already in progress.",
        "NOT_FOUND" => "The requested plan file was not found.",
        "RECOVERY_UNAVAILABLE" => "No valid recovery file is available.",
        _ => "The plan could not be saved safely.",
    };
    NativeResponse::error(request_id, code, message)
}

fn handle_native_request(request: NativeRequest, app_data_root: &Path) -> NativeResponse {
    if request.contract_version != CONTRACT_VERSION {
        return NativeResponse::error(
            request.request_id,
            "CONTRACT_VERSION_MISMATCH",
            "Desktop contract version is not supported.",
        );
    }
    if request.request_id.trim().is_empty() {
        return native_error(request.request_id, "INVALID_REQUEST");
    }
    let request_id = request.request_id;
    match request.command {
        NativeCommand::RuntimeInfo => NativeResponse::success(
            request_id,
            json!({
                "applicationName": "SatisPlanner",
                "applicationVersion": env!("CARGO_PKG_VERSION"),
                "runtime": "desktop-native"
            }),
        ),
        NativeCommand::SavePlan { plan_id, contents } => {
            match save_plan(app_data_root, &plan_id, &contents) {
                Ok(data) => NativeResponse::success(request_id, data),
                Err(code) => native_error(request_id, code),
            }
        }
        NativeCommand::InspectRecovery { plan_id } => {
            match inspect_recovery(app_data_root, &plan_id) {
                Ok(data) => NativeResponse::success(request_id, data),
                Err(code) => native_error(request_id, code),
            }
        }
        NativeCommand::LoadPlan { plan_id, source } => {
            match load_plan(app_data_root, &plan_id, source) {
                Ok(data) => NativeResponse::success(request_id, data),
                Err(code) => native_error(request_id, code),
            }
        }
    }
}

#[tauri::command]
fn native_request(app: tauri::AppHandle, request: NativeRequest) -> NativeResponse {
    let Ok(app_data_root) = app.path().app_data_dir() else {
        return NativeResponse::error(
            request.request_id,
            "SAVE_FAILED",
            "The plan could not be saved safely.",
        );
    };
    handle_native_request(request, &app_data_root)
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

    fn test_root(name: &str) -> PathBuf {
        let root = std::env::temp_dir().join(format!(
            "satisplanner-{name}-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos()
        ));
        fs::create_dir_all(&root).expect("create test root");
        root
    }

    fn plan_json(revision: u8) -> String {
        format!(
            r#"{{"schemaVersion":4,"updatedAt":"2026-08-11T20:00:0{revision}.000Z","revision":{revision}}}"#
        )
    }

    fn request(command: NativeCommand) -> NativeRequest {
        NativeRequest {
            contract_version: CONTRACT_VERSION,
            request_id: "request-1".to_owned(),
            command,
        }
    }

    #[test]
    fn contract_round_trip_uses_frontend_field_names() {
        let root = test_root("contract");
        let request_json = r#"{"contractVersion":2,"requestId":"request-1","command":{"type":"system.runtime-info"}}"#;
        let request: NativeRequest =
            serde_json::from_str(request_json).expect("deserialize request");
        let response_json = serde_json::to_value(handle_native_request(request, &root))
            .expect("serialize response");
        assert_eq!(response_json["contractVersion"], 2);
        assert_eq!(response_json["data"]["applicationVersion"], "1.0.0");
        assert_eq!(response_json["data"]["runtime"], "desktop-native");
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn atomic_save_keeps_last_good_and_ignores_interrupted_temp() {
        let root = test_root("atomic");
        save_plan(&root, "plan-1", &plan_json(1)).expect("first save");
        save_plan(&root, "plan-1", &plan_json(2)).expect("second save");
        let paths = PlanPaths::new(&root, "plan-1");
        write_and_sync(&paths.temporary, b"{truncated").expect("interrupted temp");
        assert_eq!(
            fs::read_to_string(&paths.primary).expect("primary"),
            plan_json(2)
        );
        assert_eq!(
            fs::read_to_string(&paths.last_good).expect("backup"),
            plan_json(1)
        );
        let inspection = inspect_recovery(&root, "plan-1").expect("inspection");
        assert_eq!(inspection["interruptedTempPresent"], true);
        assert_eq!(inspection["recoveryRecommended"], true);
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn truncated_primary_recovers_last_good_with_schema_and_timestamp() {
        let root = test_root("recovery");
        save_plan(&root, "plan-1", &plan_json(1)).expect("first save");
        save_plan(&root, "plan-1", &plan_json(2)).expect("second save");
        let paths = PlanPaths::new(&root, "plan-1");
        fs::write(&paths.primary, "{broken").expect("truncate primary");
        let inspection = inspect_recovery(&root, "plan-1").expect("inspection");
        assert_eq!(inspection["primary"]["valid"], false);
        assert_eq!(inspection["lastGood"]["schemaVersion"], 4);
        assert_eq!(
            inspection["lastGood"]["modifiedAt"],
            "2026-08-11T20:00:01.000Z"
        );
        let loaded = load_plan(&root, "plan-1", PlanSource::LastGood).expect("load backup");
        assert_eq!(loaded["contents"], plan_json(1));
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn concurrent_and_permission_failures_are_safe_and_do_not_expose_paths() {
        let root = test_root("failures");
        let paths = PlanPaths::new(&root, "plan-1");
        fs::create_dir_all(paths.lock.parent().expect("plans directory")).expect("plans directory");
        fs::write(&paths.lock, "busy").expect("lock file");
        let busy = handle_native_request(
            request(NativeCommand::SavePlan {
                plan_id: "plan-1".to_owned(),
                contents: plan_json(1),
            }),
            &root,
        );
        let busy_json = serde_json::to_string(&busy).expect("serialize busy");
        assert!(busy_json.contains("SAVE_BUSY"));
        assert!(!busy_json.contains(root.to_string_lossy().as_ref()));

        let invalid_root = root.join("not-a-directory");
        fs::write(&invalid_root, "file").expect("invalid root file");
        assert_eq!(
            save_plan(&invalid_root, "plan-2", &plan_json(1)),
            Err("SAVE_FAILED")
        );
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn version_mismatch_returns_a_safe_error_envelope() {
        let root = test_root("version");
        let response = handle_native_request(
            NativeRequest {
                contract_version: CONTRACT_VERSION + 1,
                request_id: "request-1".to_owned(),
                command: NativeCommand::RuntimeInfo,
            },
            &root,
        );
        let response_json = serde_json::to_value(response).expect("serialize response");
        assert_eq!(response_json["ok"], false);
        assert_eq!(response_json["error"]["code"], "CONTRACT_VERSION_MISMATCH");
        let _ = fs::remove_dir_all(root);
    }
}
