/**
 * ExportButton.tsx
 *
 * A styled button for triggering data export. Delegates the actual export
 * logic to the onClick callback (Agent A's useStudentData hook owns the
 * file serialization and download trigger).
 */

import { useCallback } from "react";
import { useTheme } from "@themes/themeContext";

interface ExportButtonProps {
  /** Button label text */
  label: string;
  /** Called when the button is clicked (not disabled) */
  onClick: () => void;
  /** Disables the button when there is no data to export */
  disabled?: boolean;
}

export function ExportButton({
  label,
  onClick,
  disabled = false,
}: ExportButtonProps) {
  const theme = useTheme();

  const handleClick = useCallback(() => {
    if (!disabled) onClick();
  }, [disabled, onClick]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 7,
        justifyContent: "flex-start",
        background: "transparent",
        border: `1px solid ${disabled ? theme.borderDefault : theme.status.completed.border}`,
        color: disabled ? theme.textMuted : theme.status.completed.text,
        borderRadius: 5,
        padding: "7px 11px",
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "background 150ms ease, border-color 150ms ease",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(0,255,136,0.08)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
      aria-label={label}
      aria-disabled={disabled}
    >
      <DownloadIcon />
      {label}
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
