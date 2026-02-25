import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import ActionButton from "../components/ActionButton";
import type { ActionResponse, StatsResponse } from "../types";

const PERIODS = ["today", "week", "month", "year", "all"] as const;

export default function StatsPage() {
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const [period, setPeriod] = useState<string>("all");
    const [grep, setGrep] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [pruneLoading, setPruneLoading] = useState(false);
    const [clearLoading, setClearLoading] = useState(false);
    const [pruneDays, setPruneDays] = useState("180");

    const loadStats = useCallback(async () => {
        try {
            setError("");
            const result = await invoke<StatsResponse>("get_stats", {
                period,
                count: 20,
                grep: grep.trim() || null,
            });
            setStats(result);
        } catch (err) {
            setError(String(err));
        }
    }, [period, grep]);

    useEffect(() => {
        void loadStats();
    }, [loadStats]);

    const maxCount =
        stats?.top.reduce((max, item) => Math.max(max, item.count), 0) ?? 1;

    async function handleClear() {
        setClearLoading(true);
        try {
            const result = await invoke<ActionResponse>("clear_stats");
            setMessage(result.message);
            await loadStats();
        } catch (err) {
            setError(String(err));
        } finally {
            setClearLoading(false);
        }
    }

    async function handlePrune() {
        const days = Number.parseInt(pruneDays, 10);
        if (Number.isNaN(days) || days <= 0) return;
        setPruneLoading(true);
        try {
            const result = await invoke<ActionResponse>("prune_stats", {
                days,
            });
            setMessage(result.message);
            await loadStats();
        } catch (err) {
            setError(String(err));
        } finally {
            setPruneLoading(false);
        }
    }

    return (
        <div>
            <div className="page-header">
                <h1>Statistics</h1>
                <p>Expansion usage data</p>
            </div>

            <div className="stats-summary">
                <div className="stat-card">
                    <div className="stat-value">{stats?.total ?? 0}</div>
                    <div className="stat-label">Total Expansions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats?.unique ?? 0}</div>
                    <div className="stat-label">Unique Triggers</div>
                </div>
            </div>

            <div className="card">
                <h3>Top Triggers</h3>

                <div className="period-filter">
                    {PERIODS.map((p) => (
                        <button
                            type="button"
                            key={p}
                            className={period === p ? "active" : ""}
                            onClick={() => setPeriod(p)}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>

                <div style={{ marginBottom: 12 }}>
                    <input
                        className="log-search"
                        placeholder="Filter triggers..."
                        value={grep}
                        onChange={(e) => setGrep(e.target.value)}
                    />
                </div>

                {error && <p className="error-text">{error}</p>}

                {stats && stats.top.length > 0 ? (
                    <div className="bar-chart">
                        {stats.top.map((item) => (
                            <div className="bar-row" key={item.trigger}>
                                <span
                                    className="bar-trigger"
                                    title={item.trigger}
                                >
                                    {item.trigger}
                                </span>
                                <div className="bar-fill-container">
                                    <div
                                        className="bar-fill"
                                        style={{
                                            width: `${(item.count / maxCount) * 100}%`,
                                        }}
                                    />
                                </div>
                                <span className="bar-count">{item.count}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="empty-state">
                        {stats ? "No statistics recorded" : "Loading..."}
                    </p>
                )}
            </div>

            <div className="card">
                <h3>Manage Data</h3>
                <div className="button-row">
                    <ActionButton
                        label="Clear All Stats"
                        variant="danger"
                        loading={clearLoading}
                        onClick={() => void handleClear()}
                    />
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                        }}
                    >
                        <ActionButton
                            label="Prune"
                            loading={pruneLoading}
                            onClick={() => void handlePrune()}
                        />
                        <input
                            style={{
                                width: 60,
                                padding: "6px 8px",
                                border: "1px solid var(--border)",
                                borderRadius: 6,
                                fontSize: 13,
                            }}
                            value={pruneDays}
                            onChange={(e) => setPruneDays(e.target.value)}
                        />
                        <span className="muted-text">days</span>
                    </div>
                </div>
                {message && (
                    <p className="muted-text" style={{ marginTop: 8 }}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
