use crate::util::{format_command_output, run_espanso, ActionResponse};

#[tauri::command]
pub fn cmd_enable() -> Result<ActionResponse, String> {
    let output = run_espanso(&["cmd", "enable"])?;
    Ok(format_command_output("enable", &output))
}

#[tauri::command]
pub fn cmd_disable() -> Result<ActionResponse, String> {
    let output = run_espanso(&["cmd", "disable"])?;
    Ok(format_command_output("disable", &output))
}

#[tauri::command]
pub fn cmd_toggle() -> Result<ActionResponse, String> {
    let output = run_espanso(&["cmd", "toggle"])?;
    Ok(format_command_output("toggle", &output))
}

#[tauri::command]
pub fn cmd_search() -> Result<ActionResponse, String> {
    let output = run_espanso(&["cmd", "search"])?;
    Ok(format_command_output("search", &output))
}
