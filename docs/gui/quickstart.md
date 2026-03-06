# Espanso GUI Quickstart

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

The GUI helper `.app` bundle is output to `target/release/bundle/macos/Espanso.app`.

To embed the GUI helper inside the main macOS app bundle:

```bash
scripts/create_bundle.sh
```

This produces the integrated `target/mac/Espanso.app` bundle. To install: copy that app to `/Applications/`.

## macOS Local Testing Notes

- `scripts/create_bundle.sh` assembles a local test bundle from the compiled binaries on disk. It does not preserve the upstream Developer ID signature.
- After replacing `/Applications/Espanso.app` with a locally assembled bundle, re-check `System Settings > Privacy & Security > Accessibility` and re-enable `Espanso` if shortcuts stop firing.
- If the Accessibility/setup flow behaves unexpectedly, verify the installed app identity with:

```bash
codesign -dv --verbose=4 /Applications/Espanso.app
```

The installed app should report `Identifier=com.federicoterzi.espanso`. If it reports a generated linker-signed identifier instead, macOS can treat it as a different app and deny the previously granted Accessibility permission.

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
- **macOS integration**: bundled helper app launched from the Espanso menu bar app
- **System tray**: non-macOS quick-access menu and status icon polling
