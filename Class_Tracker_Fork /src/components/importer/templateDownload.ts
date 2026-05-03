/**
 * templateDownload.ts
 *
 * Generates and triggers a browser download of the course catalog CSV template.
 * No React dependencies — pure DOM + string manipulation.
 *
 * Template structure:
 *  - 3 comment rows (lines starting with #)
 *  - 1 header row
 *  - 6 example data rows, one per prereq_type variant
 */

/** Column order matches the CSV spec exactly */
const HEADERS = [
  "id",
  "name",
  "credits",
  "prereq_type",
  "prereq_courses",
  "prereq_count",
  "corequisites",
  "min_grade",
  "terms",
  "description",
  "program",
] as const;

/** Wrap a value in quotes and escape any internal quotes (RFC 4180). */
function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  // Always quote to handle commas, newlines, and leading/trailing spaces safely.
  return `"${escaped}"`;
}

/** Build a single CSV row from an ordered array of cell values. */
function csvRow(cells: string[]): string {
  return cells.map(csvCell).join(",");
}

// ---------------------------------------------------------------------------
// Example rows — each demonstrates a distinct prereq_type
// ---------------------------------------------------------------------------

type TemplateRow = {
  id: string;
  name: string;
  credits: string;
  prereq_type: string;
  prereq_courses: string;
  prereq_count: string;
  corequisites: string;
  min_grade: string;
  terms: string;
  description: string;
  program: string;
};

const EXAMPLE_ROWS: TemplateRow[] = [
  {
    id: "CS101",
    name: "Introduction to Computer Science",
    credits: "3",
    prereq_type: "none",
    prereq_courses: "",
    prereq_count: "",
    corequisites: "",
    min_grade: "",
    terms: "Fall,Spring",
    description: "Entry-level overview of computational thinking and programming.",
    program: "BSCS",
  },
  {
    id: "CS201",
    name: "Data Structures",
    credits: "3",
    prereq_type: "all",
    prereq_courses: "CS101",
    prereq_count: "",
    corequisites: "",
    min_grade: "C",
    terms: "Fall,Spring",
    description: "Arrays, linked lists, trees, and graphs.",
    program: "BSCS",
  },
  {
    id: "CS301",
    name: "Algorithms",
    credits: "3",
    prereq_type: "all",
    prereq_courses: "CS201,MATH201",
    prereq_count: "",
    corequisites: "",
    min_grade: "C",
    terms: "Fall",
    description: "Algorithm design, analysis, and correctness proofs.",
    program: "BSCS",
  },
  {
    id: "CS310",
    name: "Theory of Computation",
    credits: "3",
    prereq_type: "any",
    prereq_courses: "CS201,CS301",
    prereq_count: "",
    corequisites: "",
    min_grade: "",
    terms: "Spring",
    description: "Automata, formal languages, and computability.",
    program: "BSCS",
  },
  {
    id: "CS401",
    name: "Advanced Topics Seminar",
    credits: "3",
    prereq_type: "choose",
    prereq_courses: "CS301,CS310,CS350",
    prereq_count: "2",
    corequisites: "",
    min_grade: "",
    terms: "Fall,Spring",
    description: "Rotating advanced topics — complete any 2 of 3 prerequisites.",
    program: "BSCS",
  },
  {
    id: "CS350",
    name: "Operating Systems",
    credits: "4",
    prereq_type: "all",
    prereq_courses: "CS201",
    prereq_count: "",
    corequisites: "CS360",
    min_grade: "C",
    terms: "Fall",
    description: "Processes, memory management, file systems, and concurrency.",
    program: "BSCS",
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate the template CSV content as a string and trigger a browser download.
 * The filename is `course-catalog-template.csv`.
 */
export function downloadCsvTemplate(): void {
  const lines: string[] = [
    // Comment rows explaining the format
    "# Course Catalog CSV Template — Curriculum Tech Tree Planner",
    "# Fill in one course per row. Rows starting with # are ignored.",
    "# prereq_type must be: none | all | any | choose",
    "# prereq_courses / corequisites: comma-separated course IDs (no spaces around commas)",
    "# terms: comma-separated from Fall,Spring,Summer,Winter",
    "# program: courses with the same program value are grouped into one Program block",
    "#",
    // Header row
    csvRow([...HEADERS]),
    // Example rows
    ...EXAMPLE_ROWS.map((row) =>
      csvRow(HEADERS.map((h) => row[h]))
    ),
  ];

  const csvContent = lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "course-catalog-template.csv";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Release the object URL on the next tick to allow the download to start
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
