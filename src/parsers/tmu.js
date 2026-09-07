import { assignColumns, groupRows } from "../pdf/layout.js";
import { mergeContinuousSessions, normalizeCourse } from "../courses.js";

const TIME_HEADERS = new Set(["上課時間", "課程時間", "時間"]);
const PERIOD_HEADERS = new Set(["節次", "節"]);
const TIME_VALUE = /(?:[01]\d|2[0-3]):[0-5]\d/g;

function findHeader(rows) {
  return rows.findIndex((row) => {
    const values = row.map((item) => item.text.trim());
    return values.some((value) => TIME_HEADERS.has(value)) && values.some((value) => PERIOD_HEADERS.has(value));
  });
}

function parseTime(value) {
  const times = [...value.matchAll(TIME_VALUE)].map((match) => match[0]);
  if (times.length < 2) return null;
  return { startTime: times[0], endTime: times.at(-1) };
}

function columnTolerance(anchors) {
  const gaps = anchors.slice(1).map((anchor, index) => anchor - anchors[index]).filter((gap) => gap > 0);
  return gaps.length ? Math.min(...gaps) / 2 : 45;
}

function parseCourseCell(items) {
  const lines = items.flatMap((item) => item.text.split(/\r?\n/)).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 3) return null;
  return { name: lines.slice(1, -1).join(""), location: lines.at(-1) };
}

export function parseTmuFull(items) {
  const rows = groupRows(items);
  const headerIndex = findHeader(rows);
  if (headerIndex === -1) throw new Error("layout-unsupported");

  const header = rows[headerIndex];
  const timeHeader = header.find((item) => TIME_HEADERS.has(item.text.trim()));
  const periodHeader = header.find((item) => PERIOD_HEADERS.has(item.text.trim()));
  const dayHeaders = header
    .filter((item) => item !== timeHeader && item !== periodHeader)
    .sort((a, b) => a.x - b.x);
  if (dayHeaders.length < 7) throw new Error("layout-unsupported");

  const dayAnchors = dayHeaders.slice(0, 7).map((item, index) => [item.x, index + 1]);
  const anchors = [timeHeader.x, periodHeader.x, ...dayAnchors.map(([x]) => x)];
  const tolerance = columnTolerance(anchors);
  const courses = [];

  for (const row of rows.slice(headerIndex + 1)) {
    const columns = assignColumns(row, anchors, tolerance);
    const time = parseTime(columns[0]);
    if (!time) continue;

    const assigned = row.map((item) => {
      const column = assignColumns([item], anchors, tolerance);
      return { item, index: column.findIndex((value) => value !== "") };
    });
    for (let dayIndex = 0; dayIndex < dayAnchors.length; dayIndex += 1) {
      const cell = parseCourseCell(assigned.filter(({ index }) => index === dayIndex + 2).map(({ item }) => item));
      if (cell) courses.push(normalizeCourse({ ...cell, weekday: dayIndex + 1, ...time }));
    }
  }

  if (!courses.length) throw new Error("layout-unsupported");
  return mergeContinuousSessions(courses);
}
