# Spreadsheet-to-JSON Import Approaches Research

**Researched**: March 14, 2026 | **Focus**: Course catalog data import with prerequisite parsing

## Executive Summary

This document evaluates 5 approaches for converting spreadsheet course catalog data into the Class Tracker JSON schema. The prerequisite parsing challenge is the key differentiator.

**Quick Recommendation Matrix**:
| Approach | Setup Ease | Prerequisite Parsing | Runtime | Best For |
|----------|-----------|---------------------|---------|----------|
| Google Apps Script | Moderate | Basic (regex) | Google Sheets | Non-technical users, Google Sheets native |
| Papa Parse (Browser) | Easy | Manual/Rule-based | Browser | Single-use conversions, no backend needed |
| Node.js CLI | Moderate | Flexible | Local | Developers, scriptable workflows |
| Claude API | Complex | Excellent | API call | Complex/ambiguous prerequisites, intelligent parsing |
| Google Sheets Published | Easy | N/A | Runtime fetch | Live data sync (not conversion) |

---

## Approach 1: Google Apps Script

### Overview

Google Apps Script (GAS) is JavaScript code that runs inside Google Sheets and Google Workspace applications. It can read spreadsheet data, process it, and generate downloadable files.

### Key Features

- **Native Integration**: Runs directly in Google Sheets without leaving the browser
- **Easy Installation**: No setup beyond creating a script in the Sheets UI
- **File Download**: Can generate and offer downloadable JSON files
- **Scheduling**: Can run on a schedule or via UI triggers
- **Limitations**: Single-threaded, 6-minute execution timeout, limited API access

### Setup Complexity

**For Non-Technical Users: LOW**
- No CLI, no dependencies, no environment setup
- User: 1) Open Google Sheet → 2) Tools → Script Editor → 3) Paste code → 4) Run function → 5) Download file
- Can be further simplified with a custom menu button

**Code Snippet** (minimal Google Apps Script template):
```javascript
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Export')
    .addItem('Convert to JSON', 'convertToJson')
    .addToUi();
}

function convertToJson() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const json = {
    department: "CS",
    catalogYear: "2024",
    version: "1.0",
    courses: []
  };

  for (let i = 1; i < data.length; i++) {
    const course = {};
    for (let j = 0; j < headers.length; j++) {
      course[headers[j]] = data[i][j];
    }
    json.courses.push(course);
  }

  downloadJson(JSON.stringify(json, null, 2), 'courses.json');
}

function downloadJson(content, filename) {
  const blob = Utilities.newBlob(content, 'application/json', filename);
  const file = DriveApp.createFile(blob);
  // Note: GAS doesn't directly download; instead creates file in Drive
  Logger.log('File created: ' + file.getUrl());
}
```

### Prerequisite Parsing Capability

**Challenge Level**: MODERATE

Google Apps Script can parse prerequisites using:
1. **String splitting and regex**: Build conditional logic manually
2. **Basic pattern matching**: `"CS101 AND CS201".split(" AND ")` or regex like `/(\w+)\s+(AND|OR)\s+(\w+)/g`

**Example Parser**:
```javascript
function parsePrerequisite(text) {
  if (!text || text === 'None' || text === '') {
    return { type: 'none', courses: [] };
  }

  // Handle "choose X of" pattern
  const chooseMatch = text.match(/choose\s+(\d+)\s+of[:\s]+([\w\d,\s]+)/i);
  if (chooseMatch) {
    const count = parseInt(chooseMatch[1]);
    const courses = chooseMatch[2].split(',').map(c => c.trim());
    return { type: 'choose', courses, count };
  }

  // Handle AND
  if (text.includes(' AND ')) {
    const courses = text.split(' AND ').map(c => c.trim());
    return { type: 'all', courses };
  }

  // Handle OR
  if (text.includes(' OR ')) {
    const courses = text.split(' OR ').map(c => c.trim());
    return { type: 'any', courses };
  }

  // Single course
  return { type: 'all', courses: [text.trim()] };
}
```

**Limitations**:
- Regex-only parsing cannot handle nested logic like "(CS101 OR CS102) AND CS201"
- No natural language understanding
- Brittle if prerequisite text varies in format

### Libraries & APIs Available

- **Built-in**: `SpreadsheetApp`, `DriveApp`, `MailApp`, `Utilities`
- **External APIs**: Can call HTTP endpoints via `UrlFetchApp`
- **No npm packages**: Limited to Google's provided APIs
- **JSON manipulation**: Native JavaScript (no special library needed)

