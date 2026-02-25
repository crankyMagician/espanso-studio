import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";

type InvokeState<T> = {
    data: T | null;
    loading: boolean;
    error: string;
};

export function useInvoke<T>(command: string) {
    const [state, setState] = useState<InvokeState<T>>({
        data: null,
        loading: false,
        error: "",
    });

    const run = useCallback(
        async (args?: Record<string, unknown>) => {
            setState((prev) => ({ ...prev, loading: true, error: "" }));
            try {
                const result = await invoke<T>(command, args);
                setState({ data: result, loading: false, error: "" });
                return result;
            } catch (error) {
                const message = String(error);
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: message,
                }));
                throw error;
            }
        },
        [command],
    );

    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: "" });
    }, []);

    return { ...state, run, reset };
}
