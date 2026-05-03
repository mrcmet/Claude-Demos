# University Course Prerequisite Parsing Research

> Comprehensive research on prerequisite text patterns, parsing strategies, existing tools, spreadsheet design, and Google Sheets integration. Last updated: 2026-03-14

## Table of Contents

1. [Common Prerequisite Text Patterns](#common-prerequisite-text-patterns)
2. [Regex and Parsing Strategies](#regex-and-parsing-strategies)
3. [Existing Open-Source Tools](#existing-open-source-tools)
4. [Spreadsheet Column Design](#spreadsheet-column-design)
5. [Google Sheets Approaches](#google-sheets-approaches)
6. [Key Lessons from University Systems](#key-lessons-from-university-systems)
7. [Recommended Implementation Strategy](#recommended-implementation-strategy)

---

## Common Prerequisite Text Patterns

Universities express prerequisite requirements in widely varying text patterns. Understanding these patterns is essential for designing a parser. Below are the most commonly encountered formats found across university catalogs:

### Basic Single Course Prerequisites

```
MATH 101
CS 205
BIO 150
```

**Pattern:** `[DEPARTMENT] [NUMBER]`
- Department code is typically 2-4 uppercase letters
- Course number is typically 3-4 digits
- May include optional letter suffix (e.g., "CS 101A")

### Course with Grade Requirements

```
MATH 101 (C or better)
MATH 101 (C-)
MAC 2311(B)
CS 205 (D minimum)
CS 101 with a minimum grade of C
```

**Variations:**
- Grade in parentheses immediately after course code
- "or better" phrase
- "minimum grade of X" phrasing
- Grade requirements use D-, C-, C, C+, B-, B, B+, A-, A notation

### Multiple Courses with AND Logic

```
MATH 101 and MATH 102
CS 201 and CS 202 and MATH 301
CS 101 AND ENG 201
```

**Variations:**
- "and" keyword (case-insensitive, sometimes styled as "AND" or "&")
- Separator may be "and" or comma-separated
- Multiple courses in sequence

### Multiple Courses with OR Logic

```
MATH 101 or MATH 102
CS 301 or CS 302 or CS 303
(CS 201 or CS 202) and MATH 301
```

**Variations:**
- "or" keyword (case-insensitive, sometimes "OR" or "/")
- Can be mixed with AND logic using parentheses for precedence

### "N of the Following" Patterns

```
Complete 2 of: CS301, CS302, CS303
2 of the following: MATH 201, MATH 202, MATH 203, MATH 204
Choose 3 from: ENG 101, ENG 102, ENG 201, ENG 202
Any 2 of: BIO 201, BIO 202, BIO 203
```

**Variations:**
- Explicit "N of the following" phrasing
- "Choose N from:" format
- Courses listed after colon or on subsequent lines
- May be phrased as "Any N of:" or "Complete N of:"

### Compound/Nested Boolean Logic

```
(CS201 or CS202) and MATH301
(MATH 101 or MATH 102) and (CHEM 201 or CHEM 202)
CS201 and (MATH 301 or MATH 302)
(CS 101 and CS 102) or (CS 105)
```

**Considerations:**
- Parentheses establish precedence
- Generally AND has higher precedence than OR in educational contexts
- Multiple levels of nesting can occur

### Faculty/Instructor Permission

```
MATH 101 or instructor consent
CS 205 or faculty permission
Equivalent course or department permission
CS 201 and (CS 202 or instructor approval)
```

**Variations:**
- "instructor consent" / "faculty permission" / "department approval"
- Often combined with other prerequisites using OR logic

### Concurrent/Corequisite Prerequisites

```
MATH 101 (concurrent or prerequisite)
CS 201 concurrent with CS 202
MATH 101 AND (MATH 102 concurrent)
```

**Note:** Concurrent prerequisites differ from strict prerequisites—they can be taken at the same time as the course. Some systems treat these differently.

### Minimum GPA or Performance Requirements

```
Admission to Engineering program and minimum 2.5 GPA
Prerequisites: CS 101, CS 102; minimum GPA: 2.0
```

**Note:** These are less common in individual course prerequisites but appear in prerequisite descriptions.

### Admission/Status Requirements

```
Admission to Computer Science program
Junior standing or above
Business major or permission
```

### Real-World Complex Example

From California State University, Chico:
```
Prerequisite: GE English Composition (1A), GE Critical Thinking (1B), GE Oral Communication (1C), GE Mathematical Concepts/Quantitative Reasoning (2); or faculty permission.
```

This combines:
- Multiple AND-connected courses
- Grouped course requirements (GE categories)
- Alternative path via faculty permission

---

## Regex and Parsing Strategies

### Course Code Extraction Patterns

**Basic Course Code Regex:**
```regex
\b([A-Z]{2,4}\s+\d{3,4}[A-Z]?)\b
```

**Explanation:**
- `\b` - word boundary
- `[A-Z]{2,4}` - department code (2-4 uppercase letters)
- `\s+` - one or more whitespace characters
- `\d{3,4}` - course number (3-4 digits)
- `[A-Z]?` - optional letter suffix (for courses like "CS 101A")

**Variations to consider:**
```regex
# Allow different spacing
([A-Z]{2,4})\s*(\d{3,4}[A-Z]?)

# More restrictive (4-char dept codes are less common than 2-3)
([A-Z]{2,3})\s+(\d{3,4}[A-Z]?)

# Capture groups separately
([A-Z]+)\s*(\d+)
```

### Grade Requirement Extraction

**Grade Pattern in Parentheses:**
```regex
(?:GRADE|grade|G)?\s*(?:of\s+)?([ABCDF][+-]?|-)\b
```

**Common Grade Formats:**
- `A, A-, A+`
- `B, B-, B+`
- `C, C-, C+`
- `D, D-`
- `F`

**Grade in Parentheses after Course:**
```regex
(\w+\s+\d+)\s*\(([A-F][+-]?|[A-F]-)\)
```

### Boolean Operator Detection

**AND Logic Patterns:**
```regex
\band\b
&(?!&)
,(?=\s*[A-Z]+\s+\d)
```

**OR Logic Patterns:**
```regex
\bor\b
/(?!\/)
;(?=\s*[A-Z]+\s+\d)
```

### "N of the Following" Pattern

```regex
(?:choose|complete|any|select|either)\s+(\d+)\s+(?:of\s+)?(?:the\s+)?(?:following|these):\s*(.+?)(?=\n|$)
```

Or with less strict matching:
```regex
(\d+)\s+of\s*:\s*(.+)
```

### Parentheses/Grouping Detection

```regex
\(([^)]+)\)
```

**Recursive parsing:** For nested parentheses, simple regex becomes insufficient. Consider:
- Stack-based parsing
- Recursive descent parsing
- Using a proper expression parser library

### Florida Common Prerequisites Format

According to FloridaShines Common Prerequisites Manual, the format typically includes:
- Course code and title
- Prerequisites clearly stated in narrative form
- Grade requirements (if applicable)
- Multiple courses separated by "and" or "or"

---

## Existing Open-Source Tools

### 1. PreReqChecker (Java)

**Repository:** [jimmyMsh/PreReqChecker](https://github.com/jimmyMsh/PreReqChecker)

**Features:**
- Models prerequisite relationships using Directed Acyclic Graphs (DAGs)
- Uses adjacency lists for graph representation
- File-based input processing
- Designed after Rutgers Computer Science program prerequisites

**Strengths:**
- Uses graph structure appropriate for prerequisite hierarchies
- Handles complex prerequisite relationships

**Limitations:**
- Java-based (not suitable for JavaScript/TypeScript projects)
- Limited documentation on specific parsing strategies
- Repository appears academic/proof-of-concept

### 2. CourseChooser (JavaScript/Web)

**Repository:** [siefkenj/coursechooser](https://github.com/siefkenj/coursechooser)

**Purpose:**
- Web-based tool for visualizing program of study
- Originally for curriculum planning
- Shows prerequisite flows visually

**Approach:**
- Exports prerequisites to graph format for visualization
- Suitable for displaying prerequisite relationships

**Relevant for:** Understanding how prerequisites can be visualized after parsing

### 3. Course-Prerequisite-Networks

**Repository:** [pstavrin/Course-Prerequisite-Networks](https://github.com/pstavrin/Course-Prerequisite-Networks)

**Focus:**
- Network analysis of prerequisite relationships
- May include parsing or data analysis tools

### 4. Prerequisites Dataset (University of Illinois)

**Repository:** [illinois/prerequisites-dataset](https://github.com/illinois/prerequisites-dataset)

**Format:** CSV with structured columns

**Data Structure:**
- Column 1: Course code (e.g., "CS 225")
- Column 2: PrerequisiteNumber (count of prerequisites)
- Subsequent columns: Individual prerequisite codes under 0-indexed headers

**Example:**
```
Course,PrerequisiteNumber,0,1,2,3
CS 225,4,CS 125,ECE 220,CS 173,MATH 213
```

**Important Note:** This dataset treats "N of the following" as flattened—all alternatives are listed as separate prerequisites. The count indicates how many prerequisite rows exist, not whether they're all required or alternatives.

**Strengths:**
- Real university data
- Normalized structure
- CSV format (importable to Google Sheets)

**Limitations:**
- Flattened structure loses AND/OR logic
- No grade requirement tracking
- Limited to one institution initially

### 5. Course-Prerequisite-Finder

**Repository:** [Charlychee/Course-Prerequisite-Finder](https://github.com/Charlychee/Course-Prerequisite-Finder)

**Function:** Tool for finding and analyzing course prerequisites

### 6. Parsing Libraries (Language-Agnostic)

**For JavaScript/TypeScript:**
- **PEG.js** - Parser Expression Grammar library
- **Nearley.js** - JavaScript parser library
- **Lark.js** - Port of Lark parsing toolkit

**For Python (if building tools):**
- **Lark** - Modern parsing library with EBNF-like syntax
- **PyParsing** - Python library for parsing
- **Parsy** - Monadic parser combinator library
- **ANTLR** - Parser generator (cross-language)

**General Approach:** Boolean expression parsing algorithms can be adapted for course prerequisites using recursive descent parsing or PEG parsing.

---

## Spreadsheet Column Design

### Current Limitation: Flat Text Columns

Many university catalogs store prerequisites in a single text column:

```
| Course Code | Course Name        | Prerequisites                          |
|-------------|--------------------|----------------------------------------|
| CS 201      | Data Structures    | CS 101 and MATH 101 (C or better)      |
| CS 301      | Algorithms         | CS 201 or (CS 202 and MATH 301)        |
```

**Problems:**
- Ambiguous parsing (natural language is inherently ambiguous)
- Difficult to enforce in registration systems
- Hard to create automatic prerequisite checking
- Grade requirements often lost in text

### Recommended: Multi-Column Normalized Design

#### Option A: Separate Prerequisite Relationship Table

**Courses Table:**
```
| course_id | course_code | course_name | credits |
|-----------|-------------|-------------|---------|
| 1         | CS 201      | Data Struct | 3       |
| 2         | CS 101      | Intro CS    | 3       |
| 3         | MATH 101    | Calculus I  | 4       |
```

**Prerequisites Table:**
```
| prereq_id | course_id | required_course_id | min_grade | relation_type | group_id |
|-----------|-----------|-------------------|-----------|---------------|----------|
| 1         | 1         | 2                 | D         | AND           | 1        |
| 2         | 1         | 3                 | C         | AND           | 1        |
```

**Advantages:**
- Normalized structure (follows database design principles)
- Easy to query and enforce
- Supports multiple prerequisites per course
- Clear grade requirements

**Limitations:**
- Complex to set up in Google Sheets
- Requires understanding of relationships
- More tables to manage

#### Option B: Semi-Structured Column Design (Google Sheets Friendly)

**Single Sheet with Multiple Columns:**

```
| Course    | prereq_text                    | prereq_courses  | min_grade | logic_type |
|-----------|--------------------------------|-----------------|-----------|-----------|
| CS 201    | CS 101 and MATH 101 (C+)       | CS 101,MATH 101 | C+        | AND       |
| CS 301    | CS 201 or (CS 202 and MATH301) | CS 201,CS 202... | D         | OR        |
```

**Detailed Column Structure:**

1. **course_code**: Course identifier (e.g., "CS 201")
2. **course_name**: Human-readable course name
3. **prereq_text**: Original natural language prerequisite text (for reference)
4. **prereq_courses**: Comma-separated or semicolon-separated course codes
5. **min_grade**: Minimum grade requirement (A, B, C, D, or null)
6. **min_gpa**: Minimum overall GPA requirement (if applicable)
7. **logic_type**: "AND", "OR", "CHOICE", or "COMPLEX"
8. **choice_count**: For "N of the following" (e.g., "2" means "choose 2")
9. **special_requirements**: Additional requirements (e.g., "major status", "faculty consent")
10. **prereq_structured**: JSON representation for complex logic (see below)

**Advantages:**
- Readable and filterable in Google Sheets
- Mix of human-readable and machine-readable columns
- Gradual increase in structure
- Easy to implement with Google Forms + Apps Script

#### Option C: JSON Column for Complex Logic

For complex prerequisites, store structured data in a dedicated column:

```
| Course | prereq_json |
|--------|-------------|
| CS 301 | {"type":"and","items":[{"course":"CS 201","min_grade":"D"},{"type":"or","items":[{"course":"CS 202"},{"course":"CS 202B"}]}]} |
```

**Example Prerequisites in JSON:**

```json
{
  "type": "and",
  "items": [
    {
      "course": "CS 101",
      "min_grade": "C"
    },
    {
      "course": "MATH 101",
      "min_grade": "D"
    }
  ]
}
```

```json
{
  "type": "or",
  "items": [
    {
      "course": "CS 301"
    },
    {
      "course": "CS 302"
    },
    {
      "course": "CS 303"
    }
  ]
}
```

```json
{
  "type": "and",
  "items": [
    {
      "course": "CS 201"
    },
    {
      "type": "or",
      "items": [
        {
          "course": "CS 202"
        },
        {
          "course": "CS 202B"
        }
      ]
    }
  ]
}
```

```json
{
  "type": "choice",
  "count": 2,
  "items": [
    {"course": "MATH 201"},
    {"course": "MATH 202"},
    {"course": "MATH 203"},
    {"course": "MATH 204"}
  ]
}
```

**Advantages:**
- Handles arbitrary complexity
- Machine-readable and evaluable
- Can be parsed by JavaScript/TypeScript
- Easy to validate

**Disadvantages:**
- Less human-readable in spreadsheet view
- Requires tool to edit (can't manually edit JSON easily)
- Potential for JSON syntax errors

### Recommendation for Google Sheets Implementation

**Hybrid Approach (Best for Google Sheets):**

Create three columns:
1. **prereq_text**: Original prerequisite text from catalog (read-only reference)
2. **prereq_simple**: Simplified text optimized for parsing (e.g., "CS 101 AND MATH 101(C+)")
3. **prereq_structured**: JSON representation (filled via Google Apps Script)

Then use Google Apps Script to:
- Parse `prereq_simple` when users enter it
- Generate `prereq_structured` automatically
- Validate entries in real-time
- Handle errors with suggestions

---

## Google Sheets Approaches

### Existing Google Sheets Templates/Add-ons

**Note:** After research, no major pre-built Google Sheets templates specifically for course prerequisite management were found. However, several approaches can be adapted:

1. **Google Forms + Apps Script Approach**
   - Use Google Forms for data entry
   - Apps Script processes form submissions
   - Automatically parses prerequisites
   - Populates spreadsheet

2. **Custom Apps Script Solutions**
   - Extend Google Sheets with custom functions
   - Parse text on cell edit
   - Real-time validation
   - Export to JSON

3. **Looker Studio (Data Studio) Integration**
   - Visualize prerequisite relationships
   - Create dependency charts
   - Dashboard for curriculum planning

### Building a Google Sheets Solution

#### Approach 1: Data Validation with Apps Script

**Solution Steps:**
1. Create a Google Sheet with columns: course_code, course_name, prereq_text, prereq_simple, prereq_structured
2. Use Google Apps Script with `onEdit` trigger
3. When `prereq_simple` column is edited, parse and generate JSON
4. Store parsing results in `prereq_structured`

**Sample Google Apps Script:**

```javascript
function onEdit(e) {
  const sheet = e.source.getSheetByName("Courses");
  const range = e.range;

  // If prereq_simple column (column 4) is edited
  if (range.getColumn() == 4) {
    const courseCode = range.offset(0, -3).getValue();
    const prereqSimple = range.getValue();

    // Parse prerequisite string
    const structured = parsePrerequisite(prereqSimple);

    // Write to prereq_structured column
    range.offset(0, 1).setValue(JSON.stringify(structured));
  }
}

function parsePrerequisite(prereqString) {
  // Placeholder - implement parsing logic
  // Returns: { type: "and"|"or"|"choice", items: [...] }
  return {};
}
```

#### Approach 2: Custom Sidebar for Data Entry

Create a sidebar that guides users through structured prerequisite entry:

```javascript
function showPrerequisiteForm() {
  const html = HtmlService.createTemplateFromFile('PrerequisiteForm')
    .evaluate()
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setWidth(500)
    .setHeight(600);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Add Prerequisite');
}
```

#### Approach 3: Data Validation via Dropdown Lists

For common scenarios, use data validation dropdowns:

**Column: logic_type**
- Dropdown options: "Single Course", "AND", "OR", "N of the following", "Complex"

When user selects type, show additional fields for entry based on selection.

### Integration with Google Forms

Create a Google Form with:
1. Course code (text)
2. Course name (text)
3. Prerequisite text (long text)
4. Prerequisites exist? (yes/no)
5. If yes, collect details:
   - Number of prerequisites
   - List each prerequisite course + grade requirement

Submit responses to a Google Sheet, then use Apps Script to parse and normalize.

### Export Options

**Export to JSON:**
```javascript
function exportToJSON() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();

  const courses = data.slice(1).map(row => ({
    code: row[0],
    name: row[1],
    prerequisites: JSON.parse(row[4]) // prereq_structured column
  }));

  const blob = Utilities.newBlob(
    JSON.stringify(courses, null, 2),
    'application/json',
    'courses.json'
  );

  DriveApp.getRootFolder().createFile(blob);
}
```

**Export to CSV:**
- Google Sheets has native CSV export
- Prerequisites can be exported as JSON strings in CSV cells

---

## Key Lessons from University Systems

### Banner System (Enterprise Standard)

**Used by:** Many large universities (Rutgers, Florida, etc.)

**Prerequisite Handling:**
- Multiple prerequisite/parallel courses connected by "And" or "Or"
- Grade field indicates minimum passing grade in prerequisite
- Separate fields for prerequisite check method
- Supports test score prerequisites, course prerequisites, parallel courses
- Can extract data in XML format via IMS standards

**Key Field:**
- "Grade" field: specifies minimum grade (A, B, C, D)
- Multiple prerequisites connected explicitly with AND/OR logical operators
- Clear separation between prerequisite enforcement method

### Penn State CIM System

**Recommended Format for Prerequisites:**
- Use "and" and "or" (not commas, semicolons, or slashes)
- Use parentheses to group multiple course selection options
- Avoid ambiguous wording that could be interpreted multiple ways
- Clear minimum grade specification

**Example:** "MAC 2311 (C)" means grade of C minimum in Calculus I

### University of Illinois Dataset

**Real-World Data:**
- 161 courses with structured prerequisite information
- Originally parsed from catalog descriptions
- Treats alternatives (OR) as separate flat items
- Number field indicates count of prerequisites

**Lesson:** Human parsing of university catalogs is labor-intensive; automated parsing should be considered supplementary to manual review.

### Common Mistakes in Prerequisite Statements

According to Penn State CIM and other curriculum management guides:
- Ambiguous wording leads to registration enforcement errors
- Comma-separated courses are interpreted inconsistently
- Missing parentheses cause interpretation errors
- Inconsistent grade specification formats
- Mixed use of "and" / "or" without proper grouping

---

## Recommended Implementation Strategy

### Phase 1: Data Collection and Normalization

**Steps:**
1. Manually collect prerequisite text from university catalog
2. Enter into `prereq_text` column in Google Sheet
3. Manually review and simplify to `prereq_simple` format
   - Standardize course codes (e.g., "MATH 101" not "Math101")
   - Standardize grade specifications (e.g., "C+" not "C or better")
   - Remove extraneous words
   - Group multiple courses with parentheses if needed

**Format Rules:**
- Course code: `DEPT ###` or `DEPT ###X` (letter suffix optional)
- Grade: `(A+)`, `(A)`, `(A-)`, `(B+)`, etc.
- Operators: `AND` or `OR` (uppercase for clarity)
- Grouping: `(...)` for precedence
- N-of: `2 OF: COURSE1, COURSE2, COURSE3`
- Alternative: `COURSE1 OR instructor consent`

**Example Transformations:**
```
Original: "CS 101 and MATH 101 (C or better)"
Simplified: "CS 101 AND MATH 101(C+)"

Original: "Complete 2 of: CS301, CS302, CS303"
Simplified: "2 OF: CS 301, CS 302, CS 303"

Original: "(CS201 or CS202) and MATH301"
Simplified: "(CS 201 OR CS 202) AND MATH 301"
```

### Phase 2: Automated Parsing

**Build a Parser Function:**

```javascript
function parsePrerequisite(prereqString) {
  // 1. Tokenize input
  const tokens = tokenize(prereqString);

  // 2. Parse tokens into AST (Abstract Syntax Tree)
  const ast = parseTokens(tokens);

  // 3. Convert AST to structured format
  const structured = astToStructured(ast);

  return structured;
}

function tokenize(str) {
  // Extract: course codes, operators, grades, grouping
  // Returns: array of token objects
}

function parseTokens(tokens) {
  // Build expression tree respecting operator precedence
  // AND > OR in typical educational contexts
}

function astToStructured(ast) {
  // Convert tree to { type, items, min_grade, count } format
}
```

### Phase 3: Validation and Verification

**Checks to implement:**
1. All referenced course codes exist in the courses table
2. Grade specifications are valid (A+, A, A-, B+, B, B-, C+, C, C-, D, F)
3. Parentheses are balanced
4. N-of count is less than total options
5. No circular prerequisites (if feasible to check)

### Phase 4: Integration

**Once parsed:**
- Store JSON in `prereq_structured` column
- Use for:
  - Student prerequisite checking (given transcript, can student take course?)
  - Curriculum visualization
  - Graduation requirement checking
  - Academic advising

**Export Options:**
- JSON for programmatic use
- CSV for spreadsheet import
- SQL INSERT statements for database
- iCalendar or other formats as needed

---

## Technical Resources

### For Implementing Parsers

**JavaScript/TypeScript Options:**
1. **Build from scratch** using tokenization + recursive descent parsing
2. **Use PEG.js:** Define grammar, generate parser
3. **Use Nearley.js:** Similar to PEG.js, good documentation
4. **Regular expressions:** Sufficient for simple patterns, insufficient for nested logic

**Python Options (if backend needed):**
1. **ANTLR:** Industrial-strength parser generator
2. **Lark:** Modern, Pythonic
3. **PyParsing:** Accessible, good for educational use

### Regex Quick Reference for Prerequisites

**Course Code:** `\b([A-Z]{2,4})\s+(\d{3,4}[A-Z]?)\b`

**Grade in Parentheses:** `\(([A-F][+-]?)\)`

**AND Operator:** `\b(?:and|AND|&)\b`

**OR Operator:** `\b(?:or|OR|/)\b`

**N OF Pattern:** `(\d+)\s+(?:OF|of)\s*:\s*(.+)`

**Parentheses Content:** `\(([^)]+)\)`

### Key Concepts

1. **Tokenization:** Break input into logical units (course codes, operators, etc.)
2. **Parsing:** Interpret tokens according to grammar rules
3. **Operator Precedence:** AND typically binds tighter than OR
4. **Ambiguity Resolution:** Some prerequisites are ambiguous by design (need human review)
5. **Validation:** Verify that prerequisites can be enforced in the system

---

## Limitations and Gotchas

### Natural Language is Inherently Ambiguous

Example: "CS 101 or CS 102 and MATH 101"
- Could mean: `(CS 101) OR (CS 102 AND MATH 101)` [typical]
- Could mean: `(CS 101 OR CS 102) AND MATH 101` [less common]

**Solution:** Require parentheses for clarity, or establish precedence rules explicitly.

### Grade Requirements Vary in Format

- "C or better" vs. "C minimum" vs. "(C)"
- Some systems use D- as minimum, others C
- Some courses have no grade requirement (just completion)

**Solution:** Normalize during manual review phase.

### "N of the Following" is Complex

Some questions that arise:
- If student repeats a course, does it count twice?
- Are substitutions allowed?
- Does order matter?

**Solution:** Store as explicit choice type with count and course list.

### Corequisites vs. Prerequisites

- Corequisite: Can be taken at same time as course
- Prerequisite: Must be completed before

These are often mixed in prerequisite text. Some systems distinguish them; others don't.

**Solution:** Add a `prerequisite_type` column: "PREREQ", "COREQ", "PARALLEL"

### Grade Replacement Policies

- Do prerequisites need to be met after grade replacement?
- After retaking a course, which grade counts?

These policies are institution-specific and may not fit into the prerequisite structure itself.

**Solution:** Document in course policy, not in prerequisite field.

### Cross-Listed Courses

A course may be offered as "CS 301" and "MATH 350" with identical content.

- Does satisfying one satisfy both prerequisites?
- How to handle this in the prerequisite field?

**Solution:** Create a course equivalence table, not part of prerequisite parsing.

### International Transcript Evaluation

University catalogs sometimes include: "Equivalent course from another institution"

**Solution:** Requires human review; can't be fully automated.

### Instructor Discretion

"CS 101 or instructor consent" - faculty can override prerequisites.

**Solution:** Store as separate override mechanism, not in prerequisite field.

---

## Summary and Actionable Next Steps

### For Your Class_Tracker Project

**Immediate:**
1. Create a Google Sheet with columns: `course_code`, `course_name`, `prereq_text` (manual entry), `prereq_simple` (normalized), `prereq_structured` (JSON)
2. Manually normalize 5-10 prerequisite entries from your target catalog
3. Test parsing logic on these examples

**Short-term:**
1. Build a simple TypeScript parser using tokenization + recursive descent
2. Write unit tests for common patterns
3. Add data validation in Google Sheets

**Medium-term:**
1. Integrate parser with Google Apps Script
2. Build prerequisite checker (given transcript, can student take course?)
3. Create visualization of prerequisite chains

**Long-term:**
1. Handle edge cases (corequisites, overrides, substitutions)
2. Multi-institution support
3. Integration with degree audit tools

### Resources to Review

**GitHub Repositories:**
- [jimmyMsh/PreReqChecker](https://github.com/jimmyMsh/PreReqChecker) - Graph-based prerequisite modeling
- [siefkenj/coursechooser](https://github.com/siefkenj/coursechooser) - Prerequisite visualization
- [illinois/prerequisites-dataset](https://github.com/illinois/prerequisites-dataset) - Real university data (CSV format)

**Documentation Standards:**
- [Penn State CIM Prerequisites Guide](https://cim.psu.edu/user-guides/course-management/prerequisites-concurrents-corequisites/)
- [FloridaShines Common Prerequisites](https://www.floridashines.org/common-prerequisites)
- [University of Arizona Catalog Guide](https://catalog.arizona.edu/key-course-descriptions)

**Parsing Libraries:**
- **JavaScript:** Nearley.js, PEG.js, Lark.js
- **Python:** ANTLR, Lark, PyParsing
- **General:** Regular expressions for simple patterns, grammar-based parsing for complex

---

## Additional Notes

### Data Quality Considerations

Most university prerequisite information is:
- Manually maintained and can contain typos
- Inconsistently formatted across departments
- Updated irregularly
- Subject to interpretation

Plan for:
- Manual review of automated parsing results
- Validation against course codes in the system
- Regular audits of prerequisite accuracy
- User feedback mechanisms

### Privacy and FERPA Compliance

If integrating student transcripts:
- Don't store actual student data in parsing tools
- Use anonymized test data
- Comply with FERPA requirements
- Consider data storage and deletion policies

---

**Research Conducted:** 2026-03-14
**Sources:** University websites, GitHub repositories, course management system documentation, academic papers on curriculum data management
