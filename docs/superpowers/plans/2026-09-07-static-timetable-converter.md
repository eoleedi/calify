# Static Timetable Converter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Python API with a bilingual static web app that parses supported NTNU and TMU timetable PDFs locally and downloads recurring iCalendar files.

**Architecture:** A Vite application uses PDF.js to extract positioned text from the first PDF page. Small parser modules normalize text into a shared course model, which is previewed in the UI and serialized into RFC 5545 calendar data without sending files to a server.

**Tech Stack:** Vite 7, vanilla JavaScript ES modules, PDF.js (`pdfjs-dist`), Vitest, Testing Library DOM, jsdom, CSS

**Spec:** `docs/superpowers/specs/2026-09-07-static-timetable-converter-design.md`

## Global Constraints

- Production output must consist only of static assets; no API server or Python runtime.
- Parse only the first PDF page, matching current behavior.
- Uploaded files and extracted data must remain in the browser.
- Use Node.js `>=20.19.0` for Vite 7 development and builds.
- Support Traditional Chinese and English through an in-page `繁中 / EN` switcher.
- Preserve NTNU simple/full and TMU full timetable support.
- NTNU semester `115-1` runs from `2026-09-07` through `2026-12-27`.
- Reject scanned PDFs without embedded text; do not add OCR.
- Generate UTF-8 RFC 5545 calendars with CRLF line endings and local wall-clock date-times.
- Keep the user's existing `.gitignore` modification untouched.

---

### Task 1: Static App Foundation And Semester Metadata

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/semesters.js`
- Create: `src/semesters.test.js`
- Create: `src/test/setup.js`
- Create: `vite.config.js`
- Create: `vitest.config.js`
- Create: `public/favicon.svg`

**Interfaces:**
- Produces: `SCHOOLS: Record<string, SchoolConfig>` where `SchoolConfig` contains `name`, `formats`, and `semesters`.
- Produces: `getSchoolConfig(schoolId: string): SchoolConfig` and `getSemester(schoolId: string, semesterId: string): { id, startDate, endDate }`.
- Consumes: None.

- [ ] **Step 1: Write semester metadata tests**

```js
// src/semesters.test.js
import { describe, expect, it } from "vitest";
import { getSchoolConfig, getSemester } from "./semesters.js";

describe("semester metadata", () => {
  it("contains the approved NTNU 115-1 range", () => {
    expect(getSemester("ntnu", "115-1")).toEqual({
      id: "115-1",
      startDate: "2026-09-07",
      endDate: "2026-12-27",
    });
  });

  it("exposes only formats supported by each parser", () => {
    expect(getSchoolConfig("ntnu").formats.map(({ id }) => id)).toEqual([
      "simple",
      "full",
    ]);
    expect(getSchoolConfig("tmu").formats.map(({ id }) => id)).toEqual(["full"]);
  });

  it("rejects unknown schools and semesters", () => {
    expect(() => getSchoolConfig("unknown")).toThrow("Unsupported school");
    expect(() => getSemester("ntnu", "999-1")).toThrow("Unsupported semester");
  });
});
```

- [ ] **Step 2: Add Vite/Vitest configuration and run the failing test**

Create this package manifest, then configure Vitest for `jsdom`, globals disabled, and `src/test/setup.js` as the setup file.

```json
{
  "name": "calify",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "engines": { "node": ">=20.19.0" },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": { "pdfjs-dist": "^5.4.54" },
  "devDependencies": {
    "@testing-library/dom": "^10.4.1",
    "jsdom": "^26.1.0",
    "vite": "^7.1.4",
    "vitest": "^3.2.4"
  }
}
```

Run: `npm install && npm test -- --run src/semesters.test.js`

Expected: FAIL because `src/semesters.js` does not exist.

- [ ] **Step 3: Implement the supported-school metadata**

```js
// src/semesters.js
export const SCHOOLS = {
  ntnu: {
    name: { zh: "國立臺灣師範大學", en: "National Taiwan Normal University" },
    formats: [
      { id: "simple", label: { zh: "簡式課表", en: "Simple timetable" } },
      { id: "full", label: { zh: "完整課表", en: "Full timetable" } },
    ],
    semesters: [
      { id: "115-1", startDate: "2026-09-07", endDate: "2026-12-27" },
      { id: "114-2", startDate: "2026-02-23", endDate: "2026-06-14" },
      { id: "114-1", startDate: "2025-09-01", endDate: "2025-12-21" },
    ],
  },
  tmu: {
    name: { zh: "臺北醫學大學", en: "Taipei Medical University" },
    formats: [{ id: "full", label: { zh: "完整課表", en: "Full timetable" } }],
    semesters: [
      { id: "113-2", startDate: "2025-02-17", endDate: "2025-06-20" },
      { id: "113-1", startDate: "2024-09-09", endDate: "2025-01-10" },
    ],
  },
};

