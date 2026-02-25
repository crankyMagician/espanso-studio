type Props = {
    label: string;
    ok: boolean;
};

export default function StatusChip({ label, ok }: Props) {
    return (
        <div className={`status-chip ${ok ? "ok" : "bad"}`}>
            <span className="chip-label">{label}</span>
            <strong className="chip-value">{ok ? "Active" : "Inactive"}</strong>
        </div>
    );
}
