/**
 * StudentEditor.tsx
 *
 * Modal dialog for editing student metadata (name, catalog year).
 * Used when the user wants to change their profile details rather than
 * using the inline name editor in the sidebar.
 *
 * Wraps the shared Modal component.
 */

import { useState, useCallback } from "react";
import type { FormEvent } from "react";
import { useTheme } from "@themes/themeContext";
import { Modal } from "@components/shared/Modal";
import type { StudentData } from "@types";

interface StudentEditorProps {
  open: boolean;
  student: StudentData;
  onSave: (updates: Pick<StudentData, "name" | "catalogYear">) => void;
  onClose: () => void;
}

export function StudentEditor({
  open,
  student,
  onSave,
  onClose,
}: StudentEditorProps) {
  const theme = useTheme();
  const [name, setName] = useState(student.name);
  const [catalogYear, setCatalogYear] = useState(student.catalogYear);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmedName = name.trim();
      const trimmedYear = catalogYear.trim();
      if (!trimmedName) return;
      onSave({
        name: trimmedName,
        catalogYear: trimmedYear || student.catalogYear,
      });
      onClose();
    },
    [name, catalogYear, student.catalogYear, onSave, onClose]
  );

  const inputStyle = {
    width: "100%",
    background: theme.panel,
    border: `1px solid ${theme.borderDefault}`,
    borderRadius: 5,
    color: theme.textPrimary,
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    padding: "8px 10px",
    outline: "none",
    transition: "border-color 150ms",
  } as const;

  const labelStyle = {
    display: "block",
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    color: theme.textMuted,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    marginBottom: 5,
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile" maxWidth={400}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name field */}
          <div>
            <label htmlFor="student-name" style={labelStyle}>
              Name
            </label>
            <input
              id="student-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={64}
              required
              style={inputStyle}
              onFocus={(e) =>
                ((e.currentTarget as HTMLInputElement).style.borderColor =
                  theme.status.in_progress.border)
              }
              onBlur={(e) =>
                ((e.currentTarget as HTMLInputElement).style.borderColor =
                  theme.borderDefault)
              }
            />
          </div>

          {/* Catalog year field */}
          <div>
            <label htmlFor="catalog-year" style={labelStyle}>
              Catalog Year
            </label>
            <input
              id="catalog-year"
              type="text"
              value={catalogYear}
              onChange={(e) => setCatalogYear(e.target.value)}
              maxLength={10}
              pattern="\d{4}"
              placeholder="e.g. 2026"
              style={inputStyle}
              onFocus={(e) =>
                ((e.currentTarget as HTMLInputElement).style.borderColor =
                  theme.status.in_progress.border)
              }
              onBlur={(e) =>
                ((e.currentTarget as HTMLInputElement).style.borderColor =
                  theme.borderDefault)
              }
            />
          </div>

          {/* Action row */}
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              marginTop: 4,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: `1px solid ${theme.borderDefault}`,
                color: theme.textMuted,
                borderRadius: 5,
                padding: "7px 16px",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: "transparent",
                border: `1px solid ${theme.status.available.border}`,
                color: theme.status.available.text,
                borderRadius: 5,
                padding: "7px 16px",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