export function getSchoolConfig(schoolId) {
  const school = SCHOOLS[schoolId];
  if (!school) throw new Error(`Unsupported school: ${schoolId}`);
  return school;
}

export function getSemester(schoolId, semesterId) {
  const semester = getSchoolConfig(schoolId).semesters.find(({ id }) => id === semesterId);
  if (!semester) throw new Error(`Unsupported semester: ${semesterId}`);
  return semester;
}
```

Create a semantic `index.html` with `#app`, a descriptive title, viewport metadata, and a module script for `/src/main.js`. Keep `src/main.js` minimal until Task 7.

- [ ] **Step 4: Verify tests and production scaffolding**

Run: `npm test -- --run src/semesters.test.js && npm run build`

Expected: 3 tests PASS and Vite writes `dist/index.html` plus hashed assets.

- [ ] **Step 5: Commit the foundation**

```bash
git add package.json package-lock.json index.html vite.config.js vitest.config.js public/favicon.svg src/main.js src/semesters.js src/semesters.test.js src/test/setup.js
git commit -m "build: scaffold static timetable app"
```

---

### Task 2: Course Validation And Session Merging

**Files:**
- Create: `src/courses.js`
- Create: `src/courses.test.js`

**Interfaces:**
- Produces: `normalizeCourse(value: object): Course` where `Course` is `{ name: string, location: string, weekday: 1|2|3|4|5|6|7, startTime: string, endTime: string }`.
- Produces: `mergeContinuousSessions(courses: Course[], maxGapMinutes?: number): Course[]` with a default 20-minute gap.
- Consumes: Raw course objects returned by Tasks 5 and 6.

- [ ] **Step 1: Write validation and merging tests**

