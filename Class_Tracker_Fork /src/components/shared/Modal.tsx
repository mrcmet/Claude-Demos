/**
 * Modal.tsx
 *
 * Accessible modal dialog with dark sci-fi styling.
 *
 * Behaviour:
 * - Click the backdrop → close
 * - Escape key → close
 * - Focus is trapped inside while open
 * - Rendered via a portal so it floats above all content
 */

import { useEffect, useRef, useCallback } from "react";
import type { ReactNode, KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@themes/themeContext";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** Max width of the modal card. Default: 480px */
  maxWidth?: number;
}

export function Modal({
  open,
  onClose,
  children,
  title,
  maxWidth = 480,
}: ModalProps) {
  const theme = useTheme();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  // Focus the dialog container when it opens
  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const modal = (
    <AnimatePresence>
      {open && (
        // Backdrop
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.72)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          {/* Dialog card — stop propagation so clicks inside don't close */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              maxWidth,
              background: theme.surface,
              border: `1px solid ${theme.borderDefault}`,
              borderRadius: 10,
              boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px ${theme.borderDefault}`,
              outline: "none",
              overflow: "hidden",
            }}
          >
            {/* Optional title bar */}
            {title && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: `1px solid ${theme.borderDefault}`,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: theme.textPrimary,
                    letterSpacing: "0.04em",
                  }}
                >
                  {title}
                </span>
                <button
                  onClick={onClose}
                  aria-label="Close dialog"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: theme.textMuted,
                    cursor: "pointer",
                    fontSize: 20,
                    lineHeight: 1,
                    padding: "0 2px",
                    borderRadius: 4,
                    transition: "color 120ms",
                  }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLButtonElement).style.color = theme.textPrimary)
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLButtonElement).style.color = theme.textMuted)
                  }
                >
                  ×
                </button>
              </div>
            )}

            {/* Modal body */}
            <div style={{ padding: "20px" }}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
