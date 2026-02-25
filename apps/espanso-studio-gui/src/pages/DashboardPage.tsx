import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import ActionButton from "../components/ActionButton";
import StatusChip from "../components/StatusChip";
import type { ActionResponse, EspansoPaths, StatusResponse } from "../types";

type Props = {
    status: StatusResponse | null;
    onStatusRefresh: () => void;
};

export default function DashboardPage({ status, onStatusRefresh }: Props) {
    const [actionMessage, setActionMessage] = useState("");
    const [actionLoading, setActionLoading] = useState("");
    const [paths, setPaths] = useState<EspansoPaths | null>(null);

    const loadPaths = useCallback(async () => {
        try {
            const result = await invoke<EspansoPaths>("get_espanso_paths");
            setPaths(result);
        } catch {
            // Paths unavailable
        }
    }, []);

    useEffect(() => {
        void loadPaths();
    }, [loadPaths]);

    async function runAction(command: string) {
        setActionLoading(command);
        setActionMessage("");
        try {
            const result = await invoke<ActionResponse>(command);
            setActionMessage(result.message);
            onStatusRefresh();
        } catch (error) {
            setActionMessage(String(error));
        } finally {
            setActionLoading("");
        }
    }

    async function openPath(path: string) {
        try {
            await invoke("open_in_finder", { path });
        } catch {
            // Ignore
        }
    }

    const pathEntries = paths
        ? [
              { label: "Config", value: paths.config },
              { label: "Matches", value: paths.match_dir },
              { label: "Config Dir", value: paths.config_dir },
              { label: "Packages", value: paths.packages },
              { label: "Log File", value: paths.log },
          ]
        : [];

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Service status and quick actions</p>
            </div>

            <div className="card">
                <h3>Service Status</h3>
                {status ? (
                    <div className="status-grid">
                        <StatusChip label="Daemon" ok={status.running} />
                        <StatusChip
                            label="Service Registered"
                            ok={status.service_registered}
                        />
                        <StatusChip
                            label="Config Present"
                            ok={status.config_ok}
                        />
                    </div>
                ) : (
                    <p className="muted-text">Loading status...</p>
                )}

                <div className="button-row">
                    <ActionButton
                        label="Start"
                        onClick={() => void runAction("start_service")}
                        loading={actionLoading === "start_service"}
                    />
                    <ActionButton
                        label="Stop"
                        onClick={() => void runAction("stop_service")}
                        loading={actionLoading === "stop_service"}
                    />
                    <ActionButton
                        label="Restart"
                        onClick={() => void runAction("restart_service")}
                        loading={actionLoading === "restart_service"}
                    />
                    <ActionButton label="Refresh" onClick={onStatusRefresh} />
                </div>

                {actionMessage && (
                    <p className="muted-text" style={{ marginTop: 8 }}>
                        {actionMessage}
                    </p>
                )}
            </div>

            <div className="card">
                <h3>Quick Actions</h3>
                <div className="button-row">
                    <ActionButton
                        label="Enable"
                        variant="primary"
                        onClick={() => void runAction("cmd_enable")}
                        loading={actionLoading === "cmd_enable"}
                    />
                    <ActionButton
                        label="Disable"
                        onClick={() => void runAction("cmd_disable")}
                        loading={actionLoading === "cmd_disable"}
                    />
                    <ActionButton
                        label="Toggle"
                        onClick={() => void runAction("cmd_toggle")}
                        loading={actionLoading === "cmd_toggle"}
                    />
                    <ActionButton
                        label="Search"
                        onClick={() => void runAction("cmd_search")}
                        loading={actionLoading === "cmd_search"}
                    />
                </div>
            </div>

            {pathEntries.length > 0 && (
                <div className="card">
                    <h3>Espanso Paths</h3>
                    {pathEntries.map((entry) => (
                        <div className="path-item" key={entry.label}>
                            <span className="path-label">{entry.label}</span>
                            <span className="path-value">{entry.value}</span>
                            <ActionButton
                                label="Open"
                                size="sm"
                                onClick={() => void openPath(entry.value)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {status?.details && (
                <div className="card">
                    <h3>Details</h3>
                    <p className="muted-text">{status.details}</p>
                </div>
            )}
        </div>
    );
}