```js
// src/courses.test.js
import { describe, expect, it } from "vitest";
import { mergeContinuousSessions, normalizeCourse } from "./courses.js";

const algebra = {
  name: "線性代數",
  location: "誠 101",
  weekday: 1,
  startTime: "09:10",
  endTime: "10:00",
};

describe("normalizeCourse", () => {
  it("trims text and accepts a valid course", () => {
    expect(normalizeCourse({ ...algebra, name: " 線性代數 ", location: " 誠 101 " })).toEqual(algebra);
  });

  it.each([
    [{ ...algebra, weekday: 0 }, "weekday"],
    [{ ...algebra, startTime: "9:10" }, "startTime"],
    [{ ...algebra, endTime: "08:00" }, "endTime"],
    [{ ...algebra, name: "" }, "name"],
  ])("rejects malformed course data", (course, field) => {
    expect(() => normalizeCourse(course)).toThrow(field);
  });
});

describe("mergeContinuousSessions", () => {
  it("merges matching sessions separated by no more than 20 minutes", () => {
    const result = mergeContinuousSessions([
      algebra,
      { ...algebra, startTime: "10:10", endTime: "11:00" },
    ]);
    expect(result).toEqual([{ ...algebra, endTime: "11:00" }]);
  });

  it("does not merge different rooms or gaps over 20 minutes", () => {
    const courses = [
      algebra,
      { ...algebra, location: "誠 102", startTime: "10:10", endTime: "11:00" },
      { ...algebra, startTime: "10:30", endTime: "11:20" },
    ];
    expect(mergeContinuousSessions(courses)).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run the tests and confirm the missing module failure**

Run: `npm test -- --run src/courses.test.js`

Expected: FAIL because `src/courses.js` does not exist.

- [ ] **Step 3: Implement deterministic normalization and merging**

Use an anchored `HH:MM` expression, convert times to minutes for comparisons, sort a copied array by weekday/start time, and merge only adjacent sessions with identical name, location, and weekday whose gap is between zero and `maxGapMinutes`. Do not mutate caller-owned course objects or splice an array while iterating.

```js
export function normalizeCourse(value) {
  const course = { ...value, name: value.name?.trim(), location: value.location?.trim() ?? "" };
  if (!course.name) throw new Error("Invalid course name");
  if (!Number.isInteger(course.weekday) || course.weekday < 1 || course.weekday > 7) {
    throw new Error("Invalid course weekday");
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(course.startTime)) throw new Error("Invalid course startTime");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(course.endTime)) throw new Error("Invalid course endTime");
  if (toMinutes(course.endTime) <= toMinutes(course.startTime)) throw new Error("Invalid course endTime");
  return course;
}
```

- [ ] **Step 4: Run all course tests**

Run: `npm test -- --run src/courses.test.js`

Expected: 7 tests PASS.

- [ ] **Step 5: Commit the course model**

```bash
git add src/courses.js src/courses.test.js
git commit -m "feat: normalize timetable courses"
```

---

### Task 3: RFC 5545 Calendar Generation

**Files:**
- Create: `src/calendar.js`
- Create: `src/calendar.test.js`

**Interfaces:**
- Consumes: `Course[]` from `src/courses.js` and `{ id, startDate, endDate }` from `src/semesters.js`.
- Produces: `generateCalendar(courses: Course[], semester: Semester): string`.
- Produces: `downloadCalendar(contents: string, filename?: string): void`.

- [ ] **Step 1: Write calendar serialization tests**

```js
// src/calendar.test.js
import { describe, expect, it } from "vitest";
import { generateCalendar } from "./calendar.js";

const semester = { id: "115-1", startDate: "2026-09-07", endDate: "2026-12-27" };

describe("generateCalendar", () => {
  it("uses the first matching weekday and approved recurrence boundary", () => {
    const ics = generateCalendar([{
      name: "資料結構",
      location: "科技 101",
      weekday: 3,
      startTime: "09:10",
      endTime: "11:00",
    }], semester);
    expect(ics).toContain("DTSTART:20260909T091000");
    expect(ics).toContain("DTEND:20260909T110000");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;UNTIL=20261227T235959");
  });

  it("escapes RFC 5545 text and uses CRLF only", () => {
    const ics = generateCalendar([{
      name: "設計,研究;專題\\A",
      location: "教室\n二樓",
      weekday: 1,
      startTime: "08:10",
      endTime: "09:00",
    }], semester);
    expect(ics).toContain("SUMMARY:設計\\,研究\\;專題\\\\A");
    expect(ics).toContain("LOCATION:教室\\n二樓");
    expect(ics.replaceAll("\r\n", "")).not.toContain("\n");
  });

  it("generates stable unique UIDs for different courses", () => {
    const ics = generateCalendar([
      { name: "A", location: "1", weekday: 1, startTime: "08:00", endTime: "09:00" },
      { name: "B", location: "1", weekday: 1, startTime: "09:00", endTime: "10:00" },
    ], semester);
    const uids = [...ics.matchAll(/^UID:(.+)$/gm)].map((match) => match[1].trim());
    expect(new Set(uids).size).toBe(2);
  });
});
```

- [ ] **Step 2: Run the tests and confirm failure**

Run: `npm test -- --run src/calendar.test.js`

Expected: FAIL because `src/calendar.js` does not exist.

- [ ] **Step 3: Implement calendar serialization**

Implement UTC-free local values in `YYYYMMDDTHHMMSS` form, an `escapeText` helper for backslash/newline/comma/semicolon, a deterministic hash from course fields for `UID`, `PRODID:-//Calify//Timetable Converter//EN`, and CRLF joining with a final CRLF. Calculate the first occurrence by adding `(course.weekday - isoWeekday(start) + 7) % 7` days. Throw if no course is supplied or an occurrence falls after the semester end.

