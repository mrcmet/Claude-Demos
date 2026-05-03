/**
 * CsvImportModal.tsx
 *
 * Multi-step modal for importing a CSV file as a PlanFile.
 *
 * Step 1 — Upload:     Drag-and-drop zone or file picker for .csv
 * Step 2 — Metadata:   Department + catalog year inputs, then "Import" button
 * Step 3 — Results:    Summary, error/warning lists, course preview
 * Step 4 — Confirm:    "Load Plan" calls onImport and closes the modal
 *
 * Styling: dark sci-fi theme — all colors from useTheme(). Rajdhani headings,
 * Inter body text, matching the existing Sidebar / CourseDetailPanel patterns.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { DragEvent, ChangeEvent, KeyboardEvent, ReactNode } from "react";
import { useTheme } from "@themes/themeContext";
import { Modal } from "@components/shared/Modal";
import { importFromCsv } from "@storage/csvImport";
import { downloadCsvTemplate } from "./templateDownload";
import type { PlanFile } from "@types";
import type { CsvImportResult } from "@storage/csvImport";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the successfully parsed PlanFile when the user confirms. */
  onImport: (planFile: PlanFile) => void;
}

// ---------------------------------------------------------------------------
// Step type
// ---------------------------------------------------------------------------

type Step = "upload" | "metadata" | "results";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CsvImportModal({ open, onClose, onImport }: CsvImportModalProps) {
  const theme = useTheme();

  // ── Step state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("upload");

  // ── File ──────────────────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;

  // ── Metadata ──────────────────────────────────────────────────────────────
  const [department, setDepartment] = useState("");
  const [catalogYear, setCatalogYear] = useState(new Date().getFullYear().toString());

  // ── Result ────────────────────────────────────────────────────────────────
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // ── Reset all state when the modal opens ─────────────────────────────────
  useEffect(() => {
    if (open) {
      setStep("upload");
      setSelectedFile(null);
      setIsDragOver(false);
      setDepartment("");
      setCatalogYear(new Date().getFullYear().toString());
      setImportResult(null);
      setIsProcessing(false);
      setProcessingError(null);
    }
  }, [open]);

  // ── File selection ────────────────────────────────────────────────────────

  const acceptFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setProcessingError("Only .csv files are supported.");
      return;
    }
    setProcessingError(null);
    setSelectedFile(file);
    setStep("metadata");
  }, []);

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        acceptFile(file);
        // Reset so the same file can be re-selected if needed
        e.target.value = "";
      }
    },
    [acceptFile]
  );

  // ── Drag-and-drop ─────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) acceptFile(file);
    },
    [acceptFile]
  );

  // ── Import (run conversion) ───────────────────────────────────────────────

  const handleImport = useCallback(async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProcessingError(null);

    try {
      const result = await importFromCsv(selectedFile, {
        department: department.trim() || "Unknown Department",
        catalogYear: catalogYear.trim() || new Date().getFullYear().toString(),
      });
      setImportResult(result);
      setStep("results");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while parsing the CSV.";
      setProcessingError(msg);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, department, catalogYear]);

  const handleMetadataKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleImport();
      }
    },
    [handleImport]
  );

  // ── Load Plan (confirm import) ────────────────────────────────────────────

  const handleLoadPlan = useCallback(() => {
    if (!importResult) return;
    onImport(importResult.planFile);
    onClose();
  }, [importResult, onImport, onClose]);

  // ── Back to upload step ───────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    setStep("upload");
    setSelectedFile(null);
    setImportResult(null);
    setProcessingError(null);
  }, []);

  // ── Title per step ────────────────────────────────────────────────────────

  const stepTitle =
    step === "upload"
      ? "Import from Spreadsheet"
      : step === "metadata"
      ? "Plan Details"
      : "Import Results";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal open={open} onClose={onClose} title={stepTitle} maxWidth={560}>
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          color: theme.textPrimary,
          minHeight: 240,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {step === "upload" && (
          <StepUpload
            isDragOver={isDragOver}
            processingError={processingError}
            fileInputRef={fileInputRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileInputChange={handleFileInputChange}
            onPickFile={() => fileInputRef.current?.click()}
            theme={theme}
          />
        )}

        {step === "metadata" && selectedFile && (
          <StepMetadata
            fileName={selectedFile.name}
            department={department}
            catalogYear={catalogYear}
            isProcessing={isProcessing}
            processingError={processingError}
            onDepartmentChange={setDepartment}
            onCatalogYearChange={setCatalogYear}
            onImport={handleImport}
            onKeyDown={handleMetadataKeyDown}
            onBack={handleBack}
            theme={theme}
          />
        )}

        {step === "results" && importResult && (
          <StepResults
            result={importResult}
            onLoadPlan={handleLoadPlan}
            onCancel={onClose}
            theme={theme}
          />
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Upload
// ---------------------------------------------------------------------------

interface StepUploadProps {
  isDragOver: boolean;
  processingError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onPickFile: () => void;
  theme: ReturnType<typeof useTheme>;
}

function StepUpload({
  isDragOver,
  processingError,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInputChange,
  onPickFile,
  theme,
}: StepUploadProps) {
  return (
    <>
      {/* Instructions */}
      <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>
        Export your Google Sheet or Excel file as <code style={{ color: theme.status.available.text, fontSize: 12 }}>.csv</code>,
        then upload it here to convert it into a curriculum plan.
      </p>

      {/* Template download link */}
      <p style={{ fontSize: 12, color: theme.textMuted, margin: 0 }}>
        Not sure about the format?{" "}
        <button
          onClick={downloadCsvTemplate}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: theme.status.in_progress.text,
            cursor: "pointer",
            fontSize: 12,
            fontFamily: "'Inter', sans-serif",
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          Download the template
        </button>
      </p>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={onFileInputChange}
        style={{ display: "none" }}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Drag-and-drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop zone: drag and drop your CSV file here, or press Enter to open a file picker"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onPickFile}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPickFile();
          }
        }}
        style={{
          border: `2px dashed ${isDragOver ? theme.status.available.border : theme.borderDefault}`,
          borderRadius: 8,
          padding: "32px 24px",
          textAlign: "center",
          cursor: "pointer",
          transition: "border-color 150ms ease, background 150ms ease",
          background: isDragOver ? "rgba(59,130,246,0.06)" : "transparent",
          boxShadow: isDragOver ? `0 0 16px ${theme.status.available.glow}` : "none",
          userSelect: "none",
          outline: "none",
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = theme.status.available.border;
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = theme.borderDefault;
        }}
      >
        <UploadCloudIcon color={isDragOver ? theme.status.available.border : theme.textMuted} />
        <p
          style={{
            marginTop: 12,
            marginBottom: 4,
            fontSize: 14,
            color: isDragOver ? theme.status.available.text : theme.textSecondary,
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          {isDragOver ? "Drop to upload" : "Drag & drop your CSV here"}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: theme.textMuted }}>
          or{" "}
          <span style={{ color: theme.status.available.text, textDecoration: "underline" }}>
            click to browse
          </span>
        </p>
      </div>

      {/* Error message */}
      {processingError && (
        <ErrorBox message={processingError} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Metadata
// ---------------------------------------------------------------------------

interface StepMetadataProps {
  fileName: string;
  department: string;
  catalogYear: string;
  isProcessing: boolean;
  processingError: string | null;
  onDepartmentChange: (v: string) => void;
  onCatalogYearChange: (v: string) => void;
  onImport: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onBack: () => void;
  theme: ReturnType<typeof useTheme>;
}

function StepMetadata({
  fileName,
  department,
  catalogYear,
  isProcessing,
  processingError,
  onDepartmentChange,
  onCatalogYearChange,
  onImport,
  onKeyDown,
  onBack,
  theme,
}: StepMetadataProps) {
  return (
    <>
      {/* Selected file indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: theme.panel,
          border: `1px solid ${theme.borderDefault}`,
          borderRadius: 6,
          padding: "8px 12px",
        }}
      >
        <CsvFileIcon color={theme.status.available.text} />
        <span
          style={{
            fontSize: 12,
            color: theme.textSecondary,
            fontFamily: "'JetBrains Mono', monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {fileName}
        </span>
        <button
          onClick={onBack}
          title="Choose a different file"
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            color: theme.textMuted,
            cursor: "pointer",
            fontSize: 11,
            fontFamily: "'Inter', sans-serif",
            padding: "0 4px",
            flexShrink: 0,
            transition: "color 120ms",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = theme.textSecondary)
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = theme.textMuted)
          }
        >
          Change
        </button>
      </div>

      {/* Metadata fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FormField label="Department" theme={theme}>
          <StyledInput
            value={department}
            placeholder="e.g. Computer Science"
            onChange={(e) => onDepartmentChange(e.target.value)}
            onKeyDown={onKeyDown}
            theme={theme}
            autoFocus
          />
        </FormField>

        <FormField label="Catalog Year" theme={theme}>
          <StyledInput
            value={catalogYear}
            placeholder="e.g. 2026"
            onChange={(e) => onCatalogYearChange(e.target.value)}
            onKeyDown={onKeyDown}
            theme={theme}
          />
        </FormField>
      </div>

      {processingError && <ErrorBox message={processingError} />}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <GhostButton label="Cancel" onClick={onBack} theme={theme} />
        <PrimaryButton
          label={isProcessing ? "Parsing…" : "Import"}
          onClick={onImport}
          disabled={isProcessing}
          theme={theme}
          accent={theme.status.available.border}
          hoverBg="rgba(59,130,246,0.14)"
        />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Results
// ---------------------------------------------------------------------------

interface StepResultsProps {
  result: CsvImportResult;
  onLoadPlan: () => void;
  onCancel: () => void;
  theme: ReturnType<typeof useTheme>;
}

function StepResults({ result, onLoadPlan, onCancel, theme }: StepResultsProps) {
  const { planFile, errors, warnings } = result;
  const courseCount = planFile.courses.length;
  const programCount = planFile.programs.length;
  const previewCourses = planFile.courses.slice(0, 10);
  const remaining = courseCount - previewCourses.length;

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const canLoad = courseCount > 0;

  return (
    <>
      {/* Summary banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: canLoad ? "rgba(0,255,136,0.06)" : "rgba(239,68,68,0.06)",
          border: `1px solid ${canLoad ? theme.status.completed.border : theme.accent.red}`,
          borderRadius: 6,
          padding: "10px 14px",
        }}
      >
        <span style={{ fontSize: 16 }}>{canLoad ? "✓" : "✗"}</span>
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: canLoad ? theme.status.completed.text : theme.accent.red,
            letterSpacing: "0.03em",
          }}
        >
          {canLoad
            ? `${courseCount} course${courseCount !== 1 ? "s" : ""} imported, ${programCount} program${programCount !== 1 ? "s" : ""} detected`
            : "No valid courses found — check the errors below"}
        </span>
      </div>

      {/* Errors */}
      {hasErrors && (
        <ScrollableMessageBox
          title={`${errors.length} Error${errors.length !== 1 ? "s" : ""} — rows skipped`}
          accentColor={theme.accent.red}
          bgColor="rgba(239,68,68,0.06)"
        >
          {errors.map((err, idx) => (
            <MessageRow
              key={idx}
              badge={`Row ${err.row}`}
              badgeColor={theme.accent.red}
              text={err.message}
              theme={theme}
            />
          ))}
        </ScrollableMessageBox>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <ScrollableMessageBox
          title={`${warnings.length} Warning${warnings.length !== 1 ? "s" : ""} — defaults applied`}
          accentColor={theme.accent.orange}
          bgColor="rgba(245,158,11,0.06)"
        >
          {warnings.map((w, idx) => (
            <MessageRow
              key={idx}
              badge={`Row ${w.row}`}
              badgeColor={theme.accent.orange}
              text={w.message}
              theme={theme}
            />
          ))}
        </ScrollableMessageBox>
      )}

      {/* Course preview list */}
      {courseCount > 0 && (
        <div>
          <SectionLabel text="Course Preview" theme={theme} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginTop: 6,
            }}
          >
            {previewCourses.map((course) => (
              <div
                key={course.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "5px 10px",
                  background: theme.panel,
                  border: `1px solid ${theme.borderDefault}`,
                  borderRadius: 5,
                }}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: theme.status.available.text,
                    flexShrink: 0,
                    minWidth: 72,
                  }}
                >
                  {course.id}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: theme.textSecondary,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {course.name}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    color: theme.textMuted,
                    flexShrink: 0,
                  }}
                >
                  {course.credits} cr
                </span>
              </div>
            ))}
            {remaining > 0 && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 11,
                  color: theme.textMuted,
                  textAlign: "right",
                  fontStyle: "italic",
                }}
              >
                …and {remaining} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <GhostButton label="Cancel" onClick={onCancel} theme={theme} />
        <PrimaryButton
          label="Load Plan"
          onClick={onLoadPlan}
          disabled={!canLoad}
          theme={theme}
          accent={theme.status.completed.border}
          hoverBg="rgba(0,255,136,0.10)"
        />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function FormField({
  label,
  children,
  theme,
}: {
  label: string;
  children: ReactNode;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 10,
          color: theme.textMuted,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function StyledInput({
  value,
  placeholder,
  onChange,
  onKeyDown,
  theme,
  autoFocus = false,
}: {
  value: string;
  placeholder?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  theme: ReturnType<typeof useTheme>;
  autoFocus?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      style={{
        width: "100%",
        boxSizing: "border-box",
        background: theme.panel,
        border: `1px solid ${theme.borderDefault}`,
        borderRadius: 5,
        color: theme.textPrimary,
        fontFamily: "'Inter', sans-serif",
        fontSize: 13,
        padding: "7px 10px",
        outline: "none",
        transition: "border-color 150ms ease, box-shadow 150ms ease",
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLInputElement).style.borderColor =
          theme.status.in_progress.border;
        (e.currentTarget as HTMLInputElement).style.boxShadow =
          `0 0 6px ${theme.status.in_progress.glow}`;
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLInputElement).style.borderColor = theme.borderDefault;
        (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
      }}
    />
  );
}

function PrimaryButton({
  label,
  onClick,
  disabled,
  theme,
  accent,
  hoverBg,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  theme: ReturnType<typeof useTheme>;
  accent: string;
  hoverBg: string;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        background: "transparent",
        border: `1px solid ${disabled ? theme.textMuted : accent}`,
        color: disabled ? theme.textMuted : accent,
        padding: "8px 20px",
        borderRadius: 5,
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "background 150ms ease",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLButtonElement).style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {label}
    </button>
  );
}