### Performance & Limitations

- **Execution Timeout**: 6 minutes (hard limit)
- **Memory**: ~50MB per execution
- **Quota**: 20,000 requests per day per user
- **File Size**: Downloaded files limited to ~50MB
- **Scalability**: Not suitable for large catalogs (10,000+ courses)

### Real-World Considerations

**Pros**:
- Zero setup for users already in Google Sheets
- Perfect for iterative development (edit, test, run immediately)
- No backend infrastructure needed
- Can add UI elements (buttons, dialogs) directly in Sheets

**Cons**:
- Prerequisite parsing requires manual regex engineering
- Difficult to maintain complex parsing logic
- Can't easily integrate with external services
- Download mechanism is awkward (files go to Drive, not direct download)
- No source control for the script code

### Maintenance Burden: MODERATE

- Google occasionally updates GAS APIs
- Parsing logic needs updating if prerequisite formats change
- No easy way to test/version control the code

---

## Approach 2: Papa Parse (Browser-Based CSV Parsing)

### Overview

Papa Parse is a lightweight JavaScript library for parsing CSV files in the browser. Users upload a CSV file and the app converts it to JSON in real-time without a server.

### Key Features

- **In-Browser**: Entire conversion happens client-side, no server needed
- **Streaming**: Can handle large files efficiently
- **Flexible Output**: Returns JavaScript objects directly
- **Header Mapping**: Auto-maps column headers to object properties
- **Error Handling**: Graceful handling of malformed CSV
- **Lightweight**: ~14-16 KB minified and gzipped

### Setup Complexity

**For Non-Technical Users: MODERATE-to-HIGH**

The app developer needs to build UI. The user flow:
1. User exports spreadsheet to CSV
2. User opens the web app and uses an import feature
3. User selects the CSV file to upload
4. App displays preview and allows mapping columns
5. App generates JSON

The UI/UX complexity is significant here.

**Code Snippet** (React component example):
```jsx
import { useState } from 'react';
import Papa from 'papaparse';

export function CourseImporter() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const converted = convertToSchema(results.data);
          setCourses(converted.courses);
        } catch (err) {
          setError(err.message);
        }
      },
      error: (error) => {
        setError(`CSV Parse Error: ${error.message}`);
      }
    });
  };

  const convertToSchema = (csvRows) => {
    const courses = csvRows.map(row => ({
      id: row['Course ID'],
      name: row['Course Name'],
      credits: parseInt(row['Credits']),
      prerequisites: parsePrerequisites(row['Prerequisites']),
      description: row['Description'],
      termsOffered: row['Terms'].split(',').map(t => t.trim()),
      minGrade: row['Min Grade'] || 'C'
    })).filter(c => c.id); // Filter empty rows

    return { courses };
  };

  const downloadJSON = () => {
    const json = {
      department: "CS",
      catalogYear: "2024",
      version: "1.0",
      courses
    };
    const blob = new Blob([JSON.stringify(json, null, 2)],
                          { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'courses.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      {error && <div className="error">{error}</div>}
      {courses.length > 0 && (
        <div>
          <h3>Imported {courses.length} courses</h3>
          <button onClick={downloadJSON}>Download JSON</button>
        </div>
      )}
    </div>
  );
}
```

### Prerequisite Parsing Capability

**Challenge Level**: MODERATE-to-HIGH

Papa Parse itself doesn't parse prerequisites—it just provides clean CSV data. The developer must build parsing logic.

**Example Parser** (same as Google Apps Script):
```javascript
function parsePrerequisites(text) {
  if (!text || text.toLowerCase() === 'none') {
    return { type: 'none', courses: [] };
  }

  const chooseMatch = text.match(/choose\s+(\d+)\s+of[:\s]+([\w\d,\s]+)/i);
  if (chooseMatch) {
    return {
      type: 'choose',
      courses: chooseMatch[2].split(',').map(c => c.trim()),
      count: parseInt(chooseMatch[1])
    };
  }

  if (text.toUpperCase().includes(' AND ')) {
    return {
      type: 'all',
      courses: text.split(/\s+AND\s+/i).map(c => c.trim())
    };
  }

  if (text.toUpperCase().includes(' OR ')) {
    return {
      type: 'any',
      courses: text.split(/\s+OR\s+/i).map(c => c.trim())
    };
  }

  return { type: 'all', courses: [text.trim()] };
}
```