`downloadCalendar` must create `new Blob([contents], { type: "text/calendar;charset=utf-8" })`, click a temporary object URL anchor, then revoke the URL.

- [ ] **Step 4: Verify calendar tests**

Run: `npm test -- --run src/calendar.test.js`

Expected: 3 tests PASS.

- [ ] **Step 5: Commit calendar generation**

```bash
git add src/calendar.js src/calendar.test.js
git commit -m "feat: generate recurring calendar files"
```

---

### Task 4: Browser PDF Extraction And Coordinate Normalization

**Files:**
- Create: `src/pdf/extract.js`
- Create: `src/pdf/layout.js`
- Create: `src/pdf/layout.test.js`

**Interfaces:**
- Produces: `extractFirstPage(file: File): Promise<TextItem[]>`, where `TextItem` is `{ text: string, x: number, y: number, width: number, height: number }`.
- Produces: `groupRows(items: TextItem[], yTolerance?: number): TextItem[][]`.
- Produces: `assignColumns(row: TextItem[], anchors: number[], tolerance?: number): string[]`.
- Consumes: `pdfjs-dist` and a browser `File`.

- [ ] **Step 1: Write coordinate-normalization tests**

```js
// src/pdf/layout.test.js
import { describe, expect, it } from "vitest";
import { assignColumns, groupRows } from "./layout.js";

describe("groupRows", () => {
  it("groups nearby y coordinates and sorts each row left to right", () => {
    const items = [
      { text: "Tue", x: 150, y: 700, width: 20, height: 10 },
      { text: "Period", x: 20, y: 700.8, width: 35, height: 10 },
      { text: "Mon", x: 90, y: 699.3, width: 20, height: 10 },
      { text: "1", x: 20, y: 660, width: 8, height: 10 },
    ];
    expect(groupRows(items, 2).map((row) => row.map(({ text }) => text))).toEqual([
      ["Period", "Mon", "Tue"],
      ["1"],
    ]);
  });
});

describe("assignColumns", () => {
  it("joins wrapped text assigned to the same nearest column", () => {
    const row = [
      { text: "Data", x: 91, y: 600, width: 20, height: 10 },
      { text: "Structures", x: 110, y: 600, width: 35, height: 10 },
      { text: "Room 2", x: 201, y: 600, width: 30, height: 10 },
    ];
    expect(assignColumns(row, [20, 90, 200], 30)).toEqual(["", "Data Structures", "Room 2"]);
  });
});
```

- [ ] **Step 2: Run normalization tests and confirm failure**

Run: `npm test -- --run src/pdf/layout.test.js`

Expected: FAIL because `src/pdf/layout.js` does not exist.

- [ ] **Step 3: Implement deterministic coordinate grouping**

Filter empty text, sort rows from highest y to lowest y, group items whose y differs from the current row baseline by at most `yTolerance`, and sort row members by x. Assign each item to its nearest anchor when within `tolerance`; join multiple fragments with one space and trim cells.

- [ ] **Step 4: Wrap PDF.js first-page extraction**

Configure the PDF.js worker through `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)`. Read `await file.arrayBuffer()`, load the document, reject encrypted/unreadable input with an `Error("pdf-unreadable")`, reject empty text with `Error("pdf-no-text")`, and map each PDF.js text item using `item.transform[4]` for x and `item.transform[5]` for y.

