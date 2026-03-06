# AGENTS.md

Instructions for coding agents working in this repository.

## Repository Scope

- This repo is a fork of `espanso/espanso`.
- It includes a new GUI product at `apps/espanso-studio-gui`.
- User-facing GUI branding should be `Espanso`, not `Espanso Studio`.
- Primary goal for fork work: evolve GUI functionality without breaking upstream espanso core behavior.

## Working Directory

- Main repo path: `/Users/sam/espanso-studio`
- Do not modify unrelated repos (for example `/Users/sam/linux_boot`) unless explicitly requested.

## Key Project Areas

- Upstream Rust workspace crates: root-level `espanso-*` directories.
- GUI frontend (React/Vite): `apps/espanso-studio-gui/src`
- GUI backend (Tauri/Rust): `apps/espanso-studio-gui/src-tauri/src`
- GUI docs: `docs/gui`

## Build and Validation Commands

Run from repo root unless noted.

- Rust setup:
  - `source "$HOME/.cargo/env"`
- Validate GUI Rust backend:
  - `cargo check -p espanso-studio-gui`
  - `cargo check --manifest-path apps/espanso-studio-gui/src-tauri/Cargo.toml`
- Validate GUI frontend:
  - `cd apps/espanso-studio-gui`
  - `npm install`
  - `npm run build`
- Validate Tauri environment:
  - `npm run tauri -- info`

## Run and Build App

From `apps/espanso-studio-gui`:

- Dev mode:
  - `npm run tauri -- dev`
- Production binary:
  - `npm run tauri -- build`
- macOS app bundle:
  - `npm run tauri -- build --bundles app`

Artifacts:

- Binary: `target/release/espanso-studio-gui`
- macOS helper app bundle: `target/release/bundle/macos/Espanso.app`
- Integrated macOS app bundle: `target/mac/Espanso.app`

## Tauri/GUI Guardrails

- The Tauri crate is part of the root Cargo workspace (`Cargo.toml` workspace members).
- Keep `apps/espanso-studio-gui/src-tauri/icons/icon.png` present; build can fail without it.
- On macOS, the Tauri GUI is bundled as a helper app under `Espanso.app/Contents/Helpers/EspansoUI.app`.
- The GUI tray is non-macOS only; do not reintroduce a second macOS tray icon.
- Tauri may generate schema files under:
  - `apps/espanso-studio-gui/src-tauri/gen/schemas`
- If generated schema or manifest metadata changes during build, include those changes intentionally and document why.

## Configuration Behavior (Current)

Backend command logic currently targets espanso config/log paths:

- macOS default config: `~/Library/Application Support/espanso`
- macOS default log: `~/Library/Caches/espanso/espanso.log`

Optional overrides:

- `ESPANSO_CONFIG_DIR`
- `ESPANSO_LOG_FILE`

## Change Policy

- Prefer small, focused commits.
- Preserve upstream behavior unless the change is explicitly GUI/fork related.
- Do not introduce unrelated refactors while implementing feature/fix work.
- Always re-run relevant checks before committing.

## Commit and Push

- Use descriptive commit messages (subject + body).
- Branch currently used for GUI milestone work: `feature/gui-m1`.
- Push to `origin` and report:
  - branch name
  - commit hash
  - exact validations executed
