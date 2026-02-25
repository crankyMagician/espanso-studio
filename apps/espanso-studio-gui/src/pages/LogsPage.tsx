import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState } from "react";
import ActionButton from "../components/ActionButton";
import type { LogEntry } from "../types";

type LogLevel = "ALL" | "INFO" | "WARN" | "ERROR";
const LOG_LEVELS: LogLevel[] = ["ALL", "INFO", "WARN", "ERROR"];

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [error, setError] = useState("");
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [levelFilter, setLevelFilter] = useState<LogLevel>("ALL");
    const [search, setSearch] = useState("");
    const logBoxRef = useRef<HTMLDivElement>(null);

    const loadLogs = useCallback(async () => {
        try {
            setError("");
            const result = await invoke<LogEntry[]>("tail_logs", {
                limit: 500,
            });
            setLogs(result);
        } catch (err) {
            setError(String(err));
        }
    }, []);

    useEffect(() => {
        void loadLogs();
    }, [loadLogs]);

    useEffect(() => {
        if (!autoRefresh) return;
        const timer = window.setInterval(() => {
            void loadLogs();
        }, 3000);
        return () => window.clearInterval(timer);
    }, [autoRefresh, loadLogs]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new log data
    useEffect(() => {
        if (logBoxRef.current) {
            logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
        }
    }, [logs]);

    const filtered = logs.filter((entry) => {
        if (
            levelFilter !== "ALL" &&
            entry.level.toUpperCase() !== levelFilter
        ) {
            return false;
        }
        if (search) {
            const lower = search.toLowerCase();
            return (
                entry.message.toLowerCase().includes(lower) ||
                entry.process.toLowerCase().includes(lower) ||
                entry.raw.toLowerCase().includes(lower)
            );
        }
        return true;
    });

    return (
        <div>
            <div className="page-header">
                <h1>Logs</h1>
                <p>Espanso service log viewer</p>
            </div>

            <div className="log-controls">
                <ActionButton label="Refresh" onClick={() => void loadLogs()} />
                <label className="checkbox-row">
                    <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    Auto-refresh
                </label>

                <div className="log-filter-buttons">
                    {LOG_LEVELS.map((level) => (
                        <button
                            type="button"
                            key={level}
                            className={levelFilter === level ? "active" : ""}
                            onClick={() => setLevelFilter(level)}
                        >
                            {level}
                        </button>
                    ))}
                </div>

                <input
                    className="log-search"
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <span className="muted-text">{filtered.length} entries</span>
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="log-box" ref={logBoxRef}>
                {filtered.map((entry, index) => (
                    <div key={`${entry.ts}-${index}`} className="log-line">
                        <span
                            className={`level level-${entry.level.toLowerCase()}`}
                        >
                            {entry.level}
                        </span>
                        <span>{entry.ts}</span>
                        <span>{entry.process}</span>
                        <span>{entry.message || entry.raw}</span>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="empty-state" style={{ color: "#94a3b8" }}>
                        No log entries
                    </div>
                )}
            </div>
        </div>
    );
}