- [ ] **Step 5: Verify layout tests and production worker bundling**

Run: `npm test -- --run src/pdf/layout.test.js && npm run build`

Expected: 2 tests PASS and `dist/assets` contains a PDF worker asset.

- [ ] **Step 6: Commit PDF extraction**

```bash
git add src/pdf/extract.js src/pdf/layout.js src/pdf/layout.test.js
git commit -m "feat: extract browser pdf layouts"
```

---

### Task 5: NTNU Timetable Parsers

**Files:**
- Create: `src/parsers/ntnu.js`
- Create: `src/parsers/ntnu.test.js`
- Create: `src/parsers/parser.js`
- Create: `src/parsers/fixtures/ntnu-simple.js`
- Create: `src/parsers/fixtures/ntnu-full.js`

**Interfaces:**
- Consumes: `TextItem[]`, `groupRows`, `assignColumns`, `normalizeCourse`, and `mergeContinuousSessions`.
- Produces: `parseNtnuSimple(items: TextItem[]): Course[]`.
- Produces: `parseNtnuFull(items: TextItem[]): Course[]`.
- Produces through `src/parsers/parser.js`: `parseTimetable(items: TextItem[], schoolId: string, formatId: string): Course[]`.

- [ ] **Step 1: Capture anonymized NTNU text-item fixtures**

Represent the minimum complete layouts in JavaScript arrays. The simple fixture must include the headers `課程中文名稱`, `上課時間`, `上課教室`, and `星期`, plus one Monday course split into two adjacent periods. The full fixture must include weekday headers containing `MON` through `SUN`, period/time rows, one multiline course cell, and the trailing `@無節次或密集課程` row. Use realistic x/y coordinates and no personal identifiers.

- [ ] **Step 2: Write parser behavior tests**

```js
// src/parsers/ntnu.test.js
import { describe, expect, it } from "vitest";
import { parseTimetable } from "./parser.js";
import { ntnuSimpleItems } from "./fixtures/ntnu-simple.js";
import { ntnuFullItems } from "./fixtures/ntnu-full.js";

describe("NTNU parsers", () => {
  it("parses and merges a simple timetable", () => {
    expect(parseTimetable(ntnuSimpleItems, "ntnu", "simple")).toEqual([{
      name: "教育心理學",
      location: "教 201",
      weekday: 1,
      startTime: "09:10",
      endTime: "11:00",
    }]);
  });

  it("parses a full timetable course and ignores the trailing note", () => {
    expect(parseTimetable(ntnuFullItems, "ntnu", "full")).toEqual([{
      name: "資料結構",
      location: "科技 101",
      weekday: 3,
      startTime: "13:20",
      endTime: "15:10",
    }]);
  });

  it("rejects a mismatched NTNU layout", () => {
    expect(() => parseTimetable(ntnuSimpleItems, "ntnu", "full")).toThrow("layout-unsupported");
  });
});
```

- [ ] **Step 3: Run NTNU parser tests and confirm failure**

Run: `npm test -- --run src/parsers/ntnu.test.js`

Expected: FAIL because parser modules do not exist.

- [ ] **Step 4: Implement NTNU simple parsing**

Locate the required Chinese header row rather than relying on absolute page coordinates. Use its cell x positions as anchors, map subsequent rows to the four fields, parse `HH:MM - HH:MM`, map `一` through `日` to weekdays 1 through 7, and stop at the next unrelated section. Normalize and merge the result.

- [ ] **Step 5: Implement NTNU full parsing and dispatch**

Locate the row containing weekday tokens `MON` through `SUN`, use the first period column plus weekday x positions as anchors, associate each course cell with the closest preceding time range, split the final non-empty line in a cell as location, and join preceding lines as course name. Ignore the dense-course note row. Dispatch only the exact combinations `ntnu/simple`, `ntnu/full`, and later `tmu/full`; throw `Error("layout-unsupported")` for unknown combinations or missing signatures.

