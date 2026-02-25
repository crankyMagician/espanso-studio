import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import { useTheme } from "./hooks/useTheme";
import DashboardPage from "./pages/DashboardPage";
import LogsPage from "./pages/LogsPage";
import MatchesPage from "./pages/MatchesPage";
import PackagesPage from "./pages/PackagesPage";
import SettingsPage from "./pages/SettingsPage";
import StatsPage from "./pages/StatsPage";
import type { Page, StatusResponse } from "./types";

function App() {
    const [page, setPage] = useState<Page>("dashboard");
    const [status, setStatus] = useState<StatusResponse | null>(null);
    const { theme, setTheme } = useTheme();

    const loadStatus = useCallback(async () => {
        try {
            const result = await invoke<StatusResponse>("get_status");
            setStatus(result);
        } catch {
            // Status unavailable
        }
    }, []);

    useEffect(() => {
        void loadStatus();
        const timer = window.setInterval(() => {
            void loadStatus();
        }, 5000);
        return () => window.clearInterval(timer);
    }, [loadStatus]);

    return (
        <>
            <Sidebar
                activePage={page}
                onNavigate={setPage}
                status={status}
                theme={theme}
                onThemeChange={setTheme}
            />
            <main className="page-content">
                {page === "dashboard" && (
                    <DashboardPage
                        status={status}
                        onStatusRefresh={() => void loadStatus()}
                    />
                )}
                {page === "matches" && <MatchesPage />}
                {page === "packages" && <PackagesPage />}
                {page === "stats" && <StatsPage />}
                {page === "logs" && <LogsPage />}
                {page === "settings" && <SettingsPage />}
            </main>
        </>
    );
}

export default App;
