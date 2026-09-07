# Task 5 Report

## RED/GREEN Evidence

- RED: `npm test -- --run src/parsers/ntnu.test.js` failed during module resolution because `src/parsers/parser.js` did not exist.
- GREEN: `npm test -- --run src/parsers/ntnu.test.js src/courses.test.js` passed: 2 test files, 10 tests.
- Full suite: `npm test -- --run` passed: 5 test files, 22 tests.
- Diff validation: `git diff --check` passed.

## Files

- `src/parsers/ntnu.js`: layout-signature-driven simple and full NTNU parsers using `groupRows`, `assignColumns`, normalization, and continuous-session merging.
- `src/parsers/parser.js`: exact NTNU format dispatch and unsupported-layout errors.
- `src/parsers/fixtures/ntnu-simple.js`: anonymized simple-layout coordinate fixture with adjacent Monday periods and unrelated trailing section.
- `src/parsers/fixtures/ntnu-full.js`: anonymized full-layout coordinate fixture with MON-SUN header, period/time rows, separate multiline cell items, and dense-course note.
- `src/parsers/ntnu.test.js`: simple, full, merge, note-ignore, and layout-mismatch behavior tests.

## Self-Review

- Header discovery uses required labels and weekday signatures instead of page-absolute coordinates.
- Full cells aggregate adjacent same-day positioned items and treat the final line as location.
- Simple parsing stops at the first row without a valid time range, preventing unrelated sections from becoming courses.
- All emitted courses pass `normalizeCourse`; outputs pass `mergeContinuousSessions`.
- Fixtures contain no personal identifiers and exercise coordinate shifts, column mapping, multiline cells, merging, and mismatch behavior.

## Concerns

- The parser dispatch intentionally does not implement `tmu/full`; that parser is outside Task 5 and should be added when TMU support is implemented.
