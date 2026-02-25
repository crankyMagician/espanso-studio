use serde::Serialize;

use crate::util::{format_command_output, run_espanso, ActionResponse};

#[derive(Serialize)]
pub struct PackageInfo {
    pub name: String,
    pub version: String,
    pub description: String,
}

#[tauri::command]
pub fn list_packages() -> Result<Vec<PackageInfo>, String> {
    let output = run_espanso(&["package", "list"])?;

    if !output.success {
        return Err(format!("failed to list packages: {}", output.stderr));
    }

    let mut packages = Vec::new();
    for line in output.stdout.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with("Installed") || line.starts_with('-') {
            continue;
        }

        // Format: "name - version - description" or "name (version)"
        let parts: Vec<&str> = line.splitn(3, " - ").collect();
        if parts.len() >= 2 {
            packages.push(PackageInfo {
                name: parts[0].trim().to_string(),
                version: parts[1].trim().to_string(),
                description: parts.get(2).unwrap_or(&"").trim().to_string(),
            });
        } else {
            packages.push(PackageInfo {
                name: line.to_string(),
                version: String::new(),
                description: String::new(),
            });
        }
    }

    Ok(packages)
}

#[tauri::command]
pub fn install_package(
    name: String,
    version: Option<String>,
    external: Option<bool>,
) -> Result<ActionResponse, String> {
    let mut args = vec!["package", "install"];
    let name_ref = name.as_str();
    args.push(name_ref);

    let version_str;
    if let Some(ref v) = version {
        args.push("--version");
        version_str = v.clone();
        args.push(&version_str);
    }

    if external.unwrap_or(false) {
        args.push("--external");
    }

    let output = run_espanso(&args)?;
    Ok(format_command_output("install package", &output))
}

#[tauri::command]
pub fn uninstall_package(name: String) -> Result<ActionResponse, String> {
    let output = run_espanso(&["package", "uninstall", &name])?;
    Ok(format_command_output("uninstall package", &output))
}

#[tauri::command]
pub fn update_package(name: String) -> Result<ActionResponse, String> {
    let output = run_espanso(&["package", "update", &name])?;
    Ok(format_command_output("update package", &output))
}
