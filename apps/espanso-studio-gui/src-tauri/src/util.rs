use std::env;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::OnceLock;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct ActionResponse {
    pub ok: bool,
    pub message: String,
}

#[derive(Default, Deserialize, Serialize)]
pub struct MatchFile {
    #[serde(default)]
    pub matches: Vec<RawMatch>,
}

#[derive(Default, Deserialize, Serialize)]
pub struct RawMatch {
    pub trigger: String,
    pub replace: String,
    #[serde(default)]
    pub disabled: bool,
}

pub struct CommandOutput {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
}

pub fn home_dir() -> Result<PathBuf, String> {
    env::var("HOME")
        .map(PathBuf::from)
        .map_err(|_| "HOME is not set in environment".to_string())
}

pub fn espanso_config_root() -> Result<PathBuf, String> {
    if let Ok(path) = env::var("ESPANSO_CONFIG_DIR") {
        return Ok(PathBuf::from(path));
    }

    let home = home_dir()?;
    Ok(home.join("Library/Application Support/espanso"))
}

pub fn espanso_log_path() -> Result<PathBuf, String> {
    if let Ok(path) = env::var("ESPANSO_LOG_FILE") {
        return Ok(PathBuf::from(path));
    }

    let home = home_dir()?;
    Ok(home.join("Library/Caches/espanso/espanso.log"))
}

fn resolve_espanso_binary() -> &'static str {
    static BINARY: OnceLock<String> = OnceLock::new();
    BINARY.get_or_init(|| {
        let candidates = [
            "/opt/homebrew/bin/espanso",
            "/usr/local/bin/espanso",
        ];
        for path in candidates {
            if fs::metadata(path).is_ok() {
                return path.to_string();
            }
        }
        "espanso".to_string()
    })
}

pub fn run_espanso(args: &[&str]) -> Result<CommandOutput, String> {
    let binary = resolve_espanso_binary();
    let output = Command::new(binary)
        .args(args)
        .output()
        .map_err(|error| format!("failed to run {binary} {}: {error}", args.join(" ")))?;

    Ok(CommandOutput {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).trim().to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).trim().to_string(),
    })
}

pub fn format_command_output(operation: &str, output: &CommandOutput) -> ActionResponse {
    let mut chunks: Vec<String> = vec![format!(
        "{operation}: {}",
        if output.success { "ok" } else { "failed" }
    )];

    if !output.stdout.is_empty() {
        chunks.push(output.stdout.clone());
    }

    if !output.stderr.is_empty() {
        chunks.push(output.stderr.clone());
    }

    ActionResponse {
        ok: output.success,
        message: chunks.join("\n"),
    }
}

pub fn load_match_file_from(path: &PathBuf) -> Result<MatchFile, String> {
    if !path.exists() {
        return Ok(MatchFile::default());
    }

    let data = fs::read_to_string(path)
        .map_err(|error| format!("unable to read {}: {error}", path.display()))?;

    if data.trim().is_empty() {
        return Ok(MatchFile::default());
    }

    serde_yaml::from_str::<MatchFile>(&data)
        .map_err(|error| format!("invalid match yaml in {}: {error}", path.display()))
}

pub fn save_match_file_to(path: &PathBuf, match_file: &MatchFile) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("unable to create {}: {error}", parent.display()))?;
    }

    if path.exists() {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|error| format!("system clock error: {error}"))?
            .as_secs();
        let backup_path = path.with_extension(format!("yml.bak.{timestamp}"));
        fs::copy(path, &backup_path).map_err(|error| {
            format!(
                "unable to create backup {} from {}: {error}",
                backup_path.display(),
                path.display()
            )
        })?;
    }

    let rendered = serde_yaml::to_string(match_file)
        .map_err(|error| format!("unable to serialize match file: {error}"))?;

    let temporary_path = path.with_extension("yml.tmp");
    fs::write(&temporary_path, rendered)
        .map_err(|error| format!("unable to write {}: {error}", temporary_path.display()))?;
    fs::rename(&temporary_path, path).map_err(|error| {
        format!(
            "unable to move {} to {}: {error}",
            temporary_path.display(),
            path.display()
        )
    })?;

    Ok(())
}

pub fn atomic_write_file(path: &PathBuf, content: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("unable to create {}: {error}", parent.display()))?;
    }

    if path.exists() {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|error| format!("system clock error: {error}"))?
            .as_secs();
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("bak");
        let backup_path = path.with_extension(format!("{ext}.bak.{timestamp}"));
        fs::copy(path, &backup_path).map_err(|error| {
            format!("unable to create backup {}: {error}", backup_path.display())
        })?;
    }

    let temporary_path = path.with_extension("tmp");
    fs::write(&temporary_path, content)
        .map_err(|error| format!("unable to write {}: {error}", temporary_path.display()))?;
    fs::rename(&temporary_path, path).map_err(|error| {
        format!(
            "unable to move {} to {}: {error}",
            temporary_path.display(),
            path.display()
        )
    })?;

    Ok(())
}