**Advantages Over Other Client-Side**:
- All processing in browser = fast, no server latency
- User retains full privacy (file never leaves their machine)
- Can validate and preview before download

**Disadvantages**:
- Requires UI development (not suitable for non-developers)
- Parsing logic is inflexible without app updates
- No ability to intelligently handle format variations
- Users must export CSV (extra step for them)

### Bundle Size Impact

- Papa Parse: ~14 KB gzipped
- Integration: Minimal (single component)
- **Overall impact on app**: Negligible if already using React

### Libraries & Dependencies

```json
{
  "papaparse": "^5.4.1"
}
```

**TypeScript Support**: `@types/papaparse` available (4 KB)

### Performance & Browser Limitations

- **File Size**: Browser can handle 50-100 MB CSV files
- **Processing Speed**: Depends on browser performance; typically 100,000+ rows per second
- **Memory**: CSV data loaded entirely into memory
- **Browser Compatibility**: Works in all modern browsers (IE 10+)

### Real-World Considerations

**Pros**:
- Zero server infrastructure needed
- Fastest solution for users (all local processing)
- Perfect privacy (data never leaves the device)
- Can provide instant feedback and validation

**Cons**:
- Requires developer to build import UI
- CSV export step for users (not seamless)
- Parsing logic updates require app release
- No ability to handle edge cases intelligently
- Users might make mistakes exporting to CSV

### Maintenance Burden: MODERATE

- Papa Parse is stable and well-maintained
- Parsing logic must be updated if formats change
- UI may need refinement based on user feedback

---

## Approach 3: Node.js CLI Converter Script

### Overview

A standalone Node.js script that developers or technically-inclined users can run locally: `node convert.js courses.csv > output.json`. This provides maximum control and flexibility.

### Key Features

- **Self-Contained**: Single file or small package developers can clone and run
- **Flexible Libraries**: Access to npm ecosystem for parsing
- **Scriptable**: Can be integrated into CI/CD pipelines
- **No Network**: Runs entirely offline
- **Version Control**: Code can be tracked in git

### Setup Complexity

**For Non-Technical Users: HIGH**
**For Developers: LOW**

User must:
1. Install Node.js (if not already installed)
2. Clone or download the script repository
3. Install dependencies: `npm install`
4. Run: `node convert.js input.csv > output.json`

This is not realistic for non-technical users, but perfect for developer teams.

**Code Snippet** (Node.js CLI script):
```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync'); // or use 'xlsx' for Excel
const readlineSync = require('readline-sync');

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node convert.js <input.csv>');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`);
  process.exit(1);
}

try {
  const fileContent = fs.readFileSync(inputFile, 'utf-8');
  const records = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const courses = records.map(row => ({
    id: row['Course ID'],
    name: row['Course Name'],
    credits: parseInt(row['Credits']) || 0,
    prerequisites: parsePrerequisites(row['Prerequisites']),
    corequisites: (row['Corequisites'] || '')
      .split(',')
      .map(c => c.trim())
      .filter(c => c),
    minGrade: row['Min Grade'] || 'C',
    termsOffered: (row['Terms Offered'] || '')
      .split(',')
      .map(t => t.trim())
      .filter(t => t),
    description: row['Description'] || ''
  })).filter(c => c.id);

  const catalog = {
    department: 'CS',
    catalogYear: '2024',
    version: '1.0',
    courses: courses,
    programs: []
  };

  console.log(JSON.stringify(catalog, null, 2));
} catch (error) {
  console.error('Error processing file:', error.message);
  process.exit(1);
}

