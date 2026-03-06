# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository is a fork of [espanso/espanso](https://github.com/espanso/espanso) (a cross-platform text expander in Rust) that adds a desktop GUI manager built with Tauri + React. The fork goal: evolve GUI functionality without breaking upstream espanso core behavior.

User-facing GUI branding should be `Espanso`. The repository and package names still use `espanso-studio` internally.

## Repository Layout

- **`espanso-*` directories** — Upstream Rust workspace crates (config, match, engine, detect, inject, clipboard, render, etc.)
- **`apps/espanso-studio-gui/`** — New GUI application
  - `src/` — React frontend (TypeScript, Vite)
    - `components/` — Sidebar, StatusChip, ActionButton, Modal, SVG Icons
    - `pages/` — Dashboard, Matches, Packages, Stats, Logs, Settings
    - `hooks/` — `useInvoke` for Tauri IPC
    - `styles/` — global.css, sidebar.css, components.css, pages.css
  - `src-tauri/src/` — Tauri backend (Rust)
    - `commands/` — IPC command modules (service, matches, packages, stats, logs, config, cmd, settings)
    - `tray.rs` — Programmatic system tray with menu and status polling on non-macOS platforms
    - `util.rs` — Binary resolution, match file I/O, atomic writes
- **`docs/gui/`** — GUI documentation (quickstart, architecture)
- **`scripts/`** — Build and release scripts

## Build Commands

### Espanso Core (Rust)

```bash
cargo check                          # Quick validation
cargo build --release                # Full release build
cargo fmt --all                      # Format
cargo clippy --all-targets --features=modulo,vendored-tls -- --deny warnings  # Lint
```

### GUI (from `apps/espanso-studio-gui/`)

```bash
npm install                          # Install JS deps
npm run build                        # TypeScript check + Vite build (frontend only)
npm run tauri -- dev                 # Dev mode with hot reload
npm run tauri -- build               # Production binary
npm run tauri -- build --bundles app # macOS app bundle
```

### Validate GUI Rust backend (from repo root)

```bash
cargo check -p espanso-studio-gui
```

## Testing

```bash
# Run workspace tests (espanso-modulo and espanso-ipc are excluded — platform issues)
cargo test --workspace --exclude espanso-modulo --exclude espanso-ipc --no-default-features --features vendored-tls

# Single crate
cargo test -p espanso-match
cargo test -p espanso-config
```

## Pre-commit Hooks

Configured in `.pre-commit-config.yaml` — runs `biome-check` (JS/TS), `cargo fmt`, YAML/TOML/JSON validation, blocks commits to `master`/`dev`, and **fails on any TODO comments** in the codebase.

```bash
pre-commit run --all-files           # Run all hooks
npx biome check --write .            # JS/TS lint+format (also fixes)
```

## Architecture

### Match Processing Pipeline

Keyboard event → `espanso-detect` → `espanso-match` (rolling hash for static triggers, regex for patterns) → `espanso-render` (variable substitution) → `espanso-inject` (text injection into focused app)

### GUI Backend (Tauri Commands)

Commands are organized in `src-tauri/src/commands/` modules, registered in `lib.rs`:

- **Service** (`service.rs`): `get_status`, `start_service`, `stop_service`, `restart_service`, `register_service`, `unregister_service`
- **Matches** (`matches.rs`): `list_match_files`, `list_matches`, `create_match`, `update_match`, `delete_match`, `exec_match` — reads/writes YAML match files with atomic writes and timestamped backups
- **Packages** (`packages.rs`): `list_packages`, `install_package`, `uninstall_package`, `update_package`
- **Stats** (`stats.rs`): `get_stats`, `clear_stats`, `prune_stats`
- **Logs** (`logs.rs`): `tail_logs` — parses espanso.log with regex
- **Config** (`config.rs`): `get_espanso_paths`, `list_config_files`, `read_config_file`, `write_config_file`, `open_in_finder`
- **Commands** (`cmd.rs`): `cmd_enable`, `cmd_disable`, `cmd_toggle`, `cmd_search`
- **Settings** (`settings.rs`): `env_path_register`, `env_path_unregister`, `workaround_secure_input`

All espanso CLI calls go through `util::run_espanso()`, which uses `OnceLock`-cached binary resolution to find the espanso binary at `/opt/homebrew/bin/espanso` (Apple Silicon) or `/usr/local/bin/espanso` (Intel) before falling back to PATH. This is required because macOS `.app` bundles launch with a minimal PATH.

### GUI Tray (`tray.rs`)

Programmatic tray icon built with `TrayIconBuilder` (not the declarative `tauri.conf.json` trayIcon). This is non-macOS only. Features:
- Menu: Open, Enable/Disable, Search, Restart, Quit
- Click-to-show: clicking the tray icon shows/focuses the main window
- Status polling: background thread polls espanso service status every 5s, swaps between normal/disabled icon

### macOS GUI Integration

- The menu bar `espanso` app exposes `Open Espanso` and launches the bundled Tauri helper.
- The Tauri helper bundle is produced at `target/release/bundle/macos/Espanso.app`.
- The integrated top-level macOS app is assembled by `scripts/create_bundle.sh` and embeds the helper at `Espanso.app/Contents/Helpers/EspansoUI.app`.
- On macOS, the GUI closes normally instead of hiding to a tray icon.

### GUI Frontend (React)

Six pages: Dashboard, Matches, Packages, Statistics, Logs, Settings. Sidebar navigation with SVG icons. Communicates with backend via `@tauri-apps/api/core`.

### Config Paths

- macOS: config `~/Library/Application Support/espanso`, logs `~/Library/Caches/espanso/espanso.log`
- Linux: config `~/.config/espanso`, logs `~/.cache/espanso/espanso.log`
- Override with `ESPANSO_CONFIG_DIR` and `ESPANSO_LOG_FILE`

## Workspace Features (Cargo)

- `modulo` (default) — GUI components (wxWidgets)
- `native-tls` (default) — native TLS
- `vendored-tls` — Rustls (use on Linux CI)
- `wayland` — Wayland support (replaces X11)

## Key Conventions

- Clippy denies: `enum_glob_use`, `semicolon_if_nothing_returned`, `wildcard_imports`
- No commits directly to `master` or `dev` branches
- GUI work happens on `feature/gui-m1`, PRs target `dev`
- Keep `apps/espanso-studio-gui/src-tauri/icons/icon.png` and `icon.icns` present (build fails without them)
- `icon.icns` is required for macOS app bundle icon — regenerate with `iconutil` if icon.png changes
- Tauri bundle config (`bundle.active`) must be `true` for proper `.app` packaging (icon, Resources, frontend assets)
- Do NOT add a declarative `trayIcon` block to `tauri.conf.json` — the programmatic tray in `tray.rs` handles non-macOS behavior
- Do not reintroduce a second macOS tray icon for the GUI helper
- Tauri schema artifacts in `src-tauri/gen/schemas/` — commit if changed intentionally
- Preserve upstream behavior unless the change is explicitly GUI/fork related
