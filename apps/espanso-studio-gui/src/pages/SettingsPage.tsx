import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import ActionButton from "../components/ActionButton";
import type { ActionResponse, ConfigFileInfo, EspansoPaths } from "../types";

export default function SettingsPage() {
    const [paths, setPaths] = useState<EspansoPaths | null>(null);
    const [configFiles, setConfigFiles] = useState<ConfigFileInfo[]>([]);
    const [selectedConfig, setSelectedConfig] = useState("");
    const [configContent, setConfigContent] = useState("");
    const [configDirty, setConfigDirty] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [actionLoading, setActionLoading] = useState("");

    const loadPaths = useCallback(async () => {
        try {
            const result = await invoke<EspansoPaths>("get_espanso_paths");
            setPaths(result);
        } catch {
            // Paths unavailable
        }
    }, []);

    const loadConfigFiles = useCallback(async () => {
        try {
            const result = await invoke<ConfigFileInfo[]>("list_config_files");
            setConfigFiles(result);
        } catch (err) {
            setError(String(err));
        }
    }, []);

    useEffect(() => {
        void loadPaths();
        void loadConfigFiles();
    }, [loadPaths, loadConfigFiles]);

    async function loadConfigContent(filePath: string) {
        setSelectedConfig(filePath);
        setConfigDirty(false);
        try {
            const content = await invoke<string>("read_config_file", {
                filePath,
            });
            setConfigContent(content);
        } catch (err) {
            setError(String(err));
        }
    }

    async function saveConfig() {
        if (!selectedConfig || !configDirty) return;
        try {
            setError("");
            const result = await invoke<ActionResponse>("write_config_file", {
                filePath: selectedConfig,
                content: configContent,
            });
            setMessage(result.message);
            setConfigDirty(false);
        } catch (err) {
            setError(String(err));
        }
    }

    async function runAction(command: string) {
        setActionLoading(command);
        setMessage("");
        setError("");
        try {
            const result = await invoke<ActionResponse>(command);
            setMessage(result.message);
        } catch (err) {
            setError(String(err));
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
              { label: "Config Root", value: paths.config },
              { label: "Match Files", value: paths.match_dir },
              { label: "Config Dir", value: paths.config_dir },
              { label: "Packages", value: paths.packages },
              { label: "Log File", value: paths.log },
          ]
        : [];

    return (
        <div>
            <div className="page-header">
                <h1>Settings</h1>
                <p>Service management, configuration, and workarounds</p>
            </div>

            <div className="card">
                <h3>Service Management</h3>
                <div className="button-row">
                    <ActionButton
                        label="Register Service"
                        loading={actionLoading === "register_service"}
                        onClick={() => void runAction("register_service")}
                    />
                    <ActionButton
                        label="Unregister Service"
                        variant="danger"
                        loading={actionLoading === "unregister_service"}
                        onClick={() => void runAction("unregister_service")}
                    />
                </div>
            </div>

            <div className="card">
                <h3>Environment</h3>
                <div className="button-row">
                    <ActionButton
                        label="Register env-path"
                        loading={actionLoading === "env_path_register"}
                        onClick={() => void runAction("env_path_register")}
                    />
                    <ActionButton
                        label="Unregister env-path"
                        loading={actionLoading === "env_path_unregister"}
                        onClick={() => void runAction("env_path_unregister")}
                    />
                </div>
            </div>

            <div className="card">
                <h3>Workarounds</h3>
                <p className="muted-text" style={{ marginBottom: 12 }}>
                    macOS Secure Input can prevent espanso from detecting
                    keystrokes.
                </p>
                <ActionButton
                    label="Fix Secure Input"
                    loading={actionLoading === "workaround_secure_input"}
                    onClick={() => void runAction("workaround_secure_input")}
                />
            </div>

            <div className="card">
                <h3>Config Editor</h3>
                <div className="config-editor-layout">
                    <div className="config-file-list">
                        {configFiles.map((file) => (
                            <button
                                type="button"
                                key={file.path}
                                className={
                                    selectedConfig === file.path ? "active" : ""
                                }
                                onClick={() =>
                                    void loadConfigContent(file.path)
                                }
                            >
                                {file.name}
                            </button>
                        ))}
                        {configFiles.length === 0 && (
                            <p className="muted-text" style={{ fontSize: 12 }}>
                                No config files
                            </p>
                        )}
                    </div>
                    <div>
                        {selectedConfig ? (
                            <>
                                <textarea
                                    className="config-textarea"
                                    value={configContent}
                                    onChange={(e) => {
                                        setConfigContent(e.target.value);
                                        setConfigDirty(true);
                                    }}
                                />
                                <div
                                    className="button-row"
                                    style={{ marginTop: 8 }}
                                >
                                    <ActionButton
                                        label="Save"
                                        variant="primary"
                                        disabled={!configDirty}
                                        onClick={() => void saveConfig()}
                                    />
                                    {configDirty && (
                                        <span className="muted-text">
                                            Unsaved changes
                                        </span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="empty-state">
                                Select a config file to edit
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {pathEntries.length > 0 && (
                <div className="card">
                    <h3>Paths</h3>
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

            {error && (
                <p className="error-text" style={{ marginTop: 8 }}>
                    {error}
                </p>
            )}
            {message && (
                <p className="muted-text" style={{ marginTop: 8 }}>
                    {message}
                </p>
            )}
        </div>
    );
}
