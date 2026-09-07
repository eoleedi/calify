# Task 8 Report

## RED/GREEN

### RED

No intentional failing test was recorded: the JavaScript production pipeline
was already implemented by the preceding migration tasks, and this task added
an integration assertion against that pipeline before backend removal.

### GREEN

The new fixture-driven integration test passed before deleting the Python
runtime. The complete suite then passed after deletion.

## Verification

Commands and results:

- `npm test -- --run src/conversion.integration.test.js`: 1 test passed.
- `npm test -- --run`: 9 test files and 39 tests passed.
- `npm run build`: passed; Vite generated `dist/` with the application bundle,
  PDF worker, extractor chunk, CSS, and HTML.
- `npm run dev -- --host 127.0.0.1` followed by
  `curl --fail --silent --show-error http://127.0.0.1:5173/`: passed; the
  development HTML was served successfully.
- `git diff --check`: passed before commit.
- Source audit for `fetch`, `XMLHttpRequest`, `WebSocket`,
  `navigator.sendBeacon`, and `axios` under `src/`: no matches. Upload and
  conversion are local-only.

## Changed And Deleted Files

Changed:

- `src/conversion.integration.test.js`: end-to-end NTNU fixture conversion
  coverage.
- `README.md`: privacy guarantee, support matrix, NTNU `115-1` dates,
  embedded-text requirement, development commands, static hosting, and
  GitHub Pages `base` guidance.
- `.gitignore`: preserved all prior rules and added `node_modules/`, `dist/`,
  `coverage/`, and `.opencode/`.

Deleted superseded Python runtime:

- `app/__init__.py`, `app/api.py`, `app/course.py`, `app/main.py`,
  `app/utils.py`
- `app/parser/__init__.py`, `app/parser/factory.py`, `app/parser/ntnu.py`,
  `app/parser/tmuh.py`
- `demo.py`, `reader.py`, `requirements.txt`

## Smoke Checks

Existing jsdom interface tests cover locale switching, keyboard activation,
drag-and-drop, PDF validation, conversion preview, calendar download wiring,
reset behavior, stale request cancellation, destruction during parsing, and
literal rendering of course text. The dev server smoke check confirmed the
static entry point loads.

Direct desktop/mobile browser inspection and browser DevTools network capture
were not available in this environment. No representative personal PDFs are
stored in the repository, so real-PDF verification is a residual limitation;
verification uses anonymized parser fixtures.

## Self-Review

- The integration test asserts parsed course content, semester-bounded weekly
  recurrence, date/time, and location.
- Python runtime files were removed only after the focused integration test
  passed.
- The ignore update retains the existing input/output, editor, macOS, and
  Python rules, including the required `.opencode/` entry.
- Generated `dist/` and `node_modules/` remain uncommitted and are ignored.

## Commit

- `24bd010 refactor: complete static browser migration`
