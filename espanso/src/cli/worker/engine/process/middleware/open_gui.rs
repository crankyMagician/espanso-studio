use std::path::PathBuf;

use espanso_engine::process::GuiAppPathProvider;

const GUI_HELPER_ENV_VAR: &str = "ESPANSO_GUI_APP";
const GUI_HELPER_BUNDLE_NAME: &str = "EspansoUI.app";

pub struct GuiAppPathProviderAdapter;

impl GuiAppPathProviderAdapter {
    pub fn new() -> Self {
        Self
    }
}

impl GuiAppPathProvider for GuiAppPathProviderAdapter {
    fn get_gui_app_path(&self) -> Option<PathBuf> {
        if let Some(app_path) = env_override_path(std::env::var_os(GUI_HELPER_ENV_VAR)) {
            return Some(app_path);
        }

        #[cfg(target_os = "macos")]
        {
            let exe_path = std::env::current_exe().ok()?;
            return helper_bundle_path_from_exe(&exe_path);
        }

        #[cfg(not(target_os = "macos"))]
        {
            None
        }
    }
}

fn env_override_path(value: Option<std::ffi::OsString>) -> Option<PathBuf> {
    let value = value?;
    let value = value.to_string_lossy();
    let value = value.trim();
    if value.is_empty() {
        None
    } else {
        Some(PathBuf::from(value))
    }
}

#[cfg(target_os = "macos")]
fn helper_bundle_path_from_exe(exe_path: &std::path::Path) -> Option<PathBuf> {
    let macos_dir = exe_path.parent()?;
    if macos_dir.file_name()? != std::ffi::OsStr::new("MacOS") {
        return None;
    }

    let contents_dir = macos_dir.parent()?;
    if contents_dir.file_name()? != std::ffi::OsStr::new("Contents") {
        return None;
    }

    Some(contents_dir.join("Helpers").join(GUI_HELPER_BUNDLE_NAME))
}

#[cfg(all(test, target_os = "macos"))]
mod tests {
    use super::{env_override_path, helper_bundle_path_from_exe};
    use std::path::Path;

    #[test]
    fn resolves_helper_bundle_from_app_executable() {
        let exe_path = Path::new("/Applications/Espanso.app/Contents/MacOS/espanso");
        let helper_path = helper_bundle_path_from_exe(exe_path).expect("missing helper path");

        assert_eq!(
            helper_path,
            Path::new("/Applications/Espanso.app/Contents/Helpers/EspansoUI.app")
        );
    }

    #[test]
    fn ignores_non_bundle_executable_paths() {
        let exe_path = Path::new("/usr/local/bin/espanso");

        assert!(helper_bundle_path_from_exe(exe_path).is_none());
    }

    #[test]
    fn uses_non_empty_env_override_path() {
        let env_path = env_override_path(Some("/tmp/Espanso.app".into()));

        assert_eq!(env_path, Some(Path::new("/tmp/Espanso.app").to_path_buf()));
    }
}
