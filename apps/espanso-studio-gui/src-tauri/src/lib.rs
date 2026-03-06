mod commands;
#[cfg(not(target_os = "macos"))]
mod tray;
mod util;

use commands::cmd::{cmd_disable, cmd_enable, cmd_search, cmd_toggle};
use commands::config::{
    get_espanso_paths, list_config_files, open_in_finder, read_config_file, write_config_file,
};
use commands::logs::tail_logs;
use commands::matches::{
    create_match, delete_match, exec_match, list_match_files, list_matches, update_match,
};
use commands::packages::{install_package, list_packages, uninstall_package, update_package};
use commands::service::{
    get_status, register_service, restart_service, start_service, stop_service, unregister_service,
};
use commands::settings::{env_path_register, env_path_unregister, workaround_secure_input};
use commands::stats::{clear_stats, get_stats, prune_stats};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            #[cfg(not(target_os = "macos"))]
            if let Err(err) = tray::setup_tray(_app.handle()) {
                eprintln!("tray setup failed: {err}");
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                #[cfg(not(target_os = "macos"))]
                {
                    let _ = window.hide();
                    api.prevent_close();
                }

                #[cfg(target_os = "macos")]
                {
                    let _ = window;
                    let _ = api;
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            // Service
            get_status,
            start_service,
            stop_service,
            restart_service,
            register_service,
            unregister_service,
            // Matches
            list_match_files,
            list_matches,
            create_match,
            update_match,
            delete_match,
            exec_match,
            // Packages
            list_packages,
            install_package,
            uninstall_package,
            update_package,
            // Stats
            get_stats,
            clear_stats,
            prune_stats,
            // Logs
            tail_logs,
            // Config
            get_espanso_paths,
            list_config_files,
            read_config_file,
            write_config_file,
            open_in_finder,
            // Commands
            cmd_enable,
            cmd_disable,
            cmd_toggle,
            cmd_search,
            // Settings
            env_path_register,
            env_path_unregister,
            workaround_secure_input,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
