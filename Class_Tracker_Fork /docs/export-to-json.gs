/**
 * export-to-json.gs
 *
 * Google Apps Script — Curriculum Tech Tree Planner exporter.
 *
 * Reads a course catalog Google Sheet and exports it as a PlanFile JSON
 * that can be imported directly into the Curriculum Tech Tree Planner app.
 *
 * The output structure matches the PlanFile schema exactly:
 *   {
 *     version: "1.0",
 *     department: string,
 *     catalogYear: string,
 *     courses: Course[],
 *     programs: Program[]
 *   }
 *
 * HOW TO INSTALL:
 * 1. Open your Google Sheet containing your course catalog data.
 * 2. In the menu bar, go to Extensions → Apps Script.
 * 3. Delete any placeholder code in the editor that appears.
 * 4. Paste this entire file into the editor.
 * 5. Save (Ctrl+S or Cmd+S). Name the project anything you like.
 * 6. Close the Apps Script tab and reload your Google Sheet.
 * 7. A new "Export" menu will appear in the sheet's menu bar.
 * 8. Click Export → Download Plan JSON to run the exporter.
 *
 * NOTE: The first time you run the script, Google will ask you to authorize
 * it. Click "Review Permissions", choose your Google account, and click
 * "Allow". This grants the script access to read your spreadsheet and create
 * a temporary file in your Google Drive for download.
 *
 * EXPECTED COLUMN ORDER (row 1 must be the header row):
 *   A: id
 *   B: name
 *   C: credits
 *   D: prereq_type
 *   E: prereq_courses
 *   F: prereq_count
 *   G: corequisites
 *   H: min_grade
 *   I: terms
 *   J: description
 *   K: program
 *
 * Rows starting with # in column A are treated as comments and skipped.
 * Rows where column A is empty are also skipped.
 */

// ---------------------------------------------------------------------------
// Column index constants (0-based, matching the header row order)
// ---------------------------------------------------------------------------

const COL_ID           = 0;
const COL_NAME         = 1;
const COL_CREDITS      = 2;
const COL_PREREQ_TYPE  = 3;
const COL_PREREQ_COURSES = 4;
const COL_PREREQ_COUNT = 5;
const COL_COREQUISITES = 6;
const COL_MIN_GRADE    = 7;
const COL_TERMS        = 8;
const COL_DESCRIPTION  = 9;
const COL_PROGRAM      = 10;

// Valid term values accepted by the PlanFile schema.
const VALID_TERMS = new Set(["Fall", "Spring", "Summer", "Winter"]);

// Default terms applied when the terms column is blank.
const DEFAULT_TERMS = ["Fall", "Spring"];

// ---------------------------------------------------------------------------
// Menu setup — runs automatically when the spreadsheet opens
// ---------------------------------------------------------------------------

/**
 * Creates the "Export" menu in the Google Sheets UI.
 * This function runs automatically when the sheet is opened.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Export")
    .addItem("Download Plan JSON", "exportPlanJson")
    .addToUi();
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

/**
 * Entry point called when the user clicks Export → Download Plan JSON.
 *
 * Flow:
 *   1. Prompt for department name and catalog year.
 *   2. Read all rows from the active sheet.
 *   3. Parse each row into a Course object.
 *   4. Group courses by the program column to build Program objects.
 *   5. Serialize to JSON and offer a download via Google Drive.
 */
