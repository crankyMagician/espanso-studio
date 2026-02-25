export type Page =
    | "dashboard"
    | "matches"
    | "packages"
    | "stats"
    | "logs"
    | "settings";

export type StatusResponse = {
    running: boolean;
    service_registered: boolean;
    config_ok: boolean;
    details: string;
};

export type ActionResponse = {
    ok: boolean;
    message: string;
};

export type MatchItem = {
    id: string;
    trigger: string;
    replace: string;
    disabled: boolean;
    source_file: string;
};

export type MatchFileInfo = {
    path: string;
    name: string;
    is_package: boolean;
    match_count: number;
};

export type MatchInput = {
    trigger: string;
    replace: string;
    disabled: boolean;
};

export type PackageInfo = {
    name: string;
    version: string;
    description: string;
};

export type TriggerStat = {
    trigger: string;
    count: number;
};

export type StatsResponse = {
    total: number;
    unique: number;
    top: TriggerStat[];
};

export type LogEntry = {
    ts: string;
    level: string;
    process: string;
    message: string;
    raw: string;
};

export type ConfigFileInfo = {
    path: string;
    name: string;
};

export type EspansoPaths = {
    config: string;
    match_dir: string;
    config_dir: string;
    packages: string;
    data: string;
    log: string;
};
