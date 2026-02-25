# Espanso Studio GUI Quickstart

## Prerequisites

- macOS with Espanso installed (`brew install espanso` or manual install)
- Node.js 20+
- Rust toolchain

## Development

```bash
cd apps/espanso-studio-gui
npm install
npm run tauri dev
```

## Build macOS App Bundle

```bash
cd apps/espanso-studio-gui
npm run tauri -- build --bundles app
```

The `.app` bundle is output to `target/release/bundle/macos/Espanso Studio.app`.

To install: copy to `/Applications/`.

## Optional Environment Overrides

Use these when testing with non-default paths:

```bash
export ESPANSO_CONFIG_DIR="/custom/espanso/config/root"
export ESPANSO_LOG_FILE="/custom/espanso.log"
```

## Binary Resolution

When running as a `.app` bundle, the app automatically finds the espanso binary at `/opt/homebrew/bin/espanso` (Apple Silicon) or `/usr/local/bin/espanso` (Intel). No PATH configuration needed.

## Features

- **Dashboard**: service status chips, start/stop/restart actions, config paths
- **Matches**: file tree browser, create/edit/delete triggers, multi-file support
- **Packages**: install/uninstall/update espanso packages
- **Statistics**: usage stats with time period filtering and bar charts
- **Logs**: tail daemon logs with level filtering and search
- **Settings**: config file editor, environment PATH management, Secure Input workaround
- **System tray**: hide-to-tray on close, status icon polling, quick-access menu
