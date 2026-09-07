# Calify

Calify converts supported university timetable PDFs into recurring `.ics`
calendar files entirely in the browser. The upload, PDF text extraction,
parsing, and calendar generation pipeline does not send the selected PDF or
course data to a server. No network operation is coded in the upload or
conversion path.

## Supported formats

| School | Formats | Semesters |
| --- | --- | --- |
| NTNU | Simple and full timetable | `115-1` (`2026-09-07` to `2026-12-27`), `114-2`, `114-1` |
| TMU | Full timetable | `113-2`, `113-1` |

The NTNU `115-1` dates are Monday, September 7, 2026 through Sunday,
December 27, 2026. Semester dates are used to bound recurring calendar
events.

PDFs must contain embedded/selectable text. Scanned image-only PDFs are not
supported unless they have already been processed with OCR. The repository's
automated verification uses anonymized parser fixtures; it does not include
representative personal PDFs.

## Development

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev
npm test -- --run
npm run build
```

The production build is written to `dist/` and can be hosted as a static site
on any static hosting provider. For GitHub Pages deployments below a domain
root, set Vite's `base` to the repository path (for example,
`base: "/calify/"`) before building.
