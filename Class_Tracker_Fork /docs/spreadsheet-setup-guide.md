# Google Sheets Setup Guide — Curriculum Tech Tree Planner

This guide walks you through creating a course catalog spreadsheet, filling it in correctly, and importing it into the Curriculum Tech Tree Planner app.

---

## Section 1 — Quick Start

Follow these five steps to go from a blank sheet to a working tech tree:

**Step 1 — Create the spreadsheet**

Open Google Sheets and create a new blank spreadsheet. Name it something descriptive, such as "CS Department — 2026 Catalog".

**Step 2 — Set up column headers**

In row 1, type the following headers exactly as shown, one per cell starting from column A:

```
id | name | credits | prereq_type | prereq_courses | prereq_count | corequisites | min_grade | terms | description | program
```

Each header must match exactly — the importer uses these names to locate data. You can optionally add comment rows above the header (any row where the first cell starts with `#`) to annotate the file; the importer will skip them.

**Step 3 — Fill in your course data**

Starting from row 2, add one course per row. Use the Column Reference in Section 2 and the CSV template file (`docs/course-catalog-template.csv`) as your guide.

**Step 4 — Export as CSV**

When your data is ready: **File → Download → Comma Separated Values (.csv)**

Save the file somewhere you can find it.

**Step 5 — Import into the app**

Open the Curriculum Tech Tree Planner → open the sidebar → click "Import Plan from CSV" → select the file you just downloaded. The app will parse your courses and build the tech tree.

---

## Section 2 — Column Reference

| Column | What it is | Valid values | If left blank | Example |
|---|---|---|---|---|
| `id` | Unique course code. Used as the primary key throughout the entire app — every cross-reference uses this exact string. | Any text without spaces. Convention: uppercase prefix + number. | **Error — required.** Row is skipped. | `CS101` |
| `name` | Full human-readable course title as it appears in the catalog. | Any text. Quotes are fine inside a CSV cell. | **Error — required.** Row is skipped. | `Introduction to Programming` |
| `credits` | Credit hours for the course. Must be a whole number (integer). | Integer ≥ 0. | **Error — required.** Row is skipped. | `3` |
| `prereq_type` | Declares the logic used to evaluate prerequisite completion. | `none`, `all`, `any`, or `choose` | **Error — required.** Use `none` for entry-level courses. | `all` |
| `prereq_courses` | The course IDs that serve as prerequisites, comma-separated. No spaces around commas. | Comma-separated list of `id` values from this same spreadsheet (or cross-listed courses). | Treated as empty list. Required when `prereq_type` is not `none`. | `CS101,CS201` |
| `prereq_count` | How many courses from `prereq_courses` the student must complete. Only meaningful when `prereq_type` is `choose`. | Positive integer ≤ number of courses in `prereq_courses`. | Ignored for all other prereq types. Defaults to 1 if missing for `choose`. | `2` |
| `corequisites` | Courses that must be taken simultaneously with this course (same semester, or already completed). Comma-separated. | Comma-separated list of `id` values. | Treated as no co-requisites. | `CS491` |
| `min_grade` | Minimum letter grade the student must earn in the prerequisite for it to count. Stored as display metadata — the app shows it but does not enforce it in the engine. | Any letter grade string: `A`, `B`, `C`, `D`. | No minimum grade shown. | `C` |
| `terms` | Academic terms in which this course is offered. Comma-separated. | `Fall`, `Spring`, `Summer`, `Winter` (case-sensitive). Any combination. | Defaults to `Fall,Spring`. | `Fall,Spring,Summer` |
| `description` | Full catalog description text. May contain commas — wrap the cell content in double quotes in the CSV, or just type freely in Google Sheets (it handles quoting automatically on export). | Any text. | No description shown in the app. | `Fundamentals of programming using Python.` |
| `program` | The degree program this course belongs to. Courses sharing the same program ID are grouped into one degree program in the tech tree. | Short identifier without spaces, e.g. `BSCS`, `MSCS`. | Course is assigned to a default unnamed program. | `BSCS` |

---

## Section 3 — Setting Up Data Validation (Dropdowns)

Adding dropdown validation to the `prereq_type` column prevents typos that would cause import errors.

**Setting up a dropdown for `prereq_type` (column D):**

1. Click the column D header to select the entire column (or select D2:D1000 to skip the header).
2. In the menu, go to **Data → Data validation**.
3. Click **Add rule**.
4. Under "Criteria", choose **Dropdown** from the list.
5. Enter the four options, one per field: `none`, `all`, `any`, `choose`.
6. Under "If the data is invalid", select **Show a warning** (this lets you keep comment rows without triggering errors).
7. Click **Done**.

**Setting up the `terms` column (column I):**

Google Sheets does not natively support multi-select checkboxes for comma-separated values in a single cell, so the terms column is free-text. However, you can add a dropdown reminder:

1. Select column I (or I2:I1000).
2. Go to **Data → Data validation → Add rule**.
3. Choose **Dropdown** and enter: `Fall`, `Spring`, `Summer`, `Winter`, `Fall,Spring`, `Fall,Spring,Summer`.
4. Set invalid data to **Show a warning** so you can still type custom combinations.
5. Click **Done**.

