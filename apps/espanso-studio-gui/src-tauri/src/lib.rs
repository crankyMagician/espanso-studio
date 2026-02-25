use regex::Regex;
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize)]
struct StatusResponse {
  running: bool,
  service_registered: bool,
  config_ok: bool,
  details: String,
}

#[derive(Serialize)]
struct ActionResponse {
  ok: bool,
  message: String,
}

#[derive(Serialize)]
struct MatchItem {
  id: String,
  trigger: String,
  replace: String,
  disabled: bool,
  source_file: String,
}

#[derive(Deserialize)]
struct MatchInput {
  trigger: String,
  replace: String,
  #[serde(default)]
  disabled: bool,
}

#[derive(Serialize)]
struct LogEntry {
  ts: String,
  level: String,
  process: String,
  message: String,
  raw: String,
}

#[derive(Default, Deserialize, Serialize)]
struct MatchFile {
  #[serde(default)]
  matches: Vec<RawMatch>,
}

#[derive(Default, Deserialize, Serialize)]
struct RawMatch {
  trigger: String,
  replace: String,
  #[serde(default)]
  disabled: bool,
}

struct CommandOutput {
  success: bool,
  stdout: String,
  stderr: String,
}

fn home_dir() -> Result<PathBuf, String> {
  env::var("HOME")
    .map(PathBuf::from)
    .map_err(|_| "HOME is not set in environment".to_string())
}

fn espanso_config_root() -> Result<PathBuf, String> {
  if let Ok(path) = env::var("ESPANSO_CONFIG_DIR") {
    return Ok(PathBuf::from(path));
  }

  #[cfg(target_os = "macos")]
  {
    let home = home_dir()?;
    return Ok(home.join("Library/Application Support/espanso"));
  }

  #[cfg(not(target_os = "macos"))]
  {
    let home = home_dir()?;
    Ok(home.join(".config/espanso"))
  }
}

fn espanso_log_path() -> Result<PathBuf, String> {
  if let Ok(path) = env::var("ESPANSO_LOG_FILE") {
    return Ok(PathBuf::from(path));
  }

  #[cfg(target_os = "macos")]
  {
    let home = home_dir()?;
    return Ok(home.join("Library/Caches/espanso/espanso.log"));
  }

  #[cfg(not(target_os = "macos"))]
  {
    let home = home_dir()?;
    Ok(home.join(".cache/espanso/espanso.log"))
  }
}

fn match_file_path() -> Result<PathBuf, String> {
  Ok(espanso_config_root()?.join("match/base.yml"))
}

fn run_espanso_raw(args: &[&str]) -> Result<CommandOutput, String> {
  let output = Command::new("espanso")
    .args(args)
    .output()
    .map_err(|error| format!("failed to run espanso {}: {error}", args.join(" ")))?;

  Ok(CommandOutput {
    success: output.status.success(),
    stdout: String::from_utf8_lossy(&output.stdout).trim().to_string(),
    stderr: String::from_utf8_lossy(&output.stderr).trim().to_string(),
  })
}

