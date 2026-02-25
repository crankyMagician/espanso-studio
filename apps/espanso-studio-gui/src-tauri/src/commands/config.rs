use std::fs;
use std::path::PathBuf;

use serde::Serialize;

use crate::util::{atomic_write_file, espanso_config_root, espanso_log_path, ActionResponse};

#[derive(Serialize)]
pub struct ConfigFileInfo {
    pub path: String,
    pub name: String,
}

#[derive(Serialize)]
pub struct EspansoPaths {
    pub config: String,
    pub match_dir: String,
    pub config_dir: String,
    pub packages: String,
    pub data: String,
    pub log: String,
}

#[tauri::command]
pub fn get_espanso_paths() -> Result<EspansoPaths, String> {
    let config_root = espanso_config_root()?;
    let log_path = espanso_log_path().unwrap_or_default();

    Ok(EspansoPaths {
        config: config_root.display().to_string(),
        match_dir: config_root.join("match").display().to_string(),
        config_dir: config_root.join("config").display().to_string(),
        packages: config_root.join("match/packages").display().to_string(),
        data: config_root.display().to_string(),
        log: log_path.display().to_string(),
    })
}

#[tauri::command]
pub fn list_config_files() -> Result<Vec<ConfigFileInfo>, String> {
    let config_dir = espanso_config_root()?.join("config");

    if !config_dir.exists() {
        return Ok(Vec::new());
    }

    let mut files = Vec::new();
    let entries = fs::read_dir(&config_dir)
        .map_err(|error| format!("unable to read {}: {error}", config_dir.display()))?;

    for entry in entries {
        let entry = entry.map_err(|error| {
            format!("unable to read entry in {}: {error}", config_dir.display())
        })?;
        let path = entry.path();

        if path.extension().and_then(|e| e.to_str()) == Some("yml") {
            let name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or_default()
                .to_string();
            files.push(ConfigFileInfo {
                path: path.display().to_string(),
                name,
            });
        }
    }

    files.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(files)
}

#[tauri::command]
pub fn read_config_file(file_path: String) -> Result<String, String> {
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err(format!("file not found: {file_path}"));
    }

    fs::read_to_string(&path).map_err(|error| format!("unable to read {file_path}: {error}"))
}

#[tauri::command]
pub fn write_config_file(file_path: String, content: String) -> Result<ActionResponse, String> {
    let path = PathBuf::from(&file_path);
    atomic_write_file(&path, &content)?;

    Ok(ActionResponse {
        ok: true,
        message: format!("saved {file_path}"),
    })
}

#[tauri::command]
pub fn open_in_finder(path: String) -> Result<ActionResponse, String> {
    std::process::Command::new("open")
        .arg(&path)
        .output()
        .map_err(|error| format!("failed to open {path}: {error}"))?;

    Ok(ActionResponse {
        ok: true,
        message: format!("opened {path}"),
    })
}
