import type { ReactNode } from "react";

type Props = {
    title: string;
    children: ReactNode;
    onClose: () => void;
};

export default function Modal({ title, children, onClose }: Props) {
    return (
        <div className="modal-overlay">
            <button
                type="button"
                className="modal-overlay-dismiss"
                onClick={onClose}
                onKeyDown={(e) => {
                    if (e.key === "Escape") onClose();
                }}
                aria-label="Close modal"
                tabIndex={-1}
            />
            <div className="modal-content" role="dialog">
                <h3>{title}</h3>
                {children}
            </div>
        </div>
    );
}
