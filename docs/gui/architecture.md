# Espanso Studio GUI Architecture

## Overview

The GUI is a Tauri + React application at `apps/espanso-studio-gui`.

- Frontend: React + TypeScript
- Backend: Rust Tauri commands
- Integration: shelling out to `espanso` CLI for service operations

## Command surface

- `get_status` => `running`, `service_registered`, `config_ok`, `details`
- `start_service`
- `stop_service`
- `restart_service`
- `list_matches`
- `create_match`
- `update_match`
- `delete_match`
- `tail_logs`

## Data flow

1. Frontend invokes command using `@tauri-apps/api/core`.
2. Backend reads/writes `match/base.yml` or runs espanso CLI commands.
3. Backend returns structured JSON to frontend.

## Match persistence

- Match file path: `<config root>/match/base.yml`
- Save flow: validate -> backup current file -> write temp file -> atomic rename
- Duplicate trigger checks are enforced before create/update

## Error handling

- Command failures return string errors to frontend.
- UI presents errors inline on each tab.