fn format_command_output(operation: &str, output: &CommandOutput) -> ActionResponse {
  let mut chunks: Vec<String> = vec![format!("{operation}: {}", if output.success { "ok" } else { "failed" })];

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

fn load_match_file() -> Result<MatchFile, String> {
  let path = match_file_path()?;
  if !path.exists() {
    return Ok(MatchFile::default());
  }

  let data = fs::read_to_string(&path)
    .map_err(|error| format!("unable to read {}: {error}", path.display()))?;

  if data.trim().is_empty() {
    return Ok(MatchFile::default());
  }

  serde_yaml::from_str::<MatchFile>(&data)
    .map_err(|error| format!("invalid match yaml in {}: {error}", path.display()))
}

fn save_match_file(match_file: &MatchFile) -> Result<(), String> {
  let path = match_file_path()?;
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
    fs::copy(&path, &backup_path).map_err(|error| {
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
  fs::rename(&temporary_path, &path).map_err(|error| {
    format!(
      "unable to move {} to {}: {error}",
      temporary_path.display(),
      path.display()
    )
  })?;

  Ok(())
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

#[tauri::command]
fn get_status() -> Result<StatusResponse, String> {
  let status_output = run_espanso_raw(&["service", "status"]);
  let service_check_output = run_espanso_raw(&["service", "check"]);
  let config_root = espanso_config_root()?;

  let running = status_output
    .as_ref()
    .map(|value| value.success && value.stdout.to_lowercase().contains("running"))
    .unwrap_or(false);

  let service_registered = service_check_output
    .as_ref()
    .map(|value| value.success && value.stdout.to_lowercase().contains("registered"))
    .unwrap_or(false);

  let config_ok = config_root.join("config/default.yml").exists() && config_root.join("match").exists();

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
fn start_service() -> Result<ActionResponse, String> {
  let output = run_espanso_raw(&["service", "start"])?;
  Ok(format_command_output("start service", &output))
}

#[tauri::command]
fn stop_service() -> Result<ActionResponse, String> {
  let output = run_espanso_raw(&["service", "stop"])?;
  Ok(format_command_output("stop service", &output))
}

#[tauri::command]
fn restart_service() -> Result<ActionResponse, String> {
  let output = run_espanso_raw(&["service", "restart"])?;
  Ok(format_command_output("restart service", &output))
}

#[tauri::command]
fn list_matches() -> Result<Vec<MatchItem>, String> {
  let path = match_file_path()?;
  let match_file = load_match_file()?;

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
fn create_match(input: MatchInput) -> Result<ActionResponse, String> {
  let (trigger, replace) = validate_match_input(&input)?;
  let mut match_file = load_match_file()?;

  if match_file.matches.iter().any(|entry| entry.trigger == trigger) {
    return Err(format!("trigger '{trigger}' already exists"));
  }

  match_file.matches.push(RawMatch {
    trigger: trigger.clone(),
    replace,
    disabled: input.disabled,
  });

  save_match_file(&match_file)?;

  Ok(ActionResponse {
    ok: true,
    message: format!("created match '{trigger}'"),
  })
}

#[tauri::command]
fn update_match(id: String, input: MatchInput) -> Result<ActionResponse, String> {
  let (trigger, replace) = validate_match_input(&input)?;
  let mut match_file = load_match_file()?;

  let index = match_file
    .matches
    .iter()
    .position(|entry| entry.trigger == id)
    .ok_or_else(|| format!("match '{id}' was not found"))?;

  if id != trigger && match_file.matches.iter().any(|entry| entry.trigger == trigger) {
    return Err(format!("trigger '{trigger}' already exists"));
  }

  match_file.matches[index] = RawMatch {
    trigger: trigger.clone(),
    replace,
    disabled: input.disabled,
  };

  save_match_file(&match_file)?;

  Ok(ActionResponse {
    ok: true,
    message: format!("updated match '{trigger}'"),
  })
}

#[tauri::command]
fn delete_match(id: String) -> Result<ActionResponse, String> {
  let mut match_file = load_match_file()?;
  let previous_len = match_file.matches.len();

  match_file.matches.retain(|entry| entry.trigger != id);

  if match_file.matches.len() == previous_len {
    return Err(format!("match '{id}' was not found"));
  }

  save_match_file(&match_file)?;

  Ok(ActionResponse {
    ok: true,
    message: format!("deleted match '{id}'"),
  })
}

#[tauri::command]
fn tail_logs(limit: Option<usize>) -> Result<Vec<LogEntry>, String> {
  let path = espanso_log_path()?;
  if !path.exists() {
    return Ok(Vec::new());
  }

  let data = fs::read_to_string(&path)
    .map_err(|error| format!("unable to read log {}: {error}", path.display()))?;
  let lines = data.lines().collect::<Vec<_>>();
  let max_lines = limit.unwrap_or(200);
  let start = lines.len().saturating_sub(max_lines);

  let parser = Regex::new(r"^(?P<ts>\d{2}:\d{2}:\d{2}) \[(?P<process>[^\]]+)\] \[(?P<level>[^\]]+)\] (?P<message>.*)$")
    .map_err(|error| format!("unable to compile log parser: {error}"))?;

  let entries = lines
    .iter()
    .skip(start)
    .map(|line| {
      if let Some(captures) = parser.captures(line) {
        LogEntry {
          ts: captures
            .name("ts")
            .map(|value| value.as_str())
            .unwrap_or_default()
            .to_string(),
          level: captures
            .name("level")
            .map(|value| value.as_str())
            .unwrap_or("UNKNOWN")
            .to_string(),
          process: captures
            .name("process")
            .map(|value| value.as_str())
            .unwrap_or_default()
            .to_string(),
          message: captures
            .name("message")
            .map(|value| value.as_str())
            .unwrap_or_default()
            .to_string(),
          raw: (*line).to_string(),
        }
      } else {
        LogEntry {
          ts: String::new(),
          level: "UNKNOWN".to_string(),
          process: String::new(),
          message: (*line).to_string(),
          raw: (*line).to_string(),
        }
      }
    })
    .collect::<Vec<_>>();

  Ok(entries)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      get_status,
      start_service,
      stop_service,
      restart_service,
      list_matches,
      create_match,
      update_match,
      delete_match,
      tail_logs
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
