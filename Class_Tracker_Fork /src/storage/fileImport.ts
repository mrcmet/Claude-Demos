/**
 * fileImport.ts
 *
 * Async functions for importing PlanFile and StudentData from JSON files
 * selected by the user through the browser's file picker.
 *
 * Design decisions:
 * - Errors thrown here are intended to be caught by the calling hook and
 *   surfaced to the user as-is. Messages are human-readable, not technical.
 * - Validation is structural (required fields present and typed correctly)
 *   but tolerant of optional/unknown fields — this allows plan files to
 *   add new optional fields without breaking older app versions.
 * - File reading is done with the FileReader API via a Promise wrapper so
 *   it fits naturally in async/await hooks.
 * - Maximum file size is enforced (10 MB) to prevent accidental large file
 *   uploads from hanging the browser's JSON parser.
 */

import type { PlanFile, Course, Program, StudentData } from "../types";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Reads a File object, parses its contents as JSON, and validates it as a
 * PlanFile. Throws with a human-readable message on any failure.
 *
 * @param file - A File selected from an <input type="file">.
 * @returns    - Validated PlanFile.
 * @throws     - String describing what went wrong (suitable for display).
 */
export async function importPlanFile(file: File): Promise<PlanFile> {
  const raw = await readFileAsText(file);
  const parsed = parseJSON(raw, file.name);
  return validatePlanFile(parsed, file.name);
}

/**
 * Reads a File object, parses its contents as JSON, and validates it as a
 * StudentData export. Throws with a human-readable message on any failure.
 *
 * @param file - A File selected from an <input type="file">.
 * @returns    - Validated StudentData.
 * @throws     - String describing what went wrong (suitable for display).
 */
export async function importStudentFile(file: File): Promise<StudentData> {
  const raw = await readFileAsText(file);
  const parsed = parseJSON(raw, file.name);
  return validateStudentData(parsed, file.name);
}

// ---------------------------------------------------------------------------
// File reading
// ---------------------------------------------------------------------------

function readFileAsText(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    return Promise.reject(
      new Error(
        `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). ` +
          `Maximum allowed size is 10 MB.`
      )
    );
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error(`Failed to read "${file.name}" as text.`));
      }
    };
    reader.onerror = () => {
      reject(new Error(`Could not read file "${file.name}". The file may be inaccessible.`));
    };
    reader.readAsText(file, "utf-8");
  });
}

// ---------------------------------------------------------------------------
// JSON parsing
// ---------------------------------------------------------------------------

