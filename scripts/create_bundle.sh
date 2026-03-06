#!/usr/bin/env bash

# Creates an app bundle for MacOS
#
# Optionally accepts a path to an espanso executable as the first argument: if
# not provided, by default it expects to find release binaries for both
# x86_64-darwin and aarch64-darwin and package these in a universal binary for
# the app bundle

set -Eeuf -o pipefail

readonly TARGET_DIR=target/mac/Espanso.app
readonly DEFAULT_GUI_HELPER=target/release/bundle/macos/Espanso.app
readonly GUI_HELPER_TARGET_NAME=EspansoUI.app

main() {
  # Pass in the binary to bundle as "$1"; default to universal
  local espanso_bin=${1:-universal}
  local gui_helper=${2:-${DEFAULT_GUI_HELPER}}

  rm -rf -- "${TARGET_DIR}"

  local VERSION=$(awk -F '"' '/^version/ { print $2; exit }' espanso/Cargo.toml)

  mkdir -p "${TARGET_DIR}"/Contents
  mkdir -p "${TARGET_DIR}"/Contents/MacOS
  mkdir -p "${TARGET_DIR}"/Contents/Helpers
  mkdir -p "${TARGET_DIR}"/Contents/Resources

  sed -e "s/VERSION/${VERSION}/" espanso/src/res/macos/Info.plist > "${TARGET_DIR}"/Contents/Info.plist

  /bin/echo "APPL????" > "${TARGET_DIR}"/Contents/PkgInfo

  cp -f espanso/src/res/macos/icon.icns "${TARGET_DIR}"/Contents/Resources/icon.icns

  if [[ ! -d "${gui_helper}" ]]; then
    echo "error: missing GUI helper bundle at '${gui_helper}'. Build it first with:"
    echo "  cd apps/espanso-studio-gui && npm run tauri -- build --bundles app"
    exit 1
  fi

  cp -R "${gui_helper}" "${TARGET_DIR}/Contents/Helpers/${GUI_HELPER_TARGET_NAME}"

  if [[ "${espanso_bin}" != universal ]]; then
    cp "${espanso_bin}" "${TARGET_DIR}/Contents/MacOS/espanso"
    return
  fi

  lipo -create \
    -output "${TARGET_DIR}/Contents/MacOS/espanso" \
    target/aarch64-apple-darwin/release/espanso target/x86_64-apple-darwin/release/espanso
}
main "$@"