- [ ] **Step 6: Verify all NTNU tests**

Run: `npm test -- --run src/parsers/ntnu.test.js src/courses.test.js`

Expected: all tests PASS.

- [ ] **Step 7: Commit NTNU support**

```bash
git add src/parsers src/courses.js
git commit -m "feat: parse NTNU timetables in browser"
```

---

### Task 6: TMU Full Timetable Parser

**Files:**
- Create: `src/parsers/tmu.js`
- Create: `src/parsers/tmu.test.js`
- Create: `src/parsers/fixtures/tmu-full.js`
- Modify: `src/parsers/parser.js`

**Interfaces:**
- Consumes: the same shared PDF layout and course helpers as Task 5.
- Produces: `parseTmuFull(items: TextItem[]): Course[]`.
- Extends: `parseTimetable` with the `tmu/full` dispatch combination.

- [ ] **Step 1: Capture an anonymized TMU fixture and failing test**

The fixture must include time, period, and seven weekday columns. Include one course whose cell has a code line, a course-name line, and a final room line, spanning two adjacent periods.

```js
// src/parsers/tmu.test.js
import { describe, expect, it } from "vitest";
import { parseTimetable } from "./parser.js";
import { tmuFullItems } from "./fixtures/tmu-full.js";

describe("TMU parser", () => {
  it("parses a full timetable and merges adjacent periods", () => {
    expect(parseTimetable(tmuFullItems, "tmu", "full")).toEqual([{
      name: "生理學",
      location: "醫綜 3101",
      weekday: 2,
      startTime: "08:10",
      endTime: "10:00",
    }]);
  });
});
```

- [ ] **Step 2: Run the TMU test and confirm failure**

Run: `npm test -- --run src/parsers/tmu.test.js`

Expected: FAIL with `layout-unsupported`.

- [ ] **Step 3: Implement TMU parsing**

Detect the two left columns from time and period headers and derive seven weekday anchors from the remaining header positions. Parse each time cell's first and last `HH:MM` values, discard the first line of each populated course cell as its course code, use the final line as location, and join intervening lines as the course name. Normalize and merge results, and throw `Error("layout-unsupported")` if required headers or courses are absent.

- [ ] **Step 4: Verify all parser suites**

Run: `npm test -- --run src/parsers`

Expected: NTNU and TMU parser tests PASS.

- [ ] **Step 5: Commit TMU support**

```bash
git add src/parsers/tmu.js src/parsers/tmu.test.js src/parsers/fixtures/tmu-full.js src/parsers/parser.js
git commit -m "feat: parse TMU timetables in browser"
```

---

### Task 7: Bilingual Conversion Interface

**Files:**
- Create: `src/i18n.js`
- Create: `src/i18n.test.js`
- Create: `src/app.js`
- Create: `src/app.test.js`
- Create: `src/styles.css`
- Modify: `src/main.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: school metadata, `extractFirstPage`, `parseTimetable`, `generateCalendar`, and `downloadCalendar`.
- Produces: `createApp(root: HTMLElement, dependencies?: object): { destroy(): void }`.
- Produces: `translate(locale: "zh"|"en", key: string, variables?: object): string`.

- [ ] **Step 1: Write locale tests**

```js
// src/i18n.test.js
import { describe, expect, it } from "vitest";
import { translate } from "./i18n.js";

describe("translate", () => {
  it("returns both supported locales", () => {
    expect(translate("zh", "hero.title")).toBe("把課表，放進你的行事曆");
    expect(translate("en", "hero.title")).toBe("Turn your timetable into time");
  });

  it("interpolates values and rejects missing keys", () => {
    expect(translate("en", "preview.count", { count: 2 })).toBe("2 courses found");
    expect(() => translate("en", "missing.key")).toThrow("Missing translation");
  });
});
```

- [ ] **Step 2: Write UI flow tests with injected dependencies**

```js
// src/app.test.js
import { fireEvent, getByLabelText, getByRole, queryByText } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";

