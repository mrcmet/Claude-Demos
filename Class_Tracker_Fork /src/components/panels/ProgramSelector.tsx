/**
 * ProgramSelector.tsx
 *
 * Two modes:
 *
 * 1. Full-screen overlay (mode="overlay") — shown when no program is selected.
 *    Dark backdrop with a centered grid of program cards. Each card shows the
 *    program name and course count. Hovering highlights with a status glow.
 *    Clicking calls onSelect(program.id).
 *
 * 2. Compact dropdown (mode="compact") — rendered in the Sidebar once a
 *    program is active. Displays the selected program name with a down-chevron.
 *    Click to open an inline dropdown list of all programs.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@themes/themeContext";
import type { PlanFile, Program } from "@types";

// ── Overlay mode (full-screen program selection) ─────────────────────────────

interface ProgramSelectorOverlayProps {
  planFile: PlanFile;
  onSelect: (programId: string) => void;
}

export function ProgramSelector({
  planFile,
  onSelect,
}: ProgramSelectorOverlayProps) {
  const theme = useTheme();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(10,14,26,0.94)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        padding: 40,
        zIndex: 50,
      }}
    >
      {/* Heading */}
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 32,
            color: theme.textPrimary,
            letterSpacing: "0.06em",
            marginBottom: 8,
          }}
        >
          Select Your Program
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: theme.textMuted,
          }}
        >
          {planFile.department} — {planFile.catalogYear} Catalog
        </p>
      </div>

      {/* Program card grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`,
          gap: 16,
          width: "100%",
          maxWidth: 760,
        }}
      >
        {planFile.programs.map((program, index) => (
          <ProgramCard
            key={program.id}
            program={program}
            courseCount={program.requiredCourses.length}
            onSelect={onSelect}
            animationDelay={index * 0.06}
          />
        ))}
      </div>
    </div>
  );
}

// ── Program card ─────────────────────────────────────────────────────────────

interface ProgramCardProps {
  program: Program;
  courseCount: number;
  onSelect: (id: string) => void;
  animationDelay: number;
}

function ProgramCard({
  program,
  courseCount,
  onSelect,
  animationDelay,
}: ProgramCardProps) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, type: "spring", stiffness: 300, damping: 28 }}
      onClick={() => onSelect(program.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? theme.panel : theme.surface,
        border: `1px solid ${hovered ? theme.status.available.border : theme.borderDefault}`,
        borderRadius: 8,
        padding: "20px 22px",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "border-color 160ms ease, background 160ms ease, box-shadow 160ms ease",
        boxShadow: hovered
          ? `0 0 18px ${theme.status.available.glow}, 0 4px 24px rgba(0,0,0,0.3)`
          : "0 2px 8px rgba(0,0,0,0.2)",
        outline: "none",
      } as CSSProperties}
    >
      {/* Program ID tag */}
      <span
        style={{
          display: "block",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: hovered ? theme.status.available.text : theme.textMuted,
          letterSpacing: "0.08em",
          marginBottom: 6,
          transition: "color 160ms",
        }}
      >
        {program.id}
      </span>

      {/* Program name */}
      <span
        style={{
          display: "block",
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: theme.textPrimary,
          lineHeight: 1.25,
          marginBottom: 12,
        }}
      >
        {program.name}
      </span>

      {/* Course count footer */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          fontFamily: "'Inter', sans-serif",
          color: theme.textMuted,
        }}
      >
        <CourseCountIcon />
        {courseCount} required courses
        {program.electiveSets && program.electiveSets.length > 0 && (
          <span style={{ marginLeft: 4 }}>
            + {program.electiveSets.length} elective set
            {program.electiveSets.length > 1 ? "s" : ""}
          </span>
        )}
      </span>
    </motion.button>
  );
}

// ── Compact dropdown (for Sidebar) ───────────────────────────────────────────

interface ProgramDropdownProps {
  planFile: PlanFile;
  selectedProgramId: string;
  onSelect: (programId: string) => void;
}

export function ProgramDropdown({
  planFile,
  selectedProgramId,
  onSelect,
}: ProgramDropdownProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProgram = planFile.programs.find((p) => p.id === selectedProgramId);

  // Close on outside click
  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, handleOutsideClick]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: "100%",
          background: theme.panel,
          border: `1px solid ${open ? theme.status.available.border : theme.borderDefault}`,
          borderRadius: 6,
          color: theme.textPrimary,
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          padding: "7px 10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          transition: "border-color 160ms",
          outline: "none",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedProgram?.name ?? selectedProgramId}
        </span>
        <ChevronIcon flipped={open} />
      </button>

      {/* Dropdown list */}
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="Programs"
            initial={{ opacity: 0, y: -6, scaleY: 0.94 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
            transition={{ duration: 0.14 }}
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              background: theme.panel,
              border: `1px solid ${theme.borderDefault}`,
              borderRadius: 6,
              listStyle: "none",
              padding: "4px 0",
              zIndex: 200,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              transformOrigin: "top",
            }}
          >
            {planFile.programs.map((program) => {
              const isActive = program.id === selectedProgramId;
              return (
                <li
                  key={program.id}
                  role="option"
                  aria-selected={isActive}
                >
                  <button
                    onClick={() => {
                      onSelect(program.id);
                      setOpen(false);
                    }}
                    style={{
                      width: "100%",
                      background: isActive ? "rgba(59,130,246,0.12)" : "transparent",
                      border: "none",
                      borderLeft: isActive
                        ? `2px solid ${theme.status.available.border}`
                        : "2px solid transparent",
                      color: isActive ? theme.status.available.text : theme.textSecondary,
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 12,
                      padding: "7px 12px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 120ms, color 120ms",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                        (e.currentTarget as HTMLButtonElement).style.color = theme.textPrimary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color = theme.textSecondary;
                      }
                    }}
                  >
                    {program.name}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Inline SVG icons ─────────────────────────────────────────────────────────

function ChevronIcon({ flipped }: { flipped: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      style={{
        transform: flipped ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 160ms ease",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <path d="M2 4l4 4 4-4" />
    </svg>
  );
}

function CourseCountIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
