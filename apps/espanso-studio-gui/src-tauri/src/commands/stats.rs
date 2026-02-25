use rusqlite::Connection;
use serde::Serialize;

use crate::util::{espanso_config_root, format_command_output, run_espanso, ActionResponse};

#[derive(Serialize)]
pub struct StatsResponse {
    pub total: i64,
    pub unique: i64,
    pub top: Vec<TriggerStat>,
}

#[derive(Serialize)]
pub struct TriggerStat {
    pub trigger: String,
    pub count: i64,
}

fn stats_db_path() -> Result<std::path::PathBuf, String> {
    Ok(espanso_config_root()?.join("stats.db"))
}

fn time_filter(period: &str) -> &'static str {
    match period {
        "today" => "AND timestamp >= datetime('now', 'start of day')",
        "week" => "AND timestamp >= datetime('now', '-7 days')",
        "month" => "AND timestamp >= datetime('now', '-30 days')",
        "year" => "AND timestamp >= datetime('now', '-365 days')",
        _ => "",
    }
}

fn query_totals(conn: &Connection, tf: &str, grep: Option<&str>) -> Result<(i64, i64), String> {
    let mut total_sql = format!(
        "SELECT COUNT(*) FROM expansions e JOIN triggers t ON e.trigger_id = t.id WHERE 1=1 {tf}"
    );
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    if let Some(pattern) = grep {
        total_sql.push_str(" AND t.name LIKE ?");
        params_vec.push(Box::new(pattern.to_string()));
    }
    let total: i64 = conn
        .query_row(
            &total_sql,
            rusqlite::params_from_iter(params_vec.iter().map(|b| &**b)),
            |row| row.get(0),
        )
        .map_err(|e| format!("stats query error: {e}"))?;

    let mut unique_sql = format!(
        "SELECT COUNT(*) FROM (SELECT DISTINCT t.id FROM expansions e JOIN triggers t ON e.trigger_id = t.id WHERE 1=1 {tf}"
    );
    let mut unique_params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    if let Some(pattern) = grep {
        unique_sql.push_str(" AND t.name LIKE ?");
        unique_params.push(Box::new(pattern.to_string()));
    }
    unique_sql.push(')');
    let unique: i64 = conn
        .query_row(
            &unique_sql,
            rusqlite::params_from_iter(unique_params.iter().map(|b| &**b)),
            |row| row.get(0),
        )
        .map_err(|e| format!("stats query error: {e}"))?;

    Ok((total, unique))
}

fn query_top(
    conn: &Connection,
    tf: &str,
    grep: Option<&str>,
    count: usize,
) -> Result<Vec<TriggerStat>, String> {
    let mut sql = format!(
        "SELECT t.name as trigger_name, COUNT(*) as cnt FROM expansions e JOIN triggers t ON e.trigger_id = t.id WHERE 1=1 {tf}"
    );
    let mut params_any: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    if let Some(pattern) = grep {
        sql.push_str(" AND t.name LIKE ?");
        params_any.push(Box::new(pattern.to_string()));
    }
    sql.push_str(" GROUP BY t.name ORDER BY cnt DESC LIMIT ?");
    params_any.push(Box::new(count as i64));

    let mut stmt = conn
        .prepare(&sql)
        .map_err(|e| format!("stats prepare error: {e}"))?;
    let mut rows = stmt
        .query(rusqlite::params_from_iter(params_any.iter().map(|b| &**b)))
        .map_err(|e| format!("stats query error: {e}"))?;

    let mut res = Vec::new();
    while let Some(row) = rows.next().map_err(|e| format!("stats row error: {e}"))? {
        let trigger: String = row.get(0).map_err(|e| format!("stats column error: {e}"))?;
        let count: i64 = row.get(1).map_err(|e| format!("stats column error: {e}"))?;
        res.push(TriggerStat { trigger, count });
    }
    Ok(res)
}

#[tauri::command]
pub fn get_stats(
    period: Option<String>,
    count: Option<usize>,
    grep: Option<String>,
) -> Result<StatsResponse, String> {
    let db_path = stats_db_path()?;

    if !db_path.exists() {
        return Ok(StatsResponse {
            total: 0,
            unique: 0,
            top: Vec::new(),
        });
    }

    let conn = Connection::open(&db_path).map_err(|e| format!("unable to open stats db: {e}"))?;

    let period_str = period.as_deref().unwrap_or("all");
    let tf = time_filter(period_str);
    let max_count = count.unwrap_or(20);

    let (total, unique) = query_totals(&conn, tf, grep.as_deref())?;
    let top = query_top(&conn, tf, grep.as_deref(), max_count)?;

    Ok(StatsResponse { total, unique, top })
}

#[tauri::command]
pub fn clear_stats() -> Result<ActionResponse, String> {
    let output = run_espanso(&["stats", "clear"])?;
    Ok(format_command_output("clear stats", &output))
}

#[tauri::command]
pub fn prune_stats(days: Option<i64>) -> Result<ActionResponse, String> {
    let d = days.unwrap_or(180);
    let days_str = d.to_string();
    let output = run_espanso(&["stats", "prune", "--days", &days_str])?;
    Ok(format_command_output("prune stats", &output))
}