function GhostButton({
  label,
  onClick,
  theme,
}: {
  label: string;
  onClick: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: `1px solid ${theme.borderDefault}`,
        color: theme.textMuted,
        padding: "8px 16px",
        borderRadius: 5,
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "border-color 150ms ease, color 150ms ease",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = theme.textMuted;
        (e.currentTarget as HTMLButtonElement).style.color = theme.textSecondary;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = theme.borderDefault;
        (e.currentTarget as HTMLButtonElement).style.color = theme.textMuted;
      }}
    >
      {label}
    </button>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        background: "rgba(239,68,68,0.08)",
        border: `1px solid rgba(239,68,68,0.35)`,
        borderRadius: 6,
        padding: "10px 14px",
        fontSize: 12,
        color: "#fca5a5",
        lineHeight: 1.5,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {message}
    </div>
  );
}

function ScrollableMessageBox({
  title,
  accentColor,
  bgColor,
  children,
}: {
  title: string;
  accentColor: string;
  bgColor: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: bgColor,
        border: `1px solid ${accentColor}`,
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "7px 12px",
          borderBottom: `1px solid ${accentColor}`,
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 11,
          color: accentColor,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div
        style={{
          maxHeight: 140,
          overflowY: "auto",
          padding: "8px 0",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function MessageRow({
  badge,
  badgeColor,
  text,
  theme,
}: {
  badge: string;
  badgeColor: string;
  text: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        padding: "2px 12px",
      }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: badgeColor,
          flexShrink: 0,
          minWidth: 44,
        }}
      >
        {badge}
      </span>
      <span
        style={{
          fontSize: 11,
          color: theme.textSecondary,
          lineHeight: 1.5,
        }}
      >
        {text}
      </span>
    </div>
  );
}

function SectionLabel({
  text,
  theme,
}: {
  text: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <p
      style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        fontSize: 10,
        color: theme.textMuted,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        margin: 0,
      }}
    >
      {text}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function UploadCloudIcon({ color }: { color: string }) {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function CsvFileIcon({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