const course = { name: "資料結構", location: "科技 101", weekday: 3, startTime: "09:10", endTime: "11:00" };

describe("conversion interface", () => {
  beforeEach(() => { document.body.innerHTML = '<main id="app"></main>'; });

  it("switches locale and updates visible copy", () => {
    createApp(document.querySelector("#app"));
    fireEvent.click(getByRole(document.body, "button", { name: "EN" }));
    expect(queryByText(document.body, "Turn your timetable into time")).not.toBeNull();
  });

  it("parses a PDF, previews courses, and enables download", async () => {
    const extract = vi.fn().mockResolvedValue([{ text: "fixture", x: 0, y: 0, width: 1, height: 1 }]);
    const parse = vi.fn().mockReturnValue([course]);
    const download = vi.fn();
    createApp(document.querySelector("#app"), { extractFirstPage: extract, parseTimetable: parse, downloadCalendar: download });
    const file = new File(["pdf"], "schedule.pdf", { type: "application/pdf" });
    fireEvent.change(getByLabelText(document.body, "選擇 PDF"), { target: { files: [file] } });
    await vi.waitFor(() => expect(queryByText(document.body, "資料結構")).not.toBeNull());
    fireEvent.click(getByRole(document.body, "button", { name: "下載行事曆" }));
    expect(download).toHaveBeenCalledOnce();
  });

  it("shows a localized error for non-PDF input", () => {
    createApp(document.querySelector("#app"));
    const file = new File(["text"], "notes.txt", { type: "text/plain" });
    fireEvent.change(getByLabelText(document.body, "選擇 PDF"), { target: { files: [file] } });
    expect(queryByText(document.body, "請選擇 PDF 檔案")).not.toBeNull();
  });
});
```

- [ ] **Step 3: Run UI tests and confirm failure**

Run: `npm test -- --run src/i18n.test.js src/app.test.js`

Expected: FAIL because `i18n.js` and `app.js` do not exist.

- [ ] **Step 4: Implement complete bilingual copy and state flow**

Define translation keys for hero text, privacy note, every label and option, upload instructions, processing state, preview headings, weekday names, download action, reset action, and each error code: `file-required`, `file-type`, `pdf-unreadable`, `pdf-no-text`, `layout-unsupported`, `courses-empty`, and `conversion-failed`.

Render semantic controls with associated labels. Changing school must repopulate formats and semesters from `SCHOOLS`; changing school, format, semester, or file must clear stale preview/calendar state. Parse immediately after a valid PDF is selected. Inject real dependencies by default and permit test overrides through the `dependencies` argument. Revoke stale object URLs through `downloadCalendar` and remove registered event listeners in `destroy`.

- [ ] **Step 5: Implement the editorial-campus responsive styling**

Use CSS custom properties for ivory, ink, cobalt, muted red, border, and success colors. Use a distinctive serif display stack and a legible sans-serif UI stack without downloading web fonts. Add subtle timetable-grid lines with layered CSS gradients, an asymmetric desktop composition, one-column layout below `760px`, visible `:focus-visible` outlines, a dashed drag target with hover/drag states, tabular-number styling for times, and restrained transitions disabled by `prefers-reduced-motion`.

Do not use generic dashboard cards, excessive rounded containers, gradients on text, icon-only controls, or horizontal scrolling. Ensure tap targets are at least 44px and errors use both text and color.

- [ ] **Step 6: Wire the application entry point**

`src/main.js` must import `src/styles.css` and call `createApp(document.querySelector("#app"))`. Update `index.html` language metadata and fallback copy while retaining the semantic root and module entry.

- [ ] **Step 7: Verify UI behavior and production build**

Run: `npm test -- --run src/i18n.test.js src/app.test.js && npm run build`

Expected: locale and conversion flow tests PASS; production build succeeds.

- [ ] **Step 8: Commit the interface**

```bash
git add index.html src/main.js src/i18n.js src/i18n.test.js src/app.js src/app.test.js src/styles.css
git commit -m "feat: add bilingual timetable interface"
```

---

### Task 8: End-To-End Verification, Documentation, And Backend Removal

**Files:**
- Create: `src/conversion.integration.test.js`
- Modify: `README.md`
- Modify: `.gitignore`
- Delete: `app/__init__.py`
- Delete: `app/api.py`
- Delete: `app/course.py`
- Delete: `app/main.py`
- Delete: `app/utils.py`
- Delete: `app/parser/__init__.py`
- Delete: `app/parser/factory.py`
- Delete: `app/parser/ntnu.py`
- Delete: `app/parser/tmuh.py`
- Delete: `demo.py`
- Delete: `reader.py`
- Delete: `requirements.txt`

**Interfaces:**
- Consumes: all production modules and anonymized parser fixtures.
- Produces: a documented static application with no runtime backend.

- [ ] **Step 1: Write end-to-end module integration tests**

```js
// src/conversion.integration.test.js
import { describe, expect, it } from "vitest";
import { generateCalendar } from "./calendar.js";
import { getSemester } from "./semesters.js";
import { ntnuFullItems } from "./parsers/fixtures/ntnu-full.js";
import { parseTimetable } from "./parsers/parser.js";

