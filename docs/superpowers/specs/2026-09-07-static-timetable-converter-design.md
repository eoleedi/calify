# Static Timetable Converter Redesign

## Summary

Replace the FastAPI runtime with a responsive, bilingual static web application. The application will parse supported timetable PDFs entirely in the browser, preview the detected courses, and download a weekly recurring iCalendar file. Uploaded files and extracted timetable data will never leave the user's device.

The redesign will also add NTNU semester `115-1`, running from September 7, 2026 through December 27, 2026.

## Goals

- Provide a polished browser interface for converting supported timetable PDFs to `.ics` files.
- Run without a backend and deploy as static files.
- Support Traditional Chinese and English through an in-page language switcher.
- Preserve the existing NTNU and TMU timetable formats.
- Let users verify parsed courses before downloading a calendar.
- Keep parsing logic isolated by school and covered by fixture-based tests.

## Non-Goals

- Parsing arbitrary timetable layouts.
- Supporting PDFs without embedded text, such as scanned images requiring OCR.
- Uploading, storing, or synchronizing user files or calendars.
- Adding accounts, analytics, or a database.
- Parsing pages after the first page, matching the current converter's behavior.

## Architecture

The new application will use Vite and vanilla JavaScript modules. PDF.js will read the first page of each selected PDF and expose its text items and page coordinates. No API server or Python runtime will be required in production.

The application will be separated into focused modules:

- UI state and rendering: controls the form, drag-and-drop area, course preview, progress states, errors, and download action.
- Internationalization: stores Traditional Chinese and English strings and applies the selected locale without reloading.
- PDF extraction: wraps PDF.js and returns normalized positioned text items.
- Layout normalization: groups positioned text into stable rows and columns.
- School parsers: convert normalized NTNU or TMU layouts into a shared course representation.
- Course normalization: validates courses and merges continuous sessions with the same name, weekday, and room.
- Calendar generation: serializes normalized courses into an RFC 5545 iCalendar document.
- Semester metadata: defines supported semester ranges by school, including NTNU `115-1` as `2026-09-07` through `2026-12-27`.

The existing Python implementation can remain as reference during migration, but the completed application will not depend on it at runtime.

## User Experience

The interface will use an editorial-campus visual direction: a warm ivory background, deep ink typography, a cobalt accent, and subtle timetable-grid details. The hierarchy will be typographic rather than card-heavy, with one prominent conversion panel.

The conversion flow is:

1. Choose NTNU or TMU.
2. Choose a timetable format supported by that school.
3. Choose a semester supported by that school.
4. Select or drag in a PDF.
5. Review the detected course names, weekdays, times, and rooms.
6. Download the generated `.ics` calendar.

A compact `繁中 / EN` control will switch all interface text immediately. The layout will use two columns where space permits and a single-column flow on mobile. Keyboard operation, visible focus states, sufficient contrast, and reduced-motion preferences will be supported.

## Data Flow

1. The user selects a PDF and the applicable school, format, and semester.
2. PDF.js loads the PDF locally and extracts positioned text from its first page.
3. The layout normalizer groups text items into rows and columns using coordinate tolerances.
4. The selected school parser maps the normalized layout into courses with `name`, `location`, `weekday`, `startTime`, and `endTime` fields.
5. Validation rejects malformed weekdays or times, and continuous sessions are merged.
6. The UI displays the normalized course list for confirmation.
7. Calendar generation finds the first matching weekday on or after the semester start and writes one weekly recurring event per course through the semester end.
8. The browser creates a UTF-8 calendar blob and triggers a local download.

Calendar output will escape text according to RFC 5545, use CRLF line endings, include stable event identifiers, and encode recurrence boundaries consistently. Generated local date-times will represent the timetable's wall-clock times without introducing an incorrect timezone conversion.

## Error Handling

The interface will provide localized, actionable errors for:

- Missing selections or files.
- Files that are not PDFs.
- Password-protected, corrupt, or unreadable PDFs.
- PDFs with no extractable text.
- Layouts that do not match the selected school and format.
- Parsed courses with invalid or missing names, weekdays, or times.
- Empty or suspiciously incomplete parse results.

An error will preserve the user's school, format, and semester selections. The application will not enable calendar download until at least one valid course is visible in the preview. Changing an input or choosing another file will clear stale preview and download state.

## Testing

Automated tests will cover:

- Semester metadata, including the NTNU `115-1` boundaries.
- Coordinate grouping and layout normalization.
- NTNU simple and full timetable parsing.
- TMU full timetable parsing.
- Continuous-session merging, including non-contiguous and differently located classes.
- iCalendar escaping, first-occurrence calculation, weekly recurrence, and end dates.
- Locale switching and localized validation messages.
- Form-state transitions from selection through preview and download.

Parser tests will use anonymized captured PDF.js text-item fixtures rather than personal timetable PDFs. These fixtures must preserve coordinates and text needed to represent each supported layout. Verification will include the automated test suite, a production build, and desktop/mobile browser smoke tests with representative PDFs.

## Migration And Deployment

The Vite production output will consist only of static assets suitable for GitHub Pages or any static host. The README will document local development, tests, production builds, supported PDF formats, and static deployment.

Migration is complete when the browser implementation produces equivalent course data and calendar recurrence for all supported fixtures. The Python backend files and dependencies will then be removed rather than maintained as a second implementation.
