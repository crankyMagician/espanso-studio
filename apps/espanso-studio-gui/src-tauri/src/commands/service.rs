use serde::Serialize;

use crate::util::{
    espanso_config_root, espanso_log_path, format_command_output, run_espanso, ActionResponse,
};

#[derive(Serialize)]
pub struct StatusResponse {
    pub running: bool,
    pub service_registered: bool,
    pub config_ok: bool,
    pub details: String,
}

#[tauri::command]
pub fn get_status() -> Result<StatusResponse, String> {
    let status_output = run_espanso(&["service", "status"]);
    let service_check_output = run_espanso(&["service", "check"]);
    let config_root = espanso_config_root()?;

    let running = status_output
        .as_ref()
        .map(|value| value.success && value.stdout.to_lowercase().contains("running"))
        .unwrap_or(false);

    let service_registered = service_check_output
        .as_ref()
        .map(|value| value.success && value.stdout.to_lowercase().contains("registered"))
        .unwrap_or(false);

    let config_ok =
        config_root.join("config/default.yml").exists() && config_root.join("match").exists();

    let mut details = vec![format!("config root: {}", config_root.display())];
    if let Ok(path) = espanso_log_path() {
        details.push(format!("log file: {}", path.display()));
    }

    if let Ok(output) = status_output {
        if !output.stdout.is_empty() {
            details.push(format!("status: {}", output.stdout));
        }
    }

    Ok(StatusResponse {
        running,
        service_registered,
        config_ok,
        details: details.join(" | "),
    })
}

#[tauri::command]
pub fn start_service() -> Result<ActionResponse, String> {
    let output = run_espanso(&["service", "start"])?;
    Ok(format_command_output("start service", &output))
}

#[tauri::command]
pub fn stop_service() -> Result<ActionResponse, String> {
    let output = run_espanso(&["service", "stop"])?;
    Ok(format_command_output("stop service", &output))
}

#[tauri::command]
pub fn restart_service() -> Result<ActionResponse, String> {
    let output = run_espanso(&["service", "restart"])?;
    Ok(format_command_output("restart service", &output))
}

#[tauri::command]
pub fn register_service() -> Result<ActionResponse, String> {
    let output = run_espanso(&["service", "register"])?;
    Ok(format_command_output("register service", &output))
}

#[tauri::command]
pub fn unregister_service() -> Result<ActionResponse, String> {
    let output = run_espanso(&["service", "unregister"])?;
    Ok(format_command_output("unregister service", &output))
}
