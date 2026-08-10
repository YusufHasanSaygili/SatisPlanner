use serde::Serialize;
use std::{
    fs::{self, OpenOptions},
    io::Read,
    path::Path,
    time::UNIX_EPOCH,
};

const MAX_DOCS_BYTES: u64 = 64 * 1024 * 1024;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocsProbe {
    canonical_path: String,
    byte_length: u64,
    modified_before_ms: u128,
    modified_after_ms: u128,
}

fn modified_ms(metadata: &fs::Metadata) -> Result<u128, String> {
    metadata
        .modified()
        .map_err(|error| error.to_string())?
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())
        .map(|duration| duration.as_millis())
}

#[tauri::command]
fn probe_docs_file(path: String) -> Result<DocsProbe, String> {
    let canonical = fs::canonicalize(Path::new(&path)).map_err(|error| error.to_string())?;
    if canonical.extension().and_then(|value| value.to_str()) != Some("json") {
        return Err("Only a selected JSON file can be probed".into());
    }

    let before = fs::metadata(&canonical).map_err(|error| error.to_string())?;
    if !before.is_file() || before.len() > MAX_DOCS_BYTES {
        return Err("Docs file must be a regular file no larger than 64 MiB".into());
    }

    let mut file = OpenOptions::new()
        .read(true)
        .write(false)
        .open(&canonical)
        .map_err(|error| error.to_string())?;
    let mut prefix = [0_u8; 4];
    let _ = file.read(&mut prefix).map_err(|error| error.to_string())?;

    let after = fs::metadata(&canonical).map_err(|error| error.to_string())?;
    Ok(DocsProbe {
        canonical_path: canonical.to_string_lossy().into_owned(),
        byte_length: before.len(),
        modified_before_ms: modified_ms(&before)?,
        modified_after_ms: modified_ms(&after)?,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![probe_docs_file])
        .run(tauri::generate_context!())
        .expect("SatisPlanner rewrite probe failed");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn selected_json_is_opened_read_only() {
        let path = std::env::temp_dir().join(format!(
            "satisplanner-docs-probe-{}.json",
            std::process::id()
        ));
        let mut fixture = fs::File::create(&path).expect("create fixture");
        fixture
            .write_all(br#"[{"NativeClass":"/Script/FactoryGame.FGItemDescriptor"}]"#)
            .expect("write fixture");
        drop(fixture);
        let before = fs::read(&path).expect("read before");

        let result = probe_docs_file(path.to_string_lossy().into_owned()).expect("probe");
        let after = fs::read(&path).expect("read after");

        assert_eq!(before, after);
        assert_eq!(result.byte_length, before.len() as u64);
        assert_eq!(result.modified_before_ms, result.modified_after_ms);
        fs::remove_file(path).expect("remove fixture");
    }
}
