use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::util::{
    espanso_config_root, format_command_output, load_match_file_from, run_espanso,
    save_match_file_to, ActionResponse, RawMatch,
};

#[derive(Serialize)]
pub struct MatchItem {
    pub id: String,
    pub trigger: String,
    pub replace: String,
    pub disabled: bool,
    pub source_file: String,
}

#[derive(Serialize)]
pub struct MatchFileInfo {
    pub path: String,
    pub name: String,
    pub is_package: bool,
    pub match_count: usize,
}

#[derive(Deserialize)]
pub struct MatchInput {
    pub trigger: String,
    pub replace: String,
    #[serde(default)]
    pub disabled: bool,
}

fn validate_match_input(input: &MatchInput) -> Result<(String, String), String> {
    let trigger = input.trigger.trim().to_string();
    if trigger.is_empty() {
        return Err("trigger cannot be empty".to_string());
    }

    let replace = input.replace.trim().to_string();
    if replace.is_empty() {
        return Err("replace cannot be empty".to_string());
    }

    Ok((trigger, replace))
}

fn resolve_match_file(file_path: Option<String>) -> Result<PathBuf, String> {
    match file_path {
        Some(p) => Ok(PathBuf::from(p)),
        None => Ok(espanso_config_root()?.join("match/base.yml")),
    }
}

#[tauri::command]
pub fn list_match_files() -> Result<Vec<MatchFileInfo>, String> {
    let config_root = espanso_config_root()?;
    let match_dir = config_root.join("match");

    if !match_dir.exists() {
        return Ok(Vec::new());
    }

    let mut files = Vec::new();
    collect_yml_files(&match_dir, &match_dir, false, &mut files)?;

    let packages_dir = match_dir.join("packages");
    if packages_dir.exists() {
        // Already collected above; mark them as packages by checking path
    }

    // Sort user files first, then packages
    files.sort_by(|a, b| a.is_package.cmp(&b.is_package).then(a.name.cmp(&b.name)));

    Ok(files)
}

fn collect_yml_files(
    dir: &PathBuf,
    base: &PathBuf,
    _is_package: bool,
    files: &mut Vec<MatchFileInfo>,
) -> Result<(), String> {
    let entries =
        fs::read_dir(dir).map_err(|error| format!("unable to read {}: {error}", dir.display()))?;

    for entry in entries {
        let entry =
            entry.map_err(|error| format!("unable to read entry in {}: {error}", dir.display()))?;
        let path = entry.path();

        if path.is_dir() {
            let is_pkg = path
                .file_name()
                .and_then(|n| n.to_str())
                .map(|n| n == "packages")
                .unwrap_or(false)
                || _is_package;
            collect_yml_files(&path, base, is_pkg, files)?;
        } else if path.extension().and_then(|e| e.to_str()) == Some("yml") {
            let relative = path
                .strip_prefix(base)
                .unwrap_or(&path)
                .display()
                .to_string();
            let match_file = load_match_file_from(&path).unwrap_or_default();
            files.push(MatchFileInfo {
                path: path.display().to_string(),
                name: relative,
                is_package: _is_package,
                match_count: match_file.matches.len(),
            });
        }
    }

    Ok(())
}

#[tauri::command]
pub fn list_matches(file_path: Option<String>) -> Result<Vec<MatchItem>, String> {
    let path = resolve_match_file(file_path)?;
    let match_file = load_match_file_from(&path)?;

    let items = match_file
        .matches
        .iter()
        .map(|entry| MatchItem {
            id: entry.trigger.clone(),
            trigger: entry.trigger.clone(),
            replace: entry.replace.clone(),
            disabled: entry.disabled,
            source_file: path.display().to_string(),
        })
        .collect::<Vec<_>>();

    Ok(items)
}

#[tauri::command]
pub fn create_match(
    input: MatchInput,
    file_path: Option<String>,
) -> Result<ActionResponse, String> {
    let (trigger, replace) = validate_match_input(&input)?;
    let path = resolve_match_file(file_path)?;
    let mut match_file = load_match_file_from(&path)?;

    if match_file
        .matches
        .iter()
        .any(|entry| entry.trigger == trigger)
    {
        return Err(format!("trigger '{trigger}' already exists"));
    }

    match_file.matches.push(RawMatch {
        trigger: trigger.clone(),
        replace,
        disabled: input.disabled,
    });

    save_match_file_to(&path, &match_file)?;

    Ok(ActionResponse {
        ok: true,
        message: format!("created match '{trigger}'"),
    })
}

#[tauri::command]
pub fn update_match(
    id: String,
    input: MatchInput,
    file_path: Option<String>,
) -> Result<ActionResponse, String> {
    let (trigger, replace) = validate_match_input(&input)?;
    let path = resolve_match_file(file_path)?;
    let mut match_file = load_match_file_from(&path)?;

    let index = match_file
        .matches
        .iter()
        .position(|entry| entry.trigger == id)
        .ok_or_else(|| format!("match '{id}' was not found"))?;

    if id != trigger
        && match_file
            .matches
            .iter()
            .any(|entry| entry.trigger == trigger)
    {
        return Err(format!("trigger '{trigger}' already exists"));
    }

    match_file.matches[index] = RawMatch {
        trigger: trigger.clone(),
        replace,
        disabled: input.disabled,
    };

    save_match_file_to(&path, &match_file)?;

    Ok(ActionResponse {
        ok: true,
        message: format!("updated match '{trigger}'"),
    })
}

#[tauri::command]
pub fn delete_match(id: String, file_path: Option<String>) -> Result<ActionResponse, String> {
    let path = resolve_match_file(file_path)?;
    let mut match_file = load_match_file_from(&path)?;
    let previous_len = match_file.matches.len();

    match_file.matches.retain(|entry| entry.trigger != id);

    if match_file.matches.len() == previous_len {
        return Err(format!("match '{id}' was not found"));
    }

    save_match_file_to(&path, &match_file)?;

    Ok(ActionResponse {
        ok: true,
        message: format!("deleted match '{id}'"),
    })
}

#[tauri::command]
pub fn exec_match(trigger: String) -> Result<ActionResponse, String> {
    let output = run_espanso(&["match", "exec", "-t", &trigger])?;
    Ok(format_command_output("exec match", &output))
}