describe("static conversion pipeline", () => {
  it("converts an NTNU fixture into a recurring calendar", () => {
    const courses = parseTimetable(ntnuFullItems, "ntnu", "full");
    const calendar = generateCalendar(courses, getSemester("ntnu", "115-1"));
    expect(calendar).toContain("SUMMARY:資料結構");
    expect(calendar).toContain("DTSTART:20260909T132000");
    expect(calendar).toContain("RRULE:FREQ=WEEKLY;UNTIL=20261227T235959");
    expect(calendar).toContain("LOCATION:科技 101");
  });
});
```

- [ ] **Step 2: Run the integration test**

Run: `npm test -- --run src/conversion.integration.test.js`

Expected: PASS using only JavaScript modules.

- [ ] **Step 3: Rewrite project documentation**

Document the privacy guarantee, NTNU/TMU support matrix, NTNU `115-1` dates, embedded-text PDF requirement, `npm install`, `npm run dev`, `npm test -- --run`, `npm run build`, and static hosting of `dist/`. Include a GitHub Pages note that Vite's `base` must match the repository path when deployed below a domain root.

- [ ] **Step 4: Remove the superseded backend**

Delete the Python app, scripts, and requirements listed above only after integration tests pass. Add only generated Node/Vite paths such as `node_modules/`, `dist/`, and coverage output to `.gitignore`; preserve the user's existing `.opencode/` entry and all earlier ignore rules.

- [ ] **Step 5: Run complete automated verification**

Run: `npm test -- --run && npm run build`

Expected: all tests PASS and a production `dist/` is generated without Python or server dependencies.

- [ ] **Step 6: Perform responsive and privacy smoke tests**

Run: `npm run dev -- --host 127.0.0.1`

Verify at desktop and mobile widths that the language switch, keyboard focus order, school-dependent options, drag-and-drop state, course preview, reset path, and `.ics` download work. In browser developer tools, confirm selecting and converting a PDF creates no network request beyond loading local development assets.

- [ ] **Step 7: Commit migration completion**

```bash
git add README.md .gitignore src/conversion.integration.test.js app demo.py reader.py requirements.txt
git commit -m "refactor: complete static browser migration"
```

- [ ] **Step 8: Inspect the final change set**

Run: `git status --short && git log --oneline -10`

Expected: no uncommitted implementation files; the pre-existing `.gitignore` change is included intentionally without losing `.opencode/`; recent history shows each independently verified implementation task.
