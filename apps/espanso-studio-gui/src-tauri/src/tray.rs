use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

use tauri::image::Image;
use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager};

use crate::util::run_espanso;

static ICON_NORMAL: &[u8] = include_bytes!("../icons/icon.png");
static ICON_DISABLED: &[u8] = include_bytes!("../icons/icondisabled.png");

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let open_item = MenuItemBuilder::with_id("open", "Open Espanso Studio").build(app)?;
    let separator1 = PredefinedMenuItem::separator(app)?;
    let enable_item = MenuItemBuilder::with_id("enable", "Enable").build(app)?;
    let disable_item = MenuItemBuilder::with_id("disable", "Disable").build(app)?;
    let search_item = MenuItemBuilder::with_id("search", "Search").build(app)?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let restart_item = MenuItemBuilder::with_id("restart", "Restart").build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&open_item)
        .item(&separator1)
        .item(&enable_item)
        .item(&disable_item)
        .item(&search_item)
        .item(&separator2)
        .item(&restart_item)
        .item(&quit_item)
        .build()?;

    let icon = Image::from_bytes(ICON_NORMAL)?;

    let tray = TrayIconBuilder::with_id("main-tray")
        .icon(icon)
        .icon_as_template(true)
        .menu(&menu)
        .tooltip("Espanso Studio")
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            match id {
                "open" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "enable" => {
                    let _ = run_espanso(&["cmd", "enable"]);
                }
                "disable" => {
                    let _ = run_espanso(&["cmd", "disable"]);
                }
                "search" => {
                    let _ = run_espanso(&["cmd", "search"]);
                }
                "restart" => {
                    let _ = run_espanso(&["service", "restart"]);
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray_icon, event| {
            if let tauri::tray::TrayIconEvent::Click { .. } = event {
                if let Some(window) = tray_icon.app_handle().get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    // Background status polling to update tray icon
    let app_handle = app.clone();
    let running = Arc::new(AtomicBool::new(true));
    let running_clone = running.clone();

    thread::Builder::new()
        .name("tray-status-poll".to_string())
        .spawn(move || {
            let mut was_running = true;

            while running_clone.load(Ordering::Relaxed) {
                let is_running = run_espanso(&["service", "status"])
                    .map(|output| {
                        output.success && output.stdout.to_lowercase().contains("running")
                    })
                    .unwrap_or(false);

                if is_running != was_running {
                    let icon_bytes = if is_running {
                        ICON_NORMAL
                    } else {
                        ICON_DISABLED
                    };
                    if let Ok(icon) = Image::from_bytes(icon_bytes) {
                        let _ = tray.set_icon(Some(icon));
                    }
                    was_running = is_running;
                }

                thread::sleep(Duration::from_secs(5));
            }

            drop(app_handle);
        })
        .map_err(|e| format!("failed to spawn tray poll thread: {e}"))?;

    // Store running flag for cleanup
    app.manage(TrayPollHandle(running));

    Ok(())
}

pub struct TrayPollHandle(pub Arc<AtomicBool>);

impl Drop for TrayPollHandle {
    fn drop(&mut self) {
        self.0.store(false, Ordering::Relaxed);
    }
}
