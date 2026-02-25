type Props = {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: "default" | "primary" | "danger";
    size?: "default" | "sm";
};

export default function ActionButton({
    label,
    onClick,
    loading = false,
    disabled = false,
    variant = "default",
    size = "default",
}: Props) {
    const classes = [
        "action-btn",
        variant !== "default" ? variant : "",
        size !== "default" ? size : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button
            type="button"
            className={classes}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading && <span className="spinner" />}
            {label}
        </button>
    );
}
