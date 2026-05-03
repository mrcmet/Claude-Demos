/**
 * csvImport.ts
 *
 * Pure CSV-to-PlanFile conversion logic. No React, no side effects beyond
 * the Papa Parse call. Returns a result object containing the PlanFile,
 * any row-level errors (courses that were skipped), and warnings (courses
 * included with fallback values).
 *
 * Column contract (see README / template CSV for full spec):
 *   id, name, credits, prereq_type, prereq_courses, prereq_count,
 *   corequisites, min_grade, terms, description, program
 */

import Papa from "papaparse";
import type { PlanFile, Course, Program, PrereqRule, Term } from "../types";

// ---------------------------------------------------------------------------
// Public result types
// ---------------------------------------------------------------------------

export interface CsvImportError {
  /** 1-based CSV row number (header = row 1, first data row = row 2) */
  row: number;
  field: string;
  message: string;
}

export interface CsvImportWarning {
  /** 1-based CSV row number */
  row: number;
  message: string;
}

export interface CsvImportResult {
  planFile: PlanFile;
  errors: CsvImportError[];
  warnings: CsvImportWarning[];
}

// ---------------------------------------------------------------------------
// Internal raw row shape after Papa Parse
// ---------------------------------------------------------------------------

interface RawRow {
  id?: string;
  name?: string;
  credits?: string;
  prereq_type?: string;
  prereq_courses?: string;
  prereq_count?: string;
  corequisites?: string;
  min_grade?: string;
  terms?: string;
  description?: string;
  program?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_TERMS = new Set<string>(["Fall", "Spring", "Summer", "Winter"]);
const VALID_PREREQ_TYPES = new Set<string>(["none", "all", "any", "choose"]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Split a comma-separated string into trimmed, non-empty tokens.
 * Returns an empty array for blank/undefined input.
 */
function splitComma(value: string | undefined): string[] {
  if (!value || value.trim() === "") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Normalise a raw cell value: trim whitespace, collapse to undefined if blank.
 */
function norm(value: string | undefined): string | undefined {
  const s = value?.trim();
  return s && s.length > 0 ? s : undefined;
}

// ---------------------------------------------------------------------------
// Core conversion
// ---------------------------------------------------------------------------

/**
 * Parse a CSV File and convert it to a PlanFile.
 *
 * @param file   - The .csv File object from the file picker / drop zone
 * @param meta   - department and catalogYear strings to embed in the PlanFile
 */
export async function importFromCsv(
  file: File,
  meta: { department: string; catalogYear: string }
): Promise<CsvImportResult> {
  const text = await file.text();

  // Papa Parse: header mode gives us objects keyed by the header row
  const parseResult = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: true,
    comments: "#",
    // Do NOT transform values — we want raw strings so we can validate them.
    transformHeader: (h) => h.trim(),
  });

  const rawRows = parseResult.data;
  const errors: CsvImportError[] = [];
  const warnings: CsvImportWarning[] = [];
  const courses: Course[] = [];

  // Track program groupings: programId → Set of course IDs
  const programMap = new Map<string, string[]>();
  let hasProgramColumn = false;

  // Papa Parse header row = row 1; first data row starts at 2.
  // After skipEmptyLines, our index i maps to CSV row i + 2.
  for (let i = 0; i < rawRows.length; i++) {
    const csvRow = i + 2; // 1-based, accounting for header row
    const raw = rawRows[i];

    // ── Skip comment rows (id cell starts with #) ──────────────────────────
    const rawId = norm(raw.id);
    if (rawId && rawId.startsWith("#")) continue;

    // ── Skip blank id rows (section headers, empty separators) ─────────────
    if (!rawId) continue;

    // ── Detect whether a program column is present ─────────────────────────
    // We check the raw object key set once on the first non-skipped row.
    if (!hasProgramColumn && "program" in raw) {
      hasProgramColumn = true;
    }

    // ── Required field: name ────────────────────────────────────────────────
    const rawName = norm(raw.name);
    if (!rawName) {
      errors.push({ row: csvRow, field: "name", message: `Row ${csvRow}: "name" is required.` });
      continue;
    }

    // ── Required field: credits ─────────────────────────────────────────────
    const rawCredits = norm(raw.credits);
    let credits = 0;
    if (!rawCredits) {
      errors.push({ row: csvRow, field: "credits", message: `Row ${csvRow}: "credits" is required.` });
      continue;
    } else {
      const parsed = parseInt(rawCredits, 10);
      if (isNaN(parsed) || !isFinite(parsed)) {
        warnings.push({ row: csvRow, message: `Row ${csvRow}: "credits" value "${rawCredits}" is not a number — defaulting to 0.` });
        credits = 0;
      } else {
        credits = Math.max(0, parsed);
      }
    }

    // ── Required field: prereq_type ─────────────────────────────────────────
    const rawPrereqType = norm(raw.prereq_type)?.toLowerCase();
    if (!rawPrereqType) {
      errors.push({ row: csvRow, field: "prereq_type", message: `Row ${csvRow}: "prereq_type" is required.` });
      continue;
    }
    if (!VALID_PREREQ_TYPES.has(rawPrereqType)) {
      errors.push({
        row: csvRow,
        field: "prereq_type",
        message: `Row ${csvRow}: Invalid prereq_type "${rawPrereqType}". Must be one of: none, all, any, choose.`,
      });
      continue;
    }

    // ── prereq_courses (required when type != none) ─────────────────────────
    const prereqCourses = splitComma(raw.prereq_courses);
    if (rawPrereqType !== "none" && prereqCourses.length === 0) {
      errors.push({
        row: csvRow,
        field: "prereq_courses",
        message: `Row ${csvRow}: prereq_type is "${rawPrereqType}" but "prereq_courses" is empty.`,
      });
      continue;
    }

    // ── Build the PrereqRule discriminated union ────────────────────────────
    let prerequisites: PrereqRule;
    if (rawPrereqType === "none") {
      prerequisites = { type: "none" };
    } else if (rawPrereqType === "all") {
      prerequisites = { type: "all", courses: prereqCourses };
    } else if (rawPrereqType === "any") {
      prerequisites = { type: "any", courses: prereqCourses };
    } else {
      // choose
      const rawCount = norm(raw.prereq_count);
      let count = 1;
      if (!rawCount) {
        warnings.push({ row: csvRow, message: `Row ${csvRow}: "prereq_count" missing for type "choose" — defaulting to 1.` });
      } else {
        const parsedCount = parseInt(rawCount, 10);
        if (isNaN(parsedCount) || parsedCount < 1) {
          warnings.push({ row: csvRow, message: `Row ${csvRow}: "prereq_count" value "${rawCount}" is not a valid positive integer — defaulting to 1.` });
        } else {
          count = parsedCount;
        }
      }
      prerequisites = { type: "choose", count, courses: prereqCourses };
    }

    // ── Optional: corequisites ──────────────────────────────────────────────
    const corequisites = splitComma(raw.corequisites);

    // ── Optional: min_grade ─────────────────────────────────────────────────
    const minGrade = norm(raw.min_grade);

    // ── Optional: terms ────────────────────────────────────────────────────
    const termsOffered: Term[] = [];
    const rawTerms = splitComma(raw.terms);
    for (const t of rawTerms) {
      if (VALID_TERMS.has(t)) {
        termsOffered.push(t as Term);
      } else {
        warnings.push({ row: csvRow, message: `Row ${csvRow}: Unknown term value "${t}" — skipped. Valid values: Fall, Spring, Summer, Winter.` });
      }
    }

    // ── Optional: description ───────────────────────────────────────────────
    const description = norm(raw.description);

    // ── Assemble Course object ──────────────────────────────────────────────
    const course: Course = {
      id: rawId,
      name: rawName,
      credits,
      prerequisites,
      corequisites,
      termsOffered,
      ...(minGrade ? { minGrade } : {}),
      ...(description ? { description } : {}),
    };

    courses.push(course);

    // ── Program grouping ────────────────────────────────────────────────────
    if (hasProgramColumn) {
      const programId = norm(raw.program);
      if (programId) {
        if (!programMap.has(programId)) {
          programMap.set(programId, []);
        }
        programMap.get(programId)!.push(rawId);
      }
    }
  }

  // ── Build programs array ─────────────────────────────────────────────────
  const allCourseIds = courses.map((c) => c.id);
  const programs: Program[] = [];

  if (hasProgramColumn && programMap.size > 0) {
    // One Program per unique program ID found in the column.
    // Courses with a blank program cell are NOT included in any program.
    for (const [programId, courseIds] of programMap.entries()) {
      programs.push({
        id: programId,
        name: programId, // User can edit the JSON later for a friendlier name
        requiredCourses: courseIds,
      });
    }
  } else {
    // No program column or all blank — create one default program
    programs.push({
      id: "PROGRAM",
      name: "Degree Program",
      requiredCourses: allCourseIds,
    });
  }

  const planFile: PlanFile = {
    department: meta.department.trim() || "Unknown Department",
    catalogYear: meta.catalogYear.trim() || new Date().getFullYear().toString(),
    courses,
    programs,
    version: "1.0",
  };

  return { planFile, errors, warnings };
}
