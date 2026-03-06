# Espanso GUI

This app is a desktop GUI manager for Espanso. Milestone 1 includes:

- Match CRUD for `match/base.yml`
- Service controls (`start`, `stop`, `restart`, `status`)
- Log tailing for `espanso.log`

## Run

```bash
cd apps/espanso-studio-gui
npm install
npm run tauri -- dev
```

## macOS Bundles

- Helper GUI bundle: `target/release/bundle/macos/Espanso.app`
- Integrated top-level app bundle: `target/mac/Espanso.app`
- Assemble the integrated bundle from the repo root with `./scripts/create_bundle.sh`

## Backend behavior

- Uses the `espanso` command from your `PATH`.
- Reads config from `ESPANSO_CONFIG_DIR` if set.
- macOS default config path: `~/Library/Application Support/espanso`
- macOS default log path: `~/Library/Caches/espanso/espanso.log`
