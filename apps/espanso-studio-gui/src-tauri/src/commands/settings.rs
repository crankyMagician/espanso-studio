use crate::util::{format_command_output, run_espanso, ActionResponse};

#[tauri::command]
pub fn env_path_register() -> Result<ActionResponse, String> {
    let output = run_espanso(&["env-path", "register"])?;
    Ok(format_command_output("env-path register", &output))
}

#[tauri::command]
pub fn env_path_unregister() -> Result<ActionResponse, String> {
    let output = run_espanso(&["env-path", "unregister"])?;
    Ok(format_command_output("env-path unregister", &output))
}

#[tauri::command]
pub fn workaround_secure_input() -> Result<ActionResponse, String> {
    let output = run_espanso(&["workaround", "secure-input"])?;
    Ok(format_command_output("workaround secure-input", &output))
}