function parseJSON(text: string, fileName: string): unknown {
  try {
    return JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`"${fileName}" is not valid JSON: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// PlanFile validation
// ---------------------------------------------------------------------------

function validatePlanFile(raw: unknown, fileName: string): PlanFile {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`"${fileName}" must be a JSON object.`);
  }

  const r = raw as Record<string, unknown>;

  if (r["version"] !== "1.0") {
    throw new Error(
      `"${fileName}" has unsupported version "${String(r["version"])}". Expected "1.0".`
    );
  }

  requireString(r, "department", fileName);
  requireString(r, "catalogYear", fileName);

  if (!Array.isArray(r["courses"])) {
    throw new Error(`"${fileName}" is missing a "courses" array.`);
  }

  if (!Array.isArray(r["programs"])) {
    throw new Error(`"${fileName}" is missing a "programs" array.`);
  }

  const courses: Course[] = (r["courses"] as unknown[]).map((c, i) =>
    validateCourse(c, `courses[${i}]`, fileName)
  );

  const programs: Program[] = (r["programs"] as unknown[]).map((p, i) =>
    validateProgram(p, `programs[${i}]`, fileName)
  );

  return {
    department: r["department"] as string,
    catalogYear: r["catalogYear"] as string,
    courses,
    programs,
    version: "1.0",
  };
}

function validateCourse(raw: unknown, path: string, fileName: string): Course {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`"${fileName}" — ${path} must be an object.`);
  }

  const r = raw as Record<string, unknown>;

  requireString(r, "id", fileName, path);
  requireString(r, "name", fileName, path);
  requireNumber(r, "credits", fileName, path);

  // prerequisites — required, but we are tolerant of missing optional sub-fields.
  if (r["prerequisites"] === undefined || r["prerequisites"] === null) {
    throw new Error(
      `"${fileName}" — ${path}.prerequisites is required. ` +
        `Use { "type": "none" } for courses with no prerequisites.`
    );
  }

  validatePrereqRule(r["prerequisites"], `${path}.prerequisites`, fileName);

  if (!Array.isArray(r["corequisites"])) {
    throw new Error(
      `"${fileName}" — ${path}.corequisites must be an array (use [] for none).`
    );
  }

  if (!Array.isArray(r["termsOffered"])) {
    throw new Error(
      `"${fileName}" — ${path}.termsOffered must be an array (e.g. ["Fall","Spring"]).`
    );
  }

  return {
    id: r["id"] as string,
    name: r["name"] as string,
    credits: r["credits"] as number,
    prerequisites: r["prerequisites"] as Course["prerequisites"],
    corequisites: r["corequisites"] as string[],
    minGrade: typeof r["minGrade"] === "string" ? r["minGrade"] : undefined,
    termsOffered: r["termsOffered"] as Course["termsOffered"],
    description:
      typeof r["description"] === "string" ? r["description"] : undefined,
  };
}

function validatePrereqRule(raw: unknown, path: string, fileName: string): void {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`"${fileName}" — ${path} must be an object.`);
  }

  const r = raw as Record<string, unknown>;

  if (typeof r["type"] !== "string") {
    throw new Error(`"${fileName}" — ${path}.type must be a string.`);
  }

  const validTypes = ["none", "all", "any", "choose"];
  if (!validTypes.includes(r["type"])) {
    throw new Error(
      `"${fileName}" — ${path}.type "${r["type"]}" is not valid. ` +
        `Expected one of: ${validTypes.join(", ")}.`
    );
  }

  if (r["type"] !== "none" && !Array.isArray(r["courses"])) {
    throw new Error(
      `"${fileName}" — ${path}.courses must be an array for type "${r["type"]}".`
    );
  }

  if (r["type"] === "choose" && typeof r["count"] !== "number") {
    throw new Error(
      `"${fileName}" — ${path}.count must be a number for type "choose".`
    );
  }
}

function validateProgram(raw: unknown, path: string, fileName: string): Program {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`"${fileName}" — ${path} must be an object.`);
  }

  const r = raw as Record<string, unknown>;

  requireString(r, "id", fileName, path);
  requireString(r, "name", fileName, path);

  if (!Array.isArray(r["requiredCourses"])) {
    throw new Error(`"${fileName}" — ${path}.requiredCourses must be an array.`);
  }

  return {
    id: r["id"] as string,
    name: r["name"] as string,
    requiredCourses: r["requiredCourses"] as string[],
    electiveSets: Array.isArray(r["electiveSets"])
      ? (r["electiveSets"] as Program["electiveSets"])
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// StudentData validation
// ---------------------------------------------------------------------------

function validateStudentData(raw: unknown, fileName: string): StudentData {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`"${fileName}" must be a JSON object.`);
  }

  const r = raw as Record<string, unknown>;

  if (r["version"] !== "1.0") {
    throw new Error(
      `"${fileName}" has unsupported version "${String(r["version"])}". Expected "1.0".`
    );
  }

  requireString(r, "name", fileName);
  requireString(r, "catalogYear", fileName);

  if (!Array.isArray(r["completedCourses"])) {
    throw new Error(`"${fileName}" is missing a "completedCourses" array.`);
  }

  if (!Array.isArray(r["inProgressCourses"])) {
    throw new Error(`"${fileName}" is missing an "inProgressCourses" array.`);
  }

  const selectedProgram = r["selectedProgram"];
  if (selectedProgram !== null && selectedProgram !== undefined && typeof selectedProgram !== "string") {
    throw new Error(`"${fileName}" — selectedProgram must be a string or null.`);
  }

  return {
    name: r["name"] as string,
    selectedProgram: (selectedProgram ?? null) as string | null,
    catalogYear: r["catalogYear"] as string,
    completedCourses: r["completedCourses"] as string[],
    inProgressCourses: r["inProgressCourses"] as string[],
    gpaData:
      r["gpaData"] !== undefined &&
      typeof r["gpaData"] === "object" &&
      r["gpaData"] !== null &&
      !Array.isArray(r["gpaData"])
        ? (r["gpaData"] as Record<string, string>)
        : undefined,
    exportedAt:
      typeof r["exportedAt"] === "string" ? r["exportedAt"] : undefined,
    version: "1.0",
  };
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function requireString(
  record: Record<string, unknown>,
  key: string,
  fileName: string,
  path?: string
): void {
  const prefix = path ? `${path}.` : "";
  if (typeof record[key] !== "string") {
    throw new Error(
      `"${fileName}" — ${prefix}${key} must be a string (got ${typeof record[key]}).`
    );
  }
}

function requireNumber(
  record: Record<string, unknown>,
  key: string,
  fileName: string,
  path?: string
): void {
  const prefix = path ? `${path}.` : "";
  if (typeof record[key] !== "number") {
    throw new Error(
      `"${fileName}" — ${prefix}${key} must be a number (got ${typeof record[key]}).`
    );
  }
}
