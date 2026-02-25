import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function DashboardIcon(props: IconProps) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <rect
                x="2"
                y="2"
                width="6"
                height="6"
                rx="1.5"
                fill="currentColor"
                opacity="0.9"
            />
            <rect
                x="10"
                y="2"
                width="6"
                height="6"
                rx="1.5"
                fill="currentColor"
                opacity="0.5"
            />
            <rect
                x="2"
                y="10"
                width="6"
                height="6"
                rx="1.5"
                fill="currentColor"
                opacity="0.5"
            />
            <rect
                x="10"
                y="10"
                width="6"
                height="6"
                rx="1.5"
                fill="currentColor"
                opacity="0.7"
            />
        </svg>
    );
}

export function MatchesIcon(props: IconProps) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <path
                d="M4 4h10M4 9h10M4 14h6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function PackagesIcon(props: IconProps) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <path
                d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <path
                d="M9 9V16M9 9L3 5.5M9 9L15 5.5"
                stroke="currentColor"
                strokeWidth="1.5"
            />
        </svg>
    );
}

export function StatsIcon(props: IconProps) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <path
                d="M3 14L7 8L11 11L15 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function LogsIcon(props: IconProps) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <rect
                x="2.5"
                y="3"
                width="13"
                height="12"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path
                d="M5.5 8L7.5 10L5.5 12M9.5 12H12.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function SunIcon(props: IconProps) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <circle
                cx="8"
                cy="8"
                r="3"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path
                d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.05 3.05L4.11 4.11M11.89 11.89L12.95 12.95M12.95 3.05L11.89 4.11M4.11 11.89L3.05 12.95"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function MoonIcon(props: IconProps) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <path
                d="M13.5 9.5a5.5 5.5 0 0 1-7-7A5.5 5.5 0 1 0 13.5 9.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function MonitorIcon(props: IconProps) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <rect
                x="1.5"
                y="2.5"
                width="13"
                height="9"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path
                d="M5.5 14h5M8 11.5V14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function SettingsIcon(props: IconProps) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <line
                x1="3"
                y1="5"
                x2="15"
                y2="5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <line
                x1="3"
                y1="9"
                x2="15"
                y2="9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <line
                x1="3"
                y1="13"
                x2="15"
                y2="13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <circle cx="6" cy="5" r="1.5" fill="currentColor" />
            <circle cx="12" cy="9" r="1.5" fill="currentColor" />
            <circle cx="8" cy="13" r="1.5" fill="currentColor" />
        </svg>
    );
}