function exportPlanJson() {
  const ui = SpreadsheetApp.getUi();

  // --- Step 1: Collect metadata from the user ---
  const deptResponse = ui.prompt(
    "Export Plan JSON — Step 1 of 2",
    "Enter the department name (e.g. Computer Science):",
    ui.ButtonSet.OK_CANCEL
  );

  if (deptResponse.getSelectedButton() !== ui.Button.OK) {
    return; // User cancelled
  }

  const department = deptResponse.getResponseText().trim();
  if (!department) {
    ui.alert("Export cancelled: Department name cannot be blank.");
    return;
  }

  const yearResponse = ui.prompt(
    "Export Plan JSON — Step 2 of 2",
    "Enter the catalog year (e.g. 2026):",
    ui.ButtonSet.OK_CANCEL
  );

  if (yearResponse.getSelectedButton() !== ui.Button.OK) {
    return; // User cancelled
  }

  const catalogYear = yearResponse.getResponseText().trim();
  if (!catalogYear) {
    ui.alert("Export cancelled: Catalog year cannot be blank.");
    return;
  }

  // --- Step 2: Read sheet data ---
  const sheet = SpreadsheetApp.getActiveSheet();
  const allValues = sheet.getDataRange().getValues();

  if (allValues.length < 2) {
    ui.alert("Export failed: The sheet has no data rows (only a header row or is empty).");
    return;
  }

  // --- Step 3: Parse rows into courses ---
  const parseResult = parseAllRows(allValues);

  if (parseResult.errors.length > 0 && parseResult.courses.length === 0) {
    // All rows failed — show the first few errors and abort
    const errorSample = parseResult.errors.slice(0, 5).join("\n");
    ui.alert(
      "Export failed: No valid courses found.\n\n" +
      "First errors encountered:\n" + errorSample
    );
    return;
  }

  // --- Step 4: Build programs from the course list ---
  const programs = buildPrograms(parseResult.courses);

  // --- Step 5: Assemble the PlanFile object ---
  const planFile = {
    version: "1.0",
    department: department,
    catalogYear: catalogYear,
    courses: parseResult.courses.map(function(c) { return c.course; }),
    programs: programs
  };

  // --- Step 6: Serialize and offer download ---
  const jsonString = JSON.stringify(planFile, null, 2);
  const filename = sanitizeFilename(department) + "-" + catalogYear + ".json";

  try {
    triggerDownload(jsonString, filename);

    // Build a summary message for the user
    let summary = "Export complete.\n\n" +
      parseResult.courses.length + " course(s) exported.\n" +
      programs.length + " program(s) created.\n\n" +
      "File saved to your Google Drive: " + filename + "\n" +
      "A download link has been shown in a new tab.";

    if (parseResult.errors.length > 0) {
      summary += "\n\nWarning: " + parseResult.errors.length + " row(s) were skipped due to errors:\n";
      summary += parseResult.errors.slice(0, 10).join("\n");
      if (parseResult.errors.length > 10) {
        summary += "\n... and " + (parseResult.errors.length - 10) + " more.";
      }
    }

    ui.alert(summary);

  } catch (err) {
    ui.alert(
      "Export failed while creating the download file.\n\n" +
      "Error: " + err.message + "\n\n" +
      "Make sure the script has permission to access Google Drive " +
      "(Extensions → Apps Script → Run → Authorize)."
    );
  }
}

// ---------------------------------------------------------------------------
// Row parsing
// ---------------------------------------------------------------------------

/**
 * Parses all rows from the sheet data into Course objects.
 *
 * The first row is always the header row and is skipped.
 * Rows where column A is empty or starts with '#' are skipped silently.
 * Rows with structural errors (missing required fields, invalid types) are
 * collected in the errors array and skipped — they do not abort the export.
 *
 * @param {Array<Array<*>>} allValues - Raw values from sheet.getDataRange().getValues()
 * @returns {{ courses: Array<{course: Object, programId: string}>, errors: string[] }}
 */
function parseAllRows(allValues) {
  const courses = [];
  const errors = [];

  // Skip row 0 (header). Start from row index 1.
  for (let rowIndex = 1; rowIndex < allValues.length; rowIndex++) {
    const row = allValues[rowIndex];
    const humanRowNum = rowIndex + 1; // 1-based for user-facing messages

    // Read column A as the course ID
    const rawId = String(row[COL_ID] || "").trim();

    // Skip blank rows and comment rows silently
    if (!rawId || rawId.startsWith("#")) {
      continue;
    }

    try {
      const parsed = parseRow(row, humanRowNum);
      courses.push(parsed);
    } catch (err) {
      errors.push("Row " + humanRowNum + " (" + rawId + "): " + err.message);
    }
  }

  return { courses: courses, errors: errors };
}

/**
 * Parses a single data row into a Course object and extracts its program ID.
 *
 * @param {Array<*>} row - A single row of cell values.
 * @param {number} rowNum - 1-based row number, used for error messages.
 * @returns {{ course: Object, programId: string }}
 * @throws {Error} If any required field is missing or invalid.
 */
