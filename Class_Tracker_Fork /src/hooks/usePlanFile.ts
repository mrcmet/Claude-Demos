/**
 * usePlanFile.ts
 *
 * React hook that manages loading and holding a PlanFile in component state.
 *
 * The plan file is NOT persisted to localStorage — it's too large for
 * localStorage and users are expected to re-load it each session (or we
 * can add IndexedDB persistence in a future version). The hook manages
 * the async loading lifecycle and surfaces errors to the UI.
 *
 * Design decisions:
 * - error is a human-readable string (not an Error object) to make it trivial
 *   for UI components to render it directly without any further formatting.
 * - Errors are cleared on each new load attempt, not on component mount, so
 *   the user sees feedback from the most recent action.
 * - The hook does not auto-load a sample file — that decision belongs in
 *   App.tsx / the UI layer (Agent B's territory).
 */

import { useState, useCallback } from "react";
import type { PlanFile } from "../types";
import { importPlanFile } from "../storage/fileImport";

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UsePlanFileReturn {
  /** The currently loaded plan file, or null if none has been loaded yet. */
  planFile: PlanFile | null;
  /**
   * Reads the given File, validates it as a PlanFile, and stores it in state.
   * Clears any previous error before attempting. Sets error on failure.
   */
  loadPlanFile: (file: File) => Promise<void>;
  /**
   * Directly sets a pre-parsed PlanFile into state (e.g. from the CSV importer).
   * Clears any previous error.
   */
  setPlanFile: (plan: PlanFile) => void;
  /**
   * Human-readable error message from the last failed load attempt.
   * Null when no error has occurred or after a successful load.
   */
  error: string | null;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export function usePlanFile(): UsePlanFileReturn {
  const [planFile, setPlanFileState] = useState<PlanFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPlanFile = useCallback(async (file: File): Promise<void> => {
    // Clear previous error before each attempt.
    setError(null);

    try {
      const imported = await importPlanFile(file);
      setPlanFileState(imported);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : `Failed to load "${file.name}". Please check the file format.`;
      setError(message);
      // Do NOT clear the existing planFile on error — keep the last valid
      // plan visible rather than blanking the UI on a bad file drop.
    }
  }, []);

  const setPlanFile = useCallback((plan: PlanFile): void => {
    setError(null);
    setPlanFileState(plan);
  }, []);

  return { planFile, loadPlanFile, setPlanFile, error };
}
