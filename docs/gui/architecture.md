# Espanso Studio GUI Architecture

## Overview

The GUI is a Tauri 2 + React application at `apps/espanso-studio-gui`.

- Frontend: React + TypeScript (Vite bundler)
- Backend: Rust Tauri commands organized in `src-tauri/src/commands/`
- Integration: shelling out to `espanso` CLI for service operations
- System tray: programmatic tray icon with menu and background status polling

## Binary Resolution

macOS `.app` bundles launch with a minimal PATH (`/usr/bin:/bin:/usr/sbin:/sbin`) that excludes Homebrew directories. All espanso CLI calls go through `util::run_espanso()`, which uses `OnceLock`-cached resolution:

1. `/opt/homebrew/bin/espanso` (Apple Silicon Homebrew)
2. `/usr/local/bin/espanso` (Intel Homebrew / manual install)
3. `"espanso"` (PATH fallback for dev/terminal mode)

## Command Surface

### Service (`commands/service.rs`)
- `get_status` => `running`, `service_registered`, `config_ok`, `details`
- `start_service`, `stop_service`, `restart_service`
- `register_service`, `unregister_service`

### Matches (`commands/matches.rs`)
- `list_match_files`, `list_matches`
- `create_match`, `update_match`, `delete_match`
- `exec_match`

### Packages (`commands/packages.rs`)
- `list_packages`, `install_package`, `uninstall_package`, `update_package`

### Stats (`commands/stats.rs`)
- `get_stats`, `clear_stats`, `prune_stats`

### Logs (`commands/logs.rs`)
- `tail_logs`

### Config (`commands/config.rs`)
- `get_espanso_paths`, `list_config_files`, `read_config_file`, `write_config_file`
- `open_in_finder`

### Commands (`commands/cmd.rs`)
- `cmd_enable`, `cmd_disable`, `cmd_toggle`, `cmd_search`

### Settings (`commands/settings.rs`)
- `env_path_register`, `env_path_unregister`, `workaround_secure_input`

## System Tray (`tray.rs`)

Built programmatically with `TrayIconBuilder` (not declarative config). Features:
- Context menu: Open, Enable/Disable, Search, Restart, Quit
- Left-click shows/focuses the main window
- Background thread polls service status every 5s, swaps icon between normal/disabled
- Window close is intercepted to hide-to-tray instead of quitting

## Frontend Structure

```
src/
  components/   Sidebar, StatusChip, ActionButton, Modal, Icons (SVG)
  pages/        DashboardPage, MatchesPage, PackagesPage, StatsPage, LogsPage, SettingsPage
  hooks/        useInvoke (Tauri IPC wrapper)
  styles/       global.css, sidebar.css, components.css, pages.css
  types.ts      Shared TypeScript types
```

## Data Flow

1. Frontend invokes command using `@tauri-apps/api/core`.
2. Backend reads/writes YAML match files or runs espanso CLI commands via `run_espanso()`.
3. Backend returns structured JSON to frontend.

## Match Persistence

- Match files: `<config root>/match/*.yml` (supports multiple files)
- Save flow: validate -> backup current file -> write temp file -> atomic rename
- Duplicate trigger checks are enforced before create/update

## Error Handling

- Command failures return string errors to frontend.
- UI presents errors via toast notifications.
- Tray setup failures are logged but do not crash the app.
