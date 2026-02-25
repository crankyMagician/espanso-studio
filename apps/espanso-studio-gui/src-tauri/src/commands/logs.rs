use regex::Regex;
use serde::Serialize;
use std::fs;

use crate::util::espanso_log_path;

#[derive(Serialize)]
pub struct LogEntry {
    pub ts: String,
    pub level: String,
    pub process: String,
    pub message: String,
    pub raw: String,
}

#[tauri::command]
pub fn tail_logs(limit: Option<usize>) -> Result<Vec<LogEntry>, String> {
    let path = espanso_log_path()?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let data = fs::read_to_string(&path)
        .map_err(|error| format!("unable to read log {}: {error}", path.display()))?;
    let lines = data.lines().collect::<Vec<_>>();
    let max_lines = limit.unwrap_or(200);
    let start = lines.len().saturating_sub(max_lines);

    let parser = Regex::new(
        r"^(?P<ts>\d{2}:\d{2}:\d{2}) \[(?P<process>[^\]]+)\] \[(?P<level>[^\]]+)\] (?P<message>.*)$",
    )
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
