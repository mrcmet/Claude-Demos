/**
 * fileExport.ts
 *
 * Triggers a browser download of the student's progress data as a JSON file.
 *
 * Design decisions:
 * - Uses a temporary <a> element with a blob URL — the standard cross-browser
 *   approach that does not require a server round-trip.
 * - The blob URL is revoked immediately after the click to release memory.
 * - exportedAt is injected here (not in the hook) so it reflects the exact
 *   instant the file is written, not when the export was initiated.
 * - The filename encodes both name and catalogYear to help students manage
 *   multiple export files. Special characters in the name are stripped to
 *   ensure valid filenames on all operating systems.
 * - We write a shallow copy with exportedAt added — the original data object
 *   passed in is not mutated.
 */

import type { StudentData } from "../types";

/**
 * Serializes the student's data to JSON and triggers a browser download.
 * The downloaded file is suitable for re-import via importStudentFile.
 *
 * @param data - The current student state to export. Must be valid StudentData.
 */
export function exportStudentData(data: StudentData): void {
  const exportPayload: StudentData = {
    ...data,
    exportedAt: new Date().toISOString(),
  };

  const json = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const fileName = buildFileName(data.name, data.catalogYear);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;

  // Must be in the DOM for Firefox compatibility.
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Release the blob URL immediately — the download has been initiated.
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Builds a safe filename for the exported JSON file.
 *
 * Pattern: `student-{sanitized-name}-{catalogYear}.json`
 *
 * Sanitization: replaces any character that is not alphanumeric, hyphen,
 * underscore, or space with an underscore, then collapses whitespace to
 * hyphens. This ensures the filename is valid on Windows, macOS, and Linux.
 *
 * @param name        - Student's display name.
 * @param catalogYear - The catalog year string (e.g. "2026").
 * @returns           - Safe filename string ending in ".json".
 */
function buildFileName(name: string, catalogYear: string): string {
  const safeName = name
    .trim()
    .replace(/[^\w\s-]/g, "_")  // Replace unsafe chars with underscore
    .replace(/\s+/g, "-")       // Collapse whitespace to hyphens
    .toLowerCase()
    .slice(0, 50);               // Cap length to prevent excessively long names

  const safeYear = catalogYear.replace(/[^\w]/g, "") || "unknown";

  const base = safeName.length > 0 ? safeName : "student";

  return `student-${base}-${safeYear}.json`;
}