function parsePrerequisites(text) {
  // Implementation same as previous examples
  if (!text || text.toLowerCase() === 'none') {
    return { type: 'none', courses: [] };
  }

  const chooseMatch = text.match(/choose\s+(\d+)\s+of[:\s]+([\w\d,\s]+)/i);
  if (chooseMatch) {
    return {
      type: 'choose',
      courses: chooseMatch[2].split(',').map(c => c.trim()),
      count: parseInt(chooseMatch[1])
    };
  }

  if (text.toUpperCase().includes(' AND ')) {
    return {
      type: 'all',
      courses: text.split(/\s+AND\s+/i).map(c => c.trim())
    };
  }

  if (text.toUpperCase().includes(' OR ')) {
    return {
      type: 'any',
      courses: text.split(/\s+OR\s+/i).map(c => c.trim())
    };
  }

  return { type: 'all', courses: [text.trim()] };
}
```

### Node.js CSV/Excel Libraries Comparison

| Library | Purpose | File Types | Size | Best For |
|---------|---------|-----------|------|----------|
| `csv-parse` | Fast CSV parsing | CSV only | ~15 KB | Standard CSVs |
| `xlsx` | Excel parsing | XLS, XLSX, CSV | ~900 KB | Excel native format |
| `papaparse` (node) | CSV parsing | CSV only | ~15 KB | CSV files |
| `fast-csv` | CSV parsing | CSV only | ~30 KB | Large-scale parsing |
| `csv-parser` | Stream-based CSV | CSV only | ~5 KB | Large files, streaming |

**Recommended Stack**: `csv-parse` + `xlsx` (let users choose format)

```javascript
// package.json dependencies
{
  "csv-parse": "^5.4.1",
  "xlsx": "^0.18.5"
}
```

### Prerequisite Parsing Capability

**Challenge Level**: MODERATE

Same regex-based approach as browser/GAS solutions. However, you could extend it:

```javascript
function parsePrerequisitesAdvanced(text) {
  // Could integrate with Claude API here for intelligent parsing
  // or build a more sophisticated parser

  // Basic approach
  return parsePrerequisitesBasic(text);
}

