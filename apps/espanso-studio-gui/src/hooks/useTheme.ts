import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";
export type EffectiveTheme = "light" | "dark";

const STORAGE_KEY = "espanso-theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

function getStoredPreference(): ThemePreference {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
    }
    return "system";
}

function resolveTheme(preference: ThemePreference): EffectiveTheme {
    if (preference === "system") {
        return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
    }
    return preference;
}

function applyTheme(effective: EffectiveTheme) {
    document.documentElement.setAttribute("data-theme", effective);
}

export function useTheme() {
    const [theme, setThemeState] =
        useState<ThemePreference>(getStoredPreference);
    const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() =>
        resolveTheme(theme),
    );

    const setTheme = useCallback((next: ThemePreference) => {
        localStorage.setItem(STORAGE_KEY, next);
        setThemeState(next);
    }, []);

    useEffect(() => {
        const effective = resolveTheme(theme);
        setEffectiveTheme(effective);
        applyTheme(effective);

        if (theme !== "system") return;

        const mq = window.matchMedia(MEDIA_QUERY);
        const handler = (e: MediaQueryListEvent) => {
            const resolved = e.matches ? "dark" : "light";
            setEffectiveTheme(resolved);
            applyTheme(resolved);
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    return { theme, effectiveTheme, setTheme } as const;
}
