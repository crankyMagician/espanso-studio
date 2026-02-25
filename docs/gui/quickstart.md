# Espanso Studio GUI Quickstart

## Prerequisites

- macOS with Espanso installed and available on `PATH`
- Node.js 20+
- Rust toolchain

## Start the app

```bash
cd apps/espanso-studio-gui
npm install
npm run tauri dev
```

## Optional environment overrides

Use these when testing with non-default paths:

```bash
export ESPANSO_CONFIG_DIR="/custom/espanso/config/root"
export ESPANSO_LOG_FILE="/custom/espanso.log"
```

## Milestone 1 features

- Dashboard: service status + start/stop/restart actions
- Matches: create/edit/delete trigger replacements
- Logs: tail recent daemon logs with auto-refresh
