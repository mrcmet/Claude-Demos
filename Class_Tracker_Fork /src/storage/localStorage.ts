/**
 * localStorage.ts
 *
 * Thin, validated persistence layer for StudentData using the browser's
 * localStorage API.
 *
 * Design decisions:
 * - A versioned key ("class_tracker_student_v1") allows future schema
 *   migrations without colliding with legacy stored data.
 * - Validation on load is defensive: malformed, stale, or corrupted data
 *   returns null rather than crashing the app. The caller (useStudentData)
 *   can then initialize a fresh default student.
 * - We validate structural shape but do not re-validate the full contents of
 *   completedCourses/inProgressCourses arrays beyond confirming they are
 *   arrays — individual string elements are trusted at this layer.
 * - No logging of the actual data to avoid PII in console output.
 */

import type { StudentData } from "../types";

const STORAGE_KEY = "class_tracker_student_v1";

/**
 * Loads and validates the student record from localStorage.
 *
 * @returns StudentData if a valid record exists, null otherwise.
 *          Returns null on any parse error, missing key, or schema mismatch.
 */
export function loadStudentData(): StudentData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return validateStudentData(parsed);
  } catch {
    // JSON.parse failure or unexpected runtime error — treat as missing data.
    return null;
  }
}

/**
 * Persists the student record to localStorage.
 * Silently no-ops if the storage write fails (e.g. private browsing quota).
 *
 * @param data - Validated StudentData to persist.
 */
export function saveStudentData(data: StudentData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or access denied — degrade gracefully.
    // The in-memory state in the hook remains correct even if persistence fails.
  }
}

/**
 * Removes the student record from localStorage.
 * Safe to call even if no record exists.
 */
export function clearStudentData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore removal failures in restricted environments.
  }
}

// ---------------------------------------------------------------------------
// Internal validation
// ---------------------------------------------------------------------------

/**
 * Type-narrows an unknown value to StudentData, returning null on any
 * structural mismatch.
 *
 * Validates:
 * - version must be exactly "1.0"
 * - name must be a non-empty string
 * - catalogYear must be a string
 * - completedCourses must be an Array
 * - inProgressCourses must be an Array
 * - selectedProgram must be string or null
 *
 * Optional fields (gpaData, exportedAt) are passed through without strict
 * validation — unknown extra fields are also tolerated for forward compatibility.
 */
function validateStudentData(raw: unknown): StudentData | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;

  if (record["version"] !== "1.0") {
    return null;
  }

  if (typeof record["name"] !== "string") {
    return null;
  }

  if (typeof record["catalogYear"] !== "string") {
    return null;
  }

  if (!Array.isArray(record["completedCourses"])) {
    return null;
  }

  if (!Array.isArray(record["inProgressCourses"])) {
    return null;
  }

  const selectedProgram = record["selectedProgram"];
  if (selectedProgram !== null && typeof selectedProgram !== "string") {
    return null;
  }

  // gpaData validation: if present, must be a non-array object.
  if (
    record["gpaData"] !== undefined &&
    (typeof record["gpaData"] !== "object" ||
      record["gpaData"] === null ||
      Array.isArray(record["gpaData"]))
  ) {
    return null;
  }

  return {
    name: record["name"] as string,
    selectedProgram: selectedProgram as string | null,
    catalogYear: record["catalogYear"] as string,
    completedCourses: record["completedCourses"] as string[],
    inProgressCourses: record["inProgressCourses"] as string[],
    gpaData: record["gpaData"] as Record<string, string> | undefined,
    exportedAt: typeof record["exportedAt"] === "string"
      ? record["exportedAt"]
      : undefined,
    version: "1.0",
  };
}
