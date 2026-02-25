import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type Tab = "dashboard" | "matches" | "logs";

type StatusResponse = {
  running: boolean;
  service_registered: boolean;
  config_ok: boolean;
  details: string;
};

type MatchItem = {
  id: string;
  trigger: string;
  replace: string;
  disabled: boolean;
  source_file: string;
};

type MatchInput = {
  trigger: string;
  replace: string;
  disabled: boolean;
};

type ActionResponse = {
  ok: boolean;
  message: string;
};

type LogEntry = {
  ts: string;
  level: string;
  process: string;
  message: string;
  raw: string;
};

function App() {
  const [tab, setTab] = useState<Tab>("dashboard");

  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusError, setStatusError] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string>("");

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [matchError, setMatchError] = useState<string>("");
  const [editingId, setEditingId] = useState<string>("");
  const [form, setForm] = useState<MatchInput>({
    trigger: "",
    replace: "",
    disabled: false,
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsError, setLogsError] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const canSave = useMemo(() => {
    return form.trigger.trim().length > 0 && form.replace.trim().length > 0;
  }, [form.trigger, form.replace]);

  async function loadStatus() {
    try {
      setStatusError("");
      const next = await invoke<StatusResponse>("get_status");
      setStatus(next);
    } catch (error) {
      setStatusError(String(error));
    }
  }

  async function runServiceAction(command: "start_service" | "stop_service" | "restart_service") {
    try {
      const result = await invoke<ActionResponse>(command);
      setActionMessage(result.message);
      await loadStatus();
    } catch (error) {
      setActionMessage(String(error));
    }
  }

  async function loadMatches() {
    try {
      setMatchError("");
      const next = await invoke<MatchItem[]>("list_matches");
      setMatches(next);
    } catch (error) {
      setMatchError(String(error));
    }
  }

  async function saveMatch() {
    if (!canSave) {
      return;
    }

    try {
      setMatchError("");
      if (editingId) {
        await invoke<ActionResponse>("update_match", {
          id: editingId,
          input: form,
        });
      } else {
        await invoke<ActionResponse>("create_match", { input: form });
      }
      setForm({ trigger: "", replace: "", disabled: false });
      setEditingId("");
      await loadMatches();
    } catch (error) {
      setMatchError(String(error));
    }
  }

  async function removeMatch(id: string) {
    try {
      setMatchError("");
      await invoke<ActionResponse>("delete_match", { id });
      if (editingId === id) {
        setEditingId("");
        setForm({ trigger: "", replace: "", disabled: false });
      }
      await loadMatches();
    } catch (error) {
      setMatchError(String(error));
    }
  }

  function beginEdit(item: MatchItem) {
    setEditingId(item.id);
    setForm({
      trigger: item.trigger,
      replace: item.replace,
      disabled: item.disabled,
    });
  }

  async function loadLogs() {
    try {
      setLogsError("");
      const next = await invoke<LogEntry[]>("tail_logs", { limit: 200 });
      setLogs(next);
    } catch (error) {
      setLogsError(String(error));
    }
  }

  useEffect(() => {
    void loadStatus();
    void loadMatches();
    void loadLogs();
  }, []);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadLogs();
      void loadStatus();
    }, 3000);

    return () => {
      window.clearInterval(timer);
    };
  }, [autoRefresh]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <h1>Espanso Studio</h1>
        <p>GUI manager for Espanso matches, service state, and logs</p>
      </header>

      <nav className="tabs">
        <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>
          Dashboard
        </button>
        <button className={tab === "matches" ? "active" : ""} onClick={() => setTab("matches")}>
          Matches
        </button>
        <button className={tab === "logs" ? "active" : ""} onClick={() => setTab("logs")}>
          Logs
        </button>
      </nav>

      {tab === "dashboard" && (
        <section className="panel">
          <h2>Service Status</h2>
          {status ? (
            <div className="status-grid">
              <StatusChip label="Daemon" ok={status.running} />
              <StatusChip label="Service Registered" ok={status.service_registered} />
              <StatusChip label="Config Present" ok={status.config_ok} />
            </div>
          ) : (
            <p>Loading status...</p>
          )}

          <div className="button-row">
            <button onClick={() => runServiceAction("start_service")}>Start</button>
            <button onClick={() => runServiceAction("stop_service")}>Stop</button>
            <button onClick={() => runServiceAction("restart_service")}>Restart</button>
            <button onClick={() => void loadStatus()}>Refresh</button>
          </div>

          {statusError && <p className="error">{statusError}</p>}
          {actionMessage && <p className="message">{actionMessage}</p>}
          {status?.details && <p className="hint">{status.details}</p>}
        </section>
      )}

      {tab === "matches" && (
        <section className="panel two-col">
          <div>
            <h2>{editingId ? "Edit Match" : "Add Match"}</h2>
            <label>
              Trigger
              <input
                value={form.trigger}
                onChange={(event) => setForm((previous) => ({ ...previous, trigger: event.target.value }))}
                placeholder=":br"
              />
            </label>
            <label>
              Replace
              <textarea
                value={form.replace}
                onChange={(event) => setForm((previous) => ({ ...previous, replace: event.target.value }))}
                placeholder="best regards"
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.disabled}
                onChange={(event) => setForm((previous) => ({ ...previous, disabled: event.target.checked }))}
              />
              Disabled
            </label>
            <div className="button-row">
              <button disabled={!canSave} onClick={() => void saveMatch()}>
                {editingId ? "Update" : "Create"}
              </button>
              <button
                onClick={() => {
                  setEditingId("");
                  setForm({ trigger: "", replace: "", disabled: false });
                }}
              >
                Reset
              </button>
            </div>
            {matchError && <p className="error">{matchError}</p>}
          </div>

          <div>
            <h2>Current Matches</h2>
            <button onClick={() => void loadMatches()}>Refresh</button>
            <table>
              <thead>
                <tr>
                  <th>Trigger</th>
                  <th>Replace</th>
                  <th>Disabled</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((item) => (
                  <tr key={item.id}>
                    <td>{item.trigger}</td>
                    <td>{item.replace}</td>
                    <td>{item.disabled ? "yes" : "no"}</td>
                    <td className="button-row">
                      <button onClick={() => beginEdit(item)}>Edit</button>
                      <button onClick={() => void removeMatch(item.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "logs" && (
        <section className="panel">
          <div className="button-row">
            <button onClick={() => void loadLogs()}>Refresh Logs</button>
            <label className="checkbox-row">
              <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />
              Auto-refresh
            </label>
          </div>

          {logsError && <p className="error">{logsError}</p>}

          <div className="log-box">
            {logs.map((entry, index) => (
              <div key={`${entry.ts}-${index}`} className="log-line">
                <span className={`level level-${entry.level.toLowerCase()}`}>{entry.level}</span>
                <span>{entry.ts}</span>
                <span>{entry.process}</span>
                <span>{entry.message || entry.raw}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function StatusChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`status-chip ${ok ? "ok" : "bad"}`}>
      <span>{label}</span>
      <strong>{ok ? "OK" : "Issue"}</strong>
    </div>
  );
}

export default App;