For courses offered in multiple terms, simply type them comma-separated into the cell: `Fall,Spring` or `Fall,Spring,Summer`. The validation warning is informational only and does not block export.

---

## Section 4 — Prerequisite Rules Cheat Sheet

Use this table to translate catalog language into the correct column values:

| Catalog language | `prereq_type` | `prereq_courses` | `prereq_count` |
|---|---|---|---|
| No prerequisites | `none` | (leave blank) | (leave blank) |
| Requires CS101 | `all` | `CS101` | (leave blank) |
| Requires CS101 AND CS201 | `all` | `CS101,CS201` | (leave blank) |
| Requires CS101 OR CS201 | `any` | `CS101,CS201` | (leave blank) |
| Complete 2 of: CS301, CS302, CS303 | `choose` | `CS301,CS302,CS303` | `2` |
| Complete any 1 of: CS301, CS302 | `choose` | `CS301,CS302` | `1` |
| Complete 3 of 5 listed courses | `choose` | `CS301,CS302,CS303,CS304,CS305` | `3` |

**The `any` vs `choose` distinction:**
- Use `any` when the catalog says "one of the following" and does not specify a count other than one.
- Use `choose` when the catalog explicitly says "complete N of the following" where N could be 1 or more. If `choose` with count 1, the behavior is identical to `any` — either spelling works.

---

## Section 5 — Exporting and Importing

**Exporting from Google Sheets:**

1. In the menu bar, go to **File → Download → Comma Separated Values (.csv)**.
2. The file downloads immediately to your default downloads folder.
3. The filename defaults to your sheet name. Rename it if you like — the app does not use the filename.

The export captures only the currently visible sheet (tab). If you have multiple tabs, export each one separately if needed.

**Importing into the Curriculum Tech Tree Planner:**

1. Open the app in your browser.
2. Open the sidebar (the panel/drawer on the left or right side of the screen).
3. Click **Import Plan from CSV** (or the equivalent import button).
4. In the file picker that appears, select the `.csv` file you just downloaded.
5. The app parses the file, resolves all prerequisite relationships, and renders the tech tree.

If the import fails, the app will show a message describing which row caused the problem and why. Fix that row in your spreadsheet, re-export, and try again.

---

## Section 6 — Tips and Gotchas

**Course ID consistency is critical.**
The `id` value in the `id` column is the exact string used everywhere else. If you write `CS101` in the `id` column but `cs101` or `CS 101` in a `prereq_courses` column, the app will not recognize the connection. Always use the same capitalization and spelling throughout the entire file.

**No spaces in course IDs.**
`CS101` is valid. `CS 101` is not. Spaces break the comma-separated parsing of the `prereq_courses` and `corequisites` columns.

**Blank rows are skipped automatically.**
The importer skips any row where the `id` cell is empty. It is safe to leave blank rows between course groups for readability.

**Rows starting with `#` are treated as comments.**
You can annotate your spreadsheet with rows like `# Entry-level courses below` by typing `#` as the very first character of that row's `id` cell. The importer skips them entirely. This is the same convention as the CSV template.

**The `program` column groups courses into degree programs.**
All courses with the same `program` value are grouped into one program node in the JSON output. Leave the column blank if you only have one degree program — all courses will be collected into a single default program automatically. If you are building a catalog with both a B.S. and an M.S. track, use two distinct `program` values (e.g. `BSCS` and `MSCS`).

**`min_grade` is display metadata, not enforced logic.**
The app shows the minimum grade requirement as a label on the node or edge. It does not affect whether the engine considers a prerequisite satisfied — the student's completion status is what drives that. If your catalog requires a C or better in CS101 before CS201, set `min_grade` to `C` and communicate that policy to students through the UI.

**Cross-department prerequisites must be included in the spreadsheet.**
If CS201 requires MATH101 as a prerequisite, and you want MATH101 to appear as a node in the tech tree, include MATH101 as its own row in the spreadsheet. If you only want it to appear as a dependency reference without a full course node, that is not currently supported — include the full row. Cross-listed courses from other departments work best when given the same `program` ID as your main degree, or left without a program ID so they appear in the default group.

**Corequisite pairs must be declared in both directions.**
If CS490 and CS491 must be taken simultaneously, set `corequisites` to `CS491` on the CS490 row AND `corequisites` to `CS490` on the CS491 row. The engine deduplicates the bidirectional declaration automatically — you will not see double edges.

**The `prereq_count` column is only read for `choose` type.**
For `none`, `all`, and `any`, the value in `prereq_count` is ignored regardless of what you put there. You can leave it blank for those rows.

**Large descriptions with commas.**
In Google Sheets, if you type a description that contains commas, Sheets handles the quoting automatically when you export to CSV — the description will be wrapped in double quotes in the exported file. You do not need to do anything special. If you are editing the raw CSV file in a text editor, wrap any field containing commas in double quotes yourself.
