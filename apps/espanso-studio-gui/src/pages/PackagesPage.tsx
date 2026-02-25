import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import ActionButton from "../components/ActionButton";
import type { ActionResponse, PackageInfo } from "../types";

export default function PackagesPage() {
    const [packages, setPackages] = useState<PackageInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [installName, setInstallName] = useState("");
    const [installVersion, setInstallVersion] = useState("");
    const [installExternal, setInstallExternal] = useState(false);
    const [installing, setInstalling] = useState(false);

    const [actionLoading, setActionLoading] = useState("");

    const loadPackages = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const result = await invoke<PackageInfo[]>("list_packages");
            setPackages(result);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadPackages();
    }, [loadPackages]);

    async function handleInstall() {
        if (!installName.trim()) return;
        setInstalling(true);
        setMessage("");
        setError("");
        try {
            const result = await invoke<ActionResponse>("install_package", {
                name: installName.trim(),
                version: installVersion.trim() || null,
                external: installExternal || null,
            });
            setMessage(result.message);
            setInstallName("");
            setInstallVersion("");
            setInstallExternal(false);
            await loadPackages();
        } catch (err) {
            setError(String(err));
        } finally {
            setInstalling(false);
        }
    }

    async function handleUninstall(name: string) {
        setActionLoading(`uninstall-${name}`);
        setMessage("");
        try {
            const result = await invoke<ActionResponse>("uninstall_package", {
                name,
            });
            setMessage(result.message);
            await loadPackages();
        } catch (err) {
            setError(String(err));
        } finally {
            setActionLoading("");
        }
    }

    async function handleUpdate(name: string) {
        setActionLoading(`update-${name}`);
        setMessage("");
        try {
            const result = await invoke<ActionResponse>("update_package", {
                name,
            });
            setMessage(result.message);
            await loadPackages();
        } catch (err) {
            setError(String(err));
        } finally {
            setActionLoading("");
        }
    }

    return (
        <div>
            <div className="page-header">
                <h1>Packages</h1>
                <p>Install and manage espanso packages</p>
            </div>

            <div className="card">
                <h3>Install Package</h3>
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-end",
                        flexWrap: "wrap",
                    }}
                >
                    <div
                        className="form-group"
                        style={{ flex: 1, minWidth: 200, marginBottom: 0 }}
                    >
                        <label htmlFor="pkg-name">Package name</label>
                        <input
                            id="pkg-name"
                            value={installName}
                            onChange={(e) => setInstallName(e.target.value)}
                            placeholder="e.g. all-emojis"
                        />
                    </div>
                    <div
                        className="form-group"
                        style={{ width: 120, marginBottom: 0 }}
                    >
                        <label htmlFor="pkg-version">Version</label>
                        <input
                            id="pkg-version"
                            value={installVersion}
                            onChange={(e) => setInstallVersion(e.target.value)}
                            placeholder="latest"
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="checkbox-row">
                            <input
                                type="checkbox"
                                checked={installExternal}
                                onChange={(e) =>
                                    setInstallExternal(e.target.checked)
                                }
                            />
                            External
                        </label>
                    </div>
                    <ActionButton
                        label="Install"
                        variant="primary"
                        loading={installing}
                        disabled={!installName.trim()}
                        onClick={() => void handleInstall()}
                    />
                </div>
            </div>

            {error && (
                <p className="error-text" style={{ margin: "8px 0" }}>
                    {error}
                </p>
            )}
            {message && (
                <p className="muted-text" style={{ margin: "8px 0" }}>
                    {message}
                </p>
            )}

            <div className="card">
                <h3>
                    Installed Packages
                    <ActionButton
                        label="Refresh"
                        size="sm"
                        onClick={() => void loadPackages()}
                        loading={loading}
                    />
                </h3>

                {packages.length > 0 ? (
                    <div className="package-grid">
                        {packages.map((pkg) => (
                            <div className="package-card" key={pkg.name}>
                                <div className="package-name">{pkg.name}</div>
                                {pkg.version && (
                                    <div className="package-version">
                                        v{pkg.version}
                                    </div>
                                )}
                                {pkg.description && (
                                    <div className="package-desc">
                                        {pkg.description}
                                    </div>
                                )}
                                <div className="package-actions">
                                    <ActionButton
                                        label="Update"
                                        size="sm"
                                        loading={
                                            actionLoading ===
                                            `update-${pkg.name}`
                                        }
                                        onClick={() =>
                                            void handleUpdate(pkg.name)
                                        }
                                    />
                                    <ActionButton
                                        label="Uninstall"
                                        size="sm"
                                        variant="danger"
                                        loading={
                                            actionLoading ===
                                            `uninstall-${pkg.name}`
                                        }
                                        onClick={() =>
                                            void handleUninstall(pkg.name)
                                        }
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="empty-state">
                        {loading
                            ? "Loading packages..."
                            : "No packages installed"}
                    </p>
                )}
            </div>
        </div>
    );
}
