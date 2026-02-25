import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import ActionButton from "../components/ActionButton";
import Modal from "../components/Modal";
import type {
    ActionResponse,
    MatchFileInfo,
    MatchInput,
    MatchItem,
} from "../types";

export default function MatchesPage() {
    const [files, setFiles] = useState<MatchFileInfo[]>([]);
    const [selectedFile, setSelectedFile] = useState<string>("");
    const [matches, setMatches] = useState<MatchItem[]>([]);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState("");
    const [showEditor, setShowEditor] = useState(false);
    const [form, setForm] = useState<MatchInput>({
        trigger: "",
        replace: "",
        disabled: false,
    });

    const canSave = useMemo(
        () => form.trigger.trim().length > 0 && form.replace.trim().length > 0,
        [form.trigger, form.replace],
    );

    const filteredMatches = useMemo(() => {
        if (!search) return matches;
        const lower = search.toLowerCase();
        return matches.filter(
            (m) =>
                m.trigger.toLowerCase().includes(lower) ||
                m.replace.toLowerCase().includes(lower),
        );
    }, [matches, search]);

    const loadFiles = useCallback(async () => {
        try {
            const result = await invoke<MatchFileInfo[]>("list_match_files");
            setFiles(result);
            if (result.length > 0 && !selectedFile) {
                setSelectedFile(result[0].path);
            }
        } catch (err) {
            setError(String(err));
        }
    }, [selectedFile]);

    const loadMatches = useCallback(async () => {
        if (!selectedFile) return;
        try {
            setError("");
            const result = await invoke<MatchItem[]>("list_matches", {
                filePath: selectedFile,
            });
            setMatches(result);
        } catch (err) {
            setError(String(err));
        }
    }, [selectedFile]);

    useEffect(() => {
        void loadFiles();
    }, [loadFiles]);

    useEffect(() => {
        void loadMatches();
    }, [loadMatches]);

    function openCreate() {
        setEditingId("");
        setForm({ trigger: "", replace: "", disabled: false });
        setShowEditor(true);
    }

    function openEdit(item: MatchItem) {
        setEditingId(item.id);
        setForm({
            trigger: item.trigger,
            replace: item.replace,
            disabled: item.disabled,
        });
        setShowEditor(true);
    }

    async function saveMatch() {
        if (!canSave) return;
        try {
            setError("");
            if (editingId) {
                await invoke<ActionResponse>("update_match", {
                    id: editingId,
                    input: form,
                    filePath: selectedFile || null,
                });
            } else {
                await invoke<ActionResponse>("create_match", {
                    input: form,
                    filePath: selectedFile || null,
                });
            }
            setShowEditor(false);
            setForm({ trigger: "", replace: "", disabled: false });
            setEditingId("");
            await loadMatches();
            await loadFiles();
        } catch (err) {
            setError(String(err));
        }
    }

    async function removeMatch(id: string) {
        try {
            setError("");
            await invoke<ActionResponse>("delete_match", {
                id,
                filePath: selectedFile || null,
            });
            await loadMatches();
            await loadFiles();
        } catch (err) {
            setError(String(err));
        }
    }

    async function testMatch(trigger: string) {
        try {
            await invoke<ActionResponse>("exec_match", { trigger });
        } catch {
            // Ignore exec errors
        }
    }

    return (
        <div>
            <div className="page-header">
                <h1>Matches</h1>
                <p>Manage text expansion triggers across match files</p>
            </div>

            <div className="matches-layout">
                <div className="file-tree">
                    <div className="file-tree-header">
                        <h3>Files</h3>
                        <ActionButton
                            label="+"
                            size="sm"
                            onClick={() => void loadFiles()}
                        />
                    </div>
                    {files.map((file) => (
                        <button
                            type="button"
                            key={file.path}
                            className={`file-item ${selectedFile === file.path ? "active" : ""} ${file.is_package ? "package" : ""}`}
                            onClick={() => setSelectedFile(file.path)}
                        >
                            <span>{file.name}</span>
                            <span className="file-count">
                                {file.match_count}
                            </span>
                        </button>
                    ))}
                    {files.length === 0 && (
                        <p
                            className="muted-text"
                            style={{ padding: 8, fontSize: 12 }}
                        >
                            No match files found
                        </p>
                    )}
                </div>

                <div className="match-panel">
                    <div className="match-search">
                        <input
                            placeholder="Search matches..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <ActionButton
                            label="New Match"
                            variant="primary"
                            onClick={openCreate}
                        />
                        <ActionButton
                            label="Refresh"
                            onClick={() => void loadMatches()}
                        />
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <div className="card" style={{ padding: 0 }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Trigger</th>
                                    <th>Replace</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMatches.map((item) => (
                                    <tr key={item.id}>
                                        <td className="mono">{item.trigger}</td>
                                        <td
                                            style={{
                                                maxWidth: 300,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {item.replace}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${item.disabled ? "gray" : "green"}`}
                                            >
                                                {item.disabled
                                                    ? "Disabled"
                                                    : "Active"}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <ActionButton
                                                label="Edit"
                                                size="sm"
                                                onClick={() => openEdit(item)}
                                            />
                                            <ActionButton
                                                label="Test"
                                                size="sm"
                                                onClick={() =>
                                                    void testMatch(item.trigger)
                                                }
                                            />
                                            <ActionButton
                                                label="Del"
                                                size="sm"
                                                variant="danger"
                                                onClick={() =>
                                                    void removeMatch(item.id)
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                                {filteredMatches.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="empty-state">
                                            {search
                                                ? "No matches found"
                                                : "No matches in this file"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showEditor && (
                <Modal
                    title={editingId ? "Edit Match" : "New Match"}
                    onClose={() => setShowEditor(false)}
                >
                    <div className="form-group">
                        <label htmlFor="match-trigger">Trigger</label>
                        <input
                            id="match-trigger"
                            value={form.trigger}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    trigger: e.target.value,
                                }))
                            }
                            placeholder=":br"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="match-replace">Replace</label>
                        <textarea
                            id="match-replace"
                            value={form.replace}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    replace: e.target.value,
                                }))
                            }
                            placeholder="best regards"
                        />
                    </div>
                    <div className="form-group">
                        <label className="checkbox-row">
                            <input
                                type="checkbox"
                                checked={form.disabled}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        disabled: e.target.checked,
                                    }))
                                }
                            />
                            Disabled
                        </label>
                    </div>
                    {selectedFile && (
                        <p className="muted-text" style={{ fontSize: 12 }}>
                            File: {selectedFile.split("/").pop()}
                        </p>
                    )}
                    {error && <p className="error-text">{error}</p>}
                    <div className="modal-actions">
                        <ActionButton
                            label="Cancel"
                            onClick={() => setShowEditor(false)}
                        />
                        <ActionButton
                            label={editingId ? "Update" : "Create"}
                            variant="primary"
                            disabled={!canSave}
                            onClick={() => void saveMatch()}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
}
