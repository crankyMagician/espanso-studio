import type { ReactNode } from "react";
import logo from "../assets/logo.png";
import type { Page, StatusResponse } from "../types";
import {
    DashboardIcon,
    LogsIcon,
    MatchesIcon,
    PackagesIcon,
    SettingsIcon,
    StatsIcon,
} from "./Icons";

const NAV_ITEMS: { page: Page; icon: ReactNode; label: string }[] = [
    { page: "dashboard", icon: <DashboardIcon />, label: "Dashboard" },
    { page: "matches", icon: <MatchesIcon />, label: "Matches" },
    { page: "packages", icon: <PackagesIcon />, label: "Packages" },
    { page: "stats", icon: <StatsIcon />, label: "Statistics" },
    { page: "logs", icon: <LogsIcon />, label: "Logs" },
    { page: "settings", icon: <SettingsIcon />, label: "Settings" },
];

type Props = {
    activePage: Page;
    onNavigate: (page: Page) => void;
    status: StatusResponse | null;
};

export default function Sidebar({ activePage, onNavigate, status }: Props) {
    const statusClass = status
        ? status.running
            ? "running"
            : "stopped"
        : "stopped";
    const statusText = status
        ? status.running
            ? "Running"
            : "Stopped"
        : "Unknown";

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <img src={logo} alt="Espanso" />
                <span>Espanso Studio</span>
            </div>
            <nav className="sidebar-nav">
                {NAV_ITEMS.map((item) => (
                    <button
                        type="button"
                        key={item.page}
                        className={activePage === item.page ? "active" : ""}
                        onClick={() => onNavigate(item.page)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="sidebar-status">
                <span className={`status-dot ${statusClass}`} />
                <span className="status-label">{statusText}</span>
            </div>
        </aside>
    );
}
