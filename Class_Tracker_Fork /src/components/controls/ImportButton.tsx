/**
 * ImportButton.tsx
 *
 * A styled file-picker button. Hides the native <input type="file"> and
 * presents a custom-styled button matching the sci-fi design system.
 * On file selection, passes the File object to the onFile callback.
 *
 * The hidden input is reset after each selection so the same file can be
 * re-imported without needing to pick a different file first.
 */

import { useRef, useCallback } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { useTheme } from "@themes/themeContext";

interface ImportButtonProps {
  /** Button label text */
  label: string;
  /** Called with the selected File object */
  onFile: (file: File) => void;
  /** Accepted file types. Default: ".json" */
  accept?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Optional icon to render before the label */
  icon?: ReactNode;
}

export function ImportButton({
  label,
  onFile,
  accept = ".json",
  disabled = false,
  icon,
}: ImportButtonProps) {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFile(file);
        // Reset so the same file can be re-selected
        e.target.value = "";
      }
    },
    [onFile]
  );

  return (
    <>
      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: "none" }}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Visible styled button */}
      <button
        onClick={handleButtonClick}
        disabled={disabled}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 7,
          justifyContent: "flex-start",
          background: "transparent",
          border: `1px solid ${disabled ? theme.borderDefault : theme.status.available.border}`,
          color: disabled ? theme.textMuted : theme.status.available.text,
          borderRadius: 5,
          padding: "7px 11px",
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.45 : 1,
          transition: "background 150ms ease, border-color 150ms ease",
          outline: "none",
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(59,130,246,0.12)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
        aria-label={label}
      >
        {icon ?? <UploadIcon />}
        {label}
      </button>
    </>
  );
}

function UploadIcon() {
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
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