async function parsePrerequisitesWithClaude(text) {
  // Option to use Claude API for ambiguous cases
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Parse this prerequisite text into JSON format:\n"${text}"\n\nReturn JSON only with structure: { "type": "none"|"all"|"any"|"choose", "courses": [], "count": 1 }`
      }]
    })
  });

  return JSON.parse(response.json().content[0].text);
}
```

### Performance & Scalability

- **Speed**: Can process 10,000+ course records in seconds
- **Memory**: Efficient with streaming options available
- **Concurrency**: Can process multiple files in parallel
- **Scalability**: Suitable for any catalog size

### Real-World Considerations

**Pros**:
- Maximum flexibility and control
- Can integrate with external services (APIs, databases)
- Perfect for automated/CI workflows
- Excellent for developers
- Can be version-controlled and tested
- Easy to add complex parsing logic

**Cons**:
- Not suitable for non-technical end users
- Requires Node.js installation
- Parsing logic still regex-based unless extended
- No UI feedback (command-line only)
- Requires CSV export step

### Maintenance Burden: LOW-to-MODERATE

- Node.js and libraries are stable
- Easy to test with unit tests
- Can be updated and distributed as npm package
- Good for long-term maintenance

### Example Commands

```bash
# Basic usage
node convert.js courses.csv > courses.json

# With validation
node convert.js courses.csv --validate > courses.json

# Process multiple files
node convert.js *.csv --output catalog.json

# Watch mode for development
node convert.js --watch courses.csv
```

---

## Approach 4: Claude API for Intelligent Parsing

### Overview

Use Claude API to parse prerequisite text and generate JSON. Claude's natural language understanding makes it excellent for handling variations, ambiguous cases, and complex logic.

### Key Features

- **Natural Language Understanding**: Handles variations in prerequisite text
- **Intelligent Inference**: Can understand context and implicit requirements
- **Complex Logic**: Can parse nested prerequisites like "(A OR B) AND C"
- **Error Handling**: Gracefully handles ambiguous or malformed input
- **Flexible Integration**: Can be called from any environment

### Setup Complexity

**For Non-Technical Users: HIGH**
**For Developers: MODERATE**

User must:
1. Obtain Claude API key from Anthropic
2. Set environment variables
3. Prepare CSV data
4. Run conversion (either CLI script or web app)

The setup is moderate, but requires API key management.

### Prerequisite Parsing Capability

**Challenge Level**: LOW (Claude excels at this)

**Example API Call** (Node.js):
```javascript
async function parsePrerequisitesWithClaude(prerequisiteText) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Parse this university course prerequisite text into a structured JSON object.

Prerequisite text: "${prerequisiteText}"

Response with ONLY valid JSON (no markdown, no explanation). The JSON must follow this schema:
{
  "type": "none" | "all" | "any" | "choose",
  "courses": ["COURSE_CODE1", "COURSE_CODE2"],
  "count": 1
}

Rules:
- "none": No prerequisites
- "all": All courses required (AND logic)
- "any": One of the courses required (OR logic)
- "choose": Choose N courses from the list

Examples:
- "CS101 AND CS102" → type: "all", courses: ["CS101", "CS102"]
- "CS101 OR CS102" → type: "any", courses: ["CS101", "CS102"]
- "Choose 2 of: MATH101, MATH102, MATH103" → type: "choose", courses: [...], count: 2
- "None" → type: "none", courses: []`
        }
      ]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`API error: ${data.error?.message}`);
  }

  try {
    return JSON.parse(data.content[0].text);
  } catch (e) {
    console.error('Failed to parse Claude response:', data.content[0].text);
    throw e;
  }
}
```

**Web App Integration** (React):
```jsx
async function convertWithClaude(csvData) {
  const courses = [];

  for (const row of csvData) {
    const course = {
      id: row['Course ID'],
      name: row['Course Name'],
      credits: parseInt(row['Credits']),
      prerequisites: await parsePrerequisitesWithClaude(row['Prerequisites']),
      description: row['Description']
    };
    courses.push(course);

    // Rate limiting: Claude API has per-minute limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return courses;
}
```

### API Pricing & Rate Limits

- **Input Tokens**: $3 per 1M tokens
- **Output Tokens**: $15 per 1M tokens
- **Typical Cost per Course**: ~$0.001-0.003 (parsing prerequisite ~50-100 tokens)
- **1000 courses**: $1-3 in API costs

**Rate Limits**: 50,000 tokens per minute (claude-opus), 10,000 tokens per minute (claude-haiku)

For bulk conversion, use Claude Haiku (cheaper, sufficient for this task):
```javascript
model: 'claude-3-5-haiku-20241022' // $0.80 per 1M input, $4 per 1M output
```

### Advantages & Disadvantages

**Pros**:
- Handles complex, ambiguous prerequisite text excellently
- Requires minimal parsing logic from developer
- Can provide human-readable explanations
- Consistent results across variations
- Can handle edge cases naturally
- Future-proof: easy to update behavior via prompts

**Cons**:
- Requires API key and costs money per request
- Network latency (100-500ms per request)
- Not suitable for offline-only workflows
- Rate limits may affect bulk processing
- Requires internet connection
- API changes could affect behavior
- Privacy: prerequisite text sent to external service

### Integration Scenarios

**Scenario 1: Hybrid Approach** (Recommended)
```javascript
function parsePrerequisites(text) {
  // Try basic parsing first
  const basicResult = parsePrerequisitesBasic(text);

  // If confident, return basic result
  if (basicResult.confidence > 0.9) {
    return basicResult;
  }

  // Otherwise, use Claude for ambiguous cases
  return await parsePrerequisitesWithClaude(text);
}
```

**Scenario 2: Batch Processing**
```javascript
// Process in batches to respect rate limits
async function convertBatch(csvData, batchSize = 10) {
  const results = [];
  for (let i = 0; i < csvData.length; i += batchSize) {
    const batch = csvData.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(row => parsePrerequisitesWithClaude(row.prerequisites))
    );
    results.push(...batchResults);

    // Rate limit: wait between batches
    if (i + batchSize < csvData.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return results;
}
```

### Real-World Considerations

**Best for**:
- Complex, ambiguous, or poorly-formatted prerequisite text
- One-time large catalog conversions (budget allows API costs)
- Teams that value parsing accuracy over cost
- Web apps needing intelligent parsing as ongoing feature

**Not ideal for**:
- Offline-only applications
- Repetitive conversions (costs add up)
- Projects with zero API budget
- Real-time user conversions in high-traffic scenarios

### Maintenance Burden: LOW

- Claude API is stable and well-documented
- Behavior easily updated via prompt refinement
- No complex logic to maintain

---

## Approach 5: Google Sheets Published CSV/JSON

### Overview

Publish a Google Sheet as CSV or JSON via a public URL, then fetch it directly in your web app. This enables live data sync without conversion.

### Key Features

- **Live Updates**: Changes to the sheet reflect in the app automatically
- **No Conversion Needed**: If structured as JSON sheet, can be fetched directly
- **Simple Setup**: Built-in Google Sheets feature
- **No Backend**: No server infrastructure needed

### Setup Complexity

**For Non-Technical Users: LOW**
**Caveats**: Requires understanding of Google Sheets publishing

Steps:
1. Create Google Sheet with course data
2. File → Share → Get a shareable link (view-only)
3. Modify URL to export as CSV: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv`
4. Fetch in app using `fetch()` API

### How It Works

**CSV Export URL Pattern**:
```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={SHEET_ID}
```

**JSON Export** (with Apps Script or sheet2json service):
```
https://sheets2json.com/v1/{SHEET_ID}
```

**Web App Integration** (React):
```jsx
async function fetchCoursesFromGoogleSheet(sheetId) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch sheet');

  const csv = await response.text();
  const rows = Papa.parse(csv, { header: true }).data;

  const courses = rows.map(row => ({
    id: row['Course ID'],
    name: row['Course Name'],
    prerequisites: parsePrerequisites(row['Prerequisites'])
    // ... other fields
  }));

  return courses;
}

// Usage in component
useEffect(() => {
  fetchCoursesFromGoogleSheet('SHEET_ID').then(setCourses);
}, []);
```

### Privacy & Security Concerns

**CRITICAL CONSIDERATIONS**:

1. **Public Access**: The published sheet is accessible to anyone with the URL
   - If you distribute the app to the web, any user can see the Google Sheet URL
   - Not suitable for sensitive data or private course catalogs

2. **CORS Issues**: Google Sheets export may be blocked by browsers
   - CORS headers might prevent direct fetch in some cases
   - Workaround: Use a proxy service or fetch through your server

3. **Rate Limiting**: Google enforces rate limits on sheet access
   - Too many requests can result in temporary blocks
   - Not suitable for high-traffic apps

4. **URL Visibility**: If published URL is in the app code, it's discoverable
   - Source code inspection reveals the sheet ID
   - Anyone can modify the data in the sheet if granted permission

5. **Data Privacy**: All data in the sheet is accessible
   - No field-level access control
   - All-or-nothing exposure

**Safer Approach** (if you need live sync):
```javascript
// Fetch through YOUR server, which fetches from Google Sheets
// This way the sheet URL is not exposed to clients
async function getCoursesFromServer() {
  const response = await fetch('/api/courses');
  return response.json();
}

// Server-side (Node.js):
app.get('/api/courses', async (req, res) => {
  const sheetUrl = process.env.GOOGLE_SHEET_URL; // Hidden on server
  const csv = await fetch(sheetUrl);
  const courses = convertCsvToJson(await csv.text());
  res.json(courses);
});
```

### Prerequisite Parsing Capability

**Challenge Level**: NOT APPLICABLE

This approach doesn't parse or convert—it fetches and uses data as-is. Prerequisites must already be in the correct format in the sheet, or you need to use Papa Parse + regex parsing client-side anyway.

### Performance & Limitations

- **Latency**: Network dependent, typically 500-2000ms
- **Caching**: Can add cache headers for repeated requests
- **File Size**: Sheets can contain massive data; export takes time
- **Update Frequency**: Published sheets update every few minutes (not real-time)
- **Sheet Limits**: Google Sheets has 10M cell limit per file

### Real-World Considerations

**Pros**:
- Zero setup for existing Google Sheets users
- Live data without server infrastructure
- Simple to implement if privacy isn't a concern
- Good for internal team tools with shared Google account

**Cons**:
- Data is publicly accessible (privacy risk)
- CORS complications in browser
- Rate limiting issues
- Still requires prerequisite parsing on client-side
- Not a true "conversion" solution
- Not suitable for production public apps

### When to Use This Approach

- **Internal tools** where all users have access to the Google Sheet anyway
- **Admin dashboards** with a small number of users
- **Prototypes** and proof-of-concepts
- **NOT suitable** for published web apps with unknown users

### Maintenance Burden: VERY LOW

- No code to maintain
- Updates happen in the sheet
- No parsing logic needed (if data is already formatted correctly)

---

## Comparative Analysis

### Prerequisite Parsing Effectiveness

| Approach | Handles Simple Text | Handles Complex Logic | Handles Variations | Notes |
|----------|-------------------|----------------------|-------------------|-------|
| Google Apps Script | ✓ (regex) | ✗ | ✗ | Brittle, needs manual updates |
| Papa Parse | ✓ (regex) | ✗ | ✗ | Same regex limitations |
| Node.js CLI | ✓ (regex) | ✓ (can extend) | ~ | Can integrate Claude API |
| Claude API | ✓ | ✓ | ✓ | Best solution for parsing |
| Google Sheets | N/A | N/A | N/A | Requires pre-formatting |

### Non-Technical User Friendliness

| Approach | Ease of Use | Setup Time | Ongoing Use |
|----------|------------|-----------|------------|
| Google Apps Script | Very Easy | 10 min | Single click in Sheets |
| Papa Parse (Browser) | Moderate | 5 min (file upload) | Upload file, download JSON |
| Node.js CLI | Hard | 20 min | Command line required |
| Claude API | Hard | 15 min | Command line required |
| Google Sheets | Easy | 5 min setup | Live data, no conversion step |

### Cost Analysis

| Approach | Setup Cost | Per-Use Cost | Infrastructure |
|----------|-----------|------------|-----------------|
| Google Apps Script | Free | Free | Free (Google) |
| Papa Parse | Free | Free | Free (browser) |
| Node.js CLI | Free | Free | Free (local) |
| Claude API | Free | $0.001-0.003/course | Anthropic API |
| Google Sheets | Free | Free | Free (Google) |

### Scalability

| Approach | Catalog Size | Performance | Limitations |
|----------|-------------|-------------|-------------|
| Google Apps Script | Up to 5,000 | Good | 6-min timeout |
| Papa Parse | Unlimited | Excellent | Browser memory |
| Node.js CLI | Unlimited | Excellent | Local hardware |
| Claude API | 10,000+ | Good (with batching) | API rate limits, cost |
| Google Sheets | Up to 10M cells | Good | Network latency |

---

## Hybrid Recommendation

The **ideal solution for Class Tracker** depends on your use case:

### Recommended Stack: Node.js CLI + Claude API

**Why This Combination**:

1. **Developer-friendly**: Easy to build, test, and maintain
2. **Excellent prerequisite parsing**: Claude handles complex cases
3. **Flexible integration**: Can be CLI, server-side, or web API
4. **Cost-effective**: Only pay per conversion (not per user)
5. **Offline fallback**: Basic regex parsing for simple cases

**Implementation Approach**:

```javascript
// convert.js - hybrid parser
async function convertCatalog(inputFile) {
  const csvData = readAndParseCsv(inputFile);

  const courses = await Promise.all(
    csvData.map(async (row) => {
      // Try fast regex parsing first
      let prereq = parseBasicPrerequisites(row.prerequisites);

      // If confidence is low, use Claude
      if (!prereq.confidence > 0.8) {
        try {
          prereq = await parseWithClaude(row.prerequisites);
        } catch (error) {
          console.warn(`Claude parsing failed for ${row.courseId}, using basic parse`);
        }
      }

      return {
        id: row.courseId,
        name: row.courseName,
        prerequisites: prereq
        // ... other fields
      };
    })
  );

  return { courses };
}
```

### Alternative for Non-Technical Users: Google Apps Script

If users are already in Google Sheets and want maximum simplicity:
- Build a Google Apps Script in the Sheets template
- Provide a custom "Export to JSON" button
- Trade-off: Less intelligent prerequisite parsing
- Workaround: Provide a prerequisite formatting guide for users

### Alternative for Web App: Papa Parse + Claude

If building a web app import feature:
- Use Papa Parse for CSV upload
- Use Claude API for prerequisite parsing
- Better UX with validation and preview
- Higher setup complexity, but best user experience

---

## Decision Matrix

**Choose Google Apps Script if**:
- Users are non-technical
- Data is already in Google Sheets
- Prerequisite formats are consistent
- One-time conversions
- No server infrastructure available

**Choose Papa Parse if**:
- Building a web app with import feature
- Want zero server infrastructure
- Users comfortable with file upload
- Privacy is critical (client-side only)

**Choose Node.js CLI if**:
- Users are developers
- Need scriptable/repeatable conversions
- Want version control and testing
- Open to cloud deployment

**Choose Claude API if**:
- Prerequisite text is complex/ambiguous
- Budget allows API costs ($1-5 per catalog)
- Need reliable, intelligent parsing
- Want to handle edge cases

**Choose Google Sheets + Fetch if**:
- Data changes frequently
- Want live updates in app
- Small trusted team of users
- NOT for public web apps

---

## Implementation Roadmap

### Phase 1: MVP (Google Apps Script)
- Quick validation of concept
- Non-technical user testing
- Identify real prerequisite patterns
- Timeline: 1-2 weeks

### Phase 2: Production (Node.js + Claude Hybrid)
- Build flexible CLI converter
- Add intelligent prerequisite parsing
- Comprehensive testing
- Timeline: 3-4 weeks

### Phase 3: Web App Integration (Papa Parse)
- Build import UI in React app
- Allow users to upload CSV directly
- Optional: Connect to Claude API for parsing
- Timeline: 2-3 weeks

### Phase 4: Live Sync (Optional)
- Implement Google Sheets fetching
- Add caching layer
- Rate limit handling
- Timeline: 1-2 weeks (depends on other work)

---

## Key Takeaways

1. **Prerequisite parsing is the hard problem**: Regex-based parsing handles 80% of cases but fails on complex logic. Claude API is the only approach that handles the full spectrum reliably.

2. **Non-technical users**: Google Apps Script is unbeatable for simplicity. Build a template they can use without leaving Sheets.

3. **Developer-facing tools**: Node.js CLI is flexible and maintainable. Perfect for teams and CI/CD integration.

4. **Web app import**: Papa Parse + Claude hybrid gives the best UX and reliability.

5. **Live data sync**: Publishing Google Sheets is tempting but risky (privacy/CORS issues). Better to fetch through your own server if needed.

6. **Cost vs. Effort Trade-off**:
   - No API cost? Use regex parsing (covers most cases)
   - Complex data? Invest in Claude API (reliable, not expensive)
   - User simplicity? Use Google Apps Script
   - Flexibility? Use Node.js + CLI

---

## Appendix: Code Templates

### Template 1: Prerequisite Parser (Regex-Based)

```javascript
function parsePrerequisites(text) {
  if (!text || text.toLowerCase() === 'none') {
    return { type: 'none', courses: [] };
  }

  // Normalize text
  text = text.trim();

  // Pattern: "Choose X of: A, B, C"
  const chooseMatch = text.match(
    /choose\s+(\d+)\s+(?:of|from)[:\s]+([\w\d,\s]+)/i
  );
  if (chooseMatch) {
    const count = parseInt(chooseMatch[1]);
    const courses = chooseMatch[2]
      .split(',')
      .map(c => c.trim())
      .filter(c => c);
    return { type: 'choose', courses, count };
  }

  // Pattern: "A AND B AND C"
  if (text.toUpperCase().includes(' AND ')) {
    const courses = text
      .split(/\s+and\s+/i)
      .map(c => c.trim())
      .filter(c => c);
    return { type: 'all', courses };
  }

  // Pattern: "A OR B OR C"
  if (text.toUpperCase().includes(' OR ')) {
    const courses = text
      .split(/\s+or\s+/i)
      .map(c => c.trim())
      .filter(c => c);
    return { type: 'any', courses };
  }

  // Single course
  return { type: 'all', courses: [text.trim()] };
}
```

### Template 2: Claude API Wrapper

```javascript
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

async function parsePrerequisitesWithClaude(text) {
  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Parse this course prerequisite text into JSON.

Text: "${text}"

Return ONLY valid JSON matching this schema:
{
  "type": "none" | "all" | "any" | "choose",
  "courses": ["CODE1", "CODE2"],
  "count": 1
}

- "none": No prerequisites required
- "all": All courses required (AND)
- "any": One course required (OR)
- "choose": Exactly N courses required

Be strict: Only return the JSON object, no other text.`
      }
    ]
  });

  try {
    const text = message.content[0].text;
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    throw new Error(`Invalid Claude response for prerequisite: "${text}"`);
  }
}

module.exports = { parsePrerequisitesWithClaude };
```

---

## References & Resources

### Official Documentation

- **Google Apps Script**: https://developers.google.com/apps-script
- **Papa Parse**: https://www.papaparse.com/docs
- **Node.js csv-parse**: https://csv.js.org/parse/
- **Node.js xlsx**: https://sheetjs.com/
- **Claude API**: https://docs.anthropic.com/claude/
- **Google Sheets API**: https://developers.google.com/sheets/api

### Related Tools

- **sheets2json**: https://sheets2json.com/ (Google Sheets to JSON)
- **csvjson.com**: https://csvjson.com/ (CSV to JSON converter)
- **Zapier**: https://zapier.com/ (No-code automation)
- **Make**: https://www.make.com/ (No-code automation)

---

**Document Status**: Complete research and analysis | **Last Updated**: March 14, 2026

For questions or clarifications on any approach, refer to the official documentation links above or test a proof-of-concept with your actual course data.