function parseRow(row, rowNum) {
  // Helper to safely read a cell as a trimmed string
  function cellStr(colIndex) {
    return String(row[colIndex] || "").trim();
  }

  // --- Required fields ---
  const id = cellStr(COL_ID);
  if (!id) {
    throw new Error("id is required and cannot be blank.");
  }
  if (/\s/.test(id)) {
    throw new Error('id "' + id + '" contains whitespace. Course IDs must not have spaces.');
  }

  const name = cellStr(COL_NAME);
  if (!name) {
    throw new Error('name is required for course "' + id + '".');
  }

  const creditsRaw = row[COL_CREDITS];
  const credits = parseInt(creditsRaw, 10);
  if (isNaN(credits) || credits < 0) {
    throw new Error(
      'credits for "' + id + '" must be a non-negative integer (got "' + creditsRaw + '").'
    );
  }

  // --- Prerequisite rule ---
  const prereqType = cellStr(COL_PREREQ_TYPE).toLowerCase();
  const validPrereqTypes = ["none", "all", "any", "choose"];
  if (!validPrereqTypes.includes(prereqType)) {
    throw new Error(
      'prereq_type for "' + id + '" must be one of: none, all, any, choose (got "' + prereqType + '").'
    );
  }

  const prerequisites = buildPrereqRule(id, prereqType, row);

  // --- Co-requisites ---
  const corequisites = splitIds(cellStr(COL_COREQUISITES));

  // --- Optional fields ---
  const minGradeRaw = cellStr(COL_MIN_GRADE);
  const minGrade = minGradeRaw || undefined;

  const termsOffered = parseTerms(cellStr(COL_TERMS));

  const descriptionRaw = cellStr(COL_DESCRIPTION);
  const description = descriptionRaw || undefined;

  const programId = cellStr(COL_PROGRAM) || "";

  // --- Assemble the Course object matching the PlanFile schema ---
  const course = {
    id: id,
    name: name,
    credits: credits,
    prerequisites: prerequisites,
    corequisites: corequisites,
    termsOffered: termsOffered
  };

  // Only include optional fields when they have values (keeps JSON clean)
  if (minGrade !== undefined) {
    course.minGrade = minGrade;
  }
  if (description !== undefined) {
    course.description = description;
  }

  return { course: course, programId: programId };
}

// ---------------------------------------------------------------------------
// Prerequisite rule builder
// ---------------------------------------------------------------------------

/**
 * Builds the correct PrereqRule object from the parsed prereq_type and
 * prereq_courses/prereq_count cells.
 *
 * Schema produced:
 *   none   → { type: "none" }
 *   all    → { type: "all",    courses: string[] }
 *   any    → { type: "any",    courses: string[] }
 *   choose → { type: "choose", courses: string[], count: number }
 *
 * @param {string} courseId - ID of the course being parsed (for error messages).
 * @param {string} prereqType - Normalized prereq_type value.
 * @param {Array<*>} row - Full row values array.
 * @returns {Object} A PrereqRule object.
 * @throws {Error} If a required field for the given type is missing.
 */
function buildPrereqRule(courseId, prereqType, row) {
  if (prereqType === "none") {
    return { type: "none" };
  }

  // All non-none types require at least one course ID
  const coursesRaw = String(row[COL_PREREQ_COURSES] || "").trim();
  const courses = splitIds(coursesRaw);

  if (courses.length === 0) {
    throw new Error(
      'prereq_courses is required for prereq_type "' + prereqType + '" on course "' + courseId + '".'
    );
  }

  if (prereqType === "all") {
    return { type: "all", courses: courses };
  }

  if (prereqType === "any") {
    return { type: "any", courses: courses };
  }

  // prereqType === "choose"
  const countRaw = row[COL_PREREQ_COUNT];
  const count = parseInt(countRaw, 10);

  if (isNaN(count) || count < 1) {
    // Graceful fallback: if count is missing or invalid, default to 1
    // and emit a warning rather than failing the whole row.
    Logger.log(
      'Warning: prereq_count for "' + courseId + '" is missing or invalid ' +
      '(got "' + countRaw + '"). Defaulting to 1.'
    );
    return { type: "choose", count: 1, courses: courses };
  }

  if (count > courses.length) {
    throw new Error(
      'prereq_count (' + count + ') for "' + courseId + '" is greater than ' +
      'the number of courses listed in prereq_courses (' + courses.length + ').'
    );
  }

  return { type: "choose", count: count, courses: courses };
}

// ---------------------------------------------------------------------------
// Program builder
// ---------------------------------------------------------------------------

/**
 * Groups parsed course rows by their programId and constructs Program objects.
 *
 * Courses with a blank programId are assigned to a default "DEFAULT" program.
 * Each program lists all its course IDs in requiredCourses (in the order they
 * appeared in the sheet).
 *
 * @param {Array<{course: Object, programId: string}>} parsedCourses
 * @returns {Array<Object>} Array of Program objects matching the PlanFile schema.
 */
