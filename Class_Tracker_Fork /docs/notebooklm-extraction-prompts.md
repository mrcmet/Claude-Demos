# NotebookLM Extraction Prompts
## Use these in your NotebookLM notebook before sending output to the Gemini GEM

Upload your course catalog PDF(s) to NotebookLM, then run these prompts in order.
Copy the output from each and paste it into your Gemini GEM conversation.

---

## PROMPT 1 — Full Course Inventory

```
List every course in this catalog in a table with these exact columns:
Course Code | Course Title | Credit Hours | Prerequisites (verbatim from catalog) | Co-requisites (verbatim) | Terms Offered

If a field is not stated in the catalog, write "NOT STATED".
Do not summarize or interpret — copy the prerequisite text exactly as written.
```

---

## PROMPT 2 — Entry-Level Courses (no prereqs)

```
Which courses in this catalog have NO prerequisites at all?
List them as: Course Code — Course Title — Credits
Include courses described as "open to all students", "no prerequisites required",
or appropriate for first-semester freshmen.
```

---

## PROMPT 3 — Co-requisites Specifically

```
List every course that requires CONCURRENT enrollment in another course.
Look for language like: "co-req:", "to be taken concurrently", "must enroll simultaneously",
"concurrent enrollment in X required", "taken with X".
Format: Course Code → required concurrent course code
```

---

## PROMPT 4 — Minimum Grade Requirements

```
List every course where the prerequisite specifies a minimum grade.
Look for: "with a grade of C or better", "minimum grade of B", "passed with C-", etc.
Format: Course Code | Prerequisite Course | Minimum Grade Required
```

---

## PROMPT 5 — OR Prerequisites

```
List every course where the prerequisite allows a CHOICE between courses.
Look for: "X or Y", "either X or Y", "one of the following", "X, Y, or Z".
Format: Course Code — prerequisite text verbatim
```

---

## PROMPT 6 — Complex Prerequisites

```
List every course that has MORE THAN TWO prerequisite courses, or has
conditional prerequisites (e.g. "if X then Y", "choose N from the following").
Copy the full prerequisite text verbatim for each.
```

---

## PROMPT 7 — Program Requirements

```
List the degree programs in this catalog. For each program, list:
1. The official program name and abbreviation (e.g. B.S. Computer Science / BSCS)
2. All required courses (course codes only)
3. Any elective groups (e.g. "choose 2 from the following technical electives: ...")
4. Total credit hours required for the degree
```

---

## PROMPT 8 — Terms and Schedule

```
For each course, does the catalog state which semesters it is offered?
List courses that are offered in ONLY ONE semester (fall-only or spring-only).
List courses offered in summer.
For courses with no schedule information, just say "not stated".
```

---

## WORKFLOW SUMMARY

1. Run Prompt 1 → paste full table into GEM
2. Run Prompts 3–6 → paste additional detail for co-reqs, grades, OR logic
3. Run Prompt 7 → paste program requirements into GEM
4. Tell the GEM: **"Generate the full JSON plan file from all the above."**
5. Review GEM's clarifying questions → answer them
6. Receive JSON → save as `[department]-[year].json`
7. Load into the app via "Load Curriculum" button

---

## TIPS FOR CLEAN OUTPUT

- If the catalog uses abbreviations (e.g. "Prereq:" instead of "Prerequisite:"), tell the GEM: *"In this catalog, 'Prereq:' means prerequisite and 'Co-req:' means co-requisite."*
- If course codes have spaces in the catalog (e.g. "CS 101"), tell the GEM: *"Strip spaces from course codes so 'CS 101' becomes 'CS101'."*
- If the catalog covers multiple departments, run one department at a time and generate separate plan files
- Always paste the catalog year if visible — it goes in the `catalogYear` field
