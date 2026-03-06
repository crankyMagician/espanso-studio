/*
 * This file is part of espanso.
 *
 * Copyright (C) 2019-2021 Federico Terzi
 *
 * espanso is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * espanso is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with espanso.  If not, see <https://www.gnu.org/licenses/>.
 */

use super::super::Middleware;
use crate::event::{Event, EventType};
use log::error;
use std::path::PathBuf;
use std::process::Command;

pub trait GuiAppPathProvider {
    fn get_gui_app_path(&self) -> Option<PathBuf>;
}

pub struct GuiMiddleware<'a> {
    provider: &'a dyn GuiAppPathProvider,
}

impl<'a> GuiMiddleware<'a> {
    pub fn new(provider: &'a dyn GuiAppPathProvider) -> Self {
        Self { provider }
    }
}

impl Middleware for GuiMiddleware<'_> {
    fn name(&self) -> &'static str {
        "open_gui"
    }

    fn next(&self, event: Event, _dispatch: &mut dyn FnMut(Event)) -> Event {
        if matches!(event.etype, EventType::OpenGui) {
            if std::env::consts::OS != "macos" {
                error!("OpenGui is currently only supported on macOS");
                return Event::caused_by(event.source_id, EventType::NOOP);
            }

            let Some(app_path) = self.provider.get_gui_app_path() else {
                error!("unable to resolve the Espanso GUI helper app path");
                return Event::caused_by(event.source_id, EventType::NOOP);
            };

            if !app_path.exists() {
                error!(
                    "unable to open the Espanso GUI helper because it does not exist: {}",
                    app_path.display()
                );
                return Event::caused_by(event.source_id, EventType::NOOP);
            }

            match Command::new("open").arg(&app_path).status() {
                Ok(status) if !status.success() => {
                    error!(
                        "unable to open the Espanso GUI helper at {}: open exited with status {status}",
                        app_path.display()
                    );
                }
                Ok(_) => {}
                Err(err) => {
                    error!(
                        "unable to open the Espanso GUI helper at {}: {err}",
                        app_path.display()
                    );
                }
            }

            return Event::caused_by(event.source_id, EventType::NOOP);
        }

        event
    }
}

#[cfg(test)]
mod tests {
    use super::{GuiAppPathProvider, GuiMiddleware};
    use crate::event::{Event, EventType};
    use crate::process::Middleware;
    use std::path::PathBuf;

    struct StaticGuiAppPathProvider {
        path: Option<PathBuf>,
    }

    impl GuiAppPathProvider for StaticGuiAppPathProvider {
        fn get_gui_app_path(&self) -> Option<PathBuf> {
            self.path.clone()
        }
    }

    #[test]
    fn open_gui_without_path_provider_becomes_noop() {
        let provider = StaticGuiAppPathProvider { path: None };
        let middleware = GuiMiddleware::new(&provider);
        let input = Event::caused_by(7, EventType::OpenGui);

        let output = middleware.next(input, &mut |_event| {});

        assert!(matches!(output.etype, EventType::NOOP));
        assert_eq!(output.source_id, 7);
    }
}