function buildPrograms(parsedCourses) {
  // Use a Map to preserve insertion order and group by programId
  const programMap = new Map();

  for (const parsed of parsedCourses) {
    const rawId = parsed.programId.trim();

    // Courses with no program column go into a generic default program
    const effectiveId = rawId || "DEFAULT";
    const effectiveName = rawId
      ? "B.S. " + rawId  // e.g. "B.S. BSCS" — user can rename in the JSON after export
      : "Default Program";

    if (!programMap.has(effectiveId)) {
      programMap.set(effectiveId, {
        id: effectiveId,
        name: effectiveName,
        requiredCourses: []
      });
    }

    programMap.get(effectiveId).requiredCourses.push(parsed.course.id);
  }

  return Array.from(programMap.values());
}

// ---------------------------------------------------------------------------
// Download mechanism
// ---------------------------------------------------------------------------

/**
 * Creates a JSON file in Google Drive and displays a download link to the user
 * via an HTML dialog.
 *
 * Google Apps Script cannot trigger a direct browser download (it runs
 * server-side), so the standard approach is:
 *   1. Create the file in Google Drive.
 *   2. Show the user a link they can click to download it.
 *   3. Optionally delete the Drive file afterward.
 *
 * The file is created as application/json and set to anyone-with-link readable
 * temporarily so the download dialog can serve it.
 *
 * @param {string} jsonString - Serialized JSON content.
 * @param {string} filename - Desired filename for the download.
 */
function triggerDownload(jsonString, filename) {
  // Create a Blob with the JSON content
  const blob = Utilities.newBlob(jsonString, "application/json", filename);

  // Save to Drive so we can generate a download URL
  const file = DriveApp.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const downloadUrl = "https://drive.google.com/uc?export=download&id=" + file.getId();

  // Show a small HTML dialog with the download link
  const htmlContent =
    '<html><body style="font-family:sans-serif;padding:20px;">' +
    '<h3 style="margin-top:0">Your plan file is ready</h3>' +
    '<p>Click the link below to download your JSON file:</p>' +
    '<p><a href="' + downloadUrl + '" target="_blank" ' +
    'style="font-size:16px;color:#1a73e8;">' + filename + '</a></p>' +
    '<p style="color:#666;font-size:13px;">' +
    'The file has also been saved to your Google Drive root folder.<br>' +
    'You can delete it from Drive after downloading.' +
    '</p>' +
    '<p><button onclick="google.script.host.close()" ' +
    'style="padding:8px 16px;cursor:pointer;">Close</button></p>' +
    '</body></html>';

  const htmlOutput = HtmlService
    .createHtmlOutput(htmlContent)
    .setWidth(420)
    .setHeight(250);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Download Plan JSON");
}

// ---------------------------------------------------------------------------
// Parsing utilities
// ---------------------------------------------------------------------------

/**
 * Splits a comma-separated string of course IDs into a trimmed, non-empty array.
 * Filters out any empty segments that result from trailing commas or double commas.
 *
 * @param {string} raw - Raw comma-separated string from a cell.
 * @returns {string[]} Array of course ID strings.
 */
function splitIds(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map(function(s) { return s.trim(); })
    .filter(function(s) { return s.length > 0; });
}

/**
 * Parses a comma-separated terms string into an array of validated Term values.
 *
 * Valid values are: Fall, Spring, Summer, Winter (case-sensitive per the schema).
 * Invalid term strings are silently dropped. If the result is empty (blank input
 * or all invalid), the default ["Fall", "Spring"] is returned.
 *
 * @param {string} raw - Raw comma-separated string from the terms cell.
 * @returns {string[]} Array of Term strings.
 */
function parseTerms(raw) {
  if (!raw) return DEFAULT_TERMS.slice();

  const parsed = raw
    .split(",")
    .map(function(s) { return s.trim(); })
    .filter(function(s) { return VALID_TERMS.has(s); });

  return parsed.length > 0 ? parsed : DEFAULT_TERMS.slice();
}

/**
 * Converts a department name into a safe filename component.
 * Replaces spaces and special characters with hyphens and lowercases everything.
 *
 * @param {string} name - Raw department name from user input.
 * @returns {string} Filename-safe string.
 */
function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")  // Replace any run of non-alphanumeric chars with a hyphen
    .replace(/^-+|-+$/g, "");     // Strip leading/trailing hyphens
}
