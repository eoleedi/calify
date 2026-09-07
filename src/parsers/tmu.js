import { assignColumns, groupRows } from "../pdf/layout.js";
import { mergeContinuousSessions, normalizeCourse } from "../courses.js";

const TIME_HEADERS = new Set(["上課時間", "課程時間", "時間"]);
const PERIOD_HEADERS = new Set(["節次", "節"]);
const TIME_VALUE = /(?:[01]\d|2[0-3]):[0-5]\d/g;
const WEEKDAY_LABELS = new Map([
  ["1", 1], ["一", 1], ["星期一", 1], ["週一", 1], ["周一", 1], ["MON", 1],
  ["2", 2], ["二", 2], ["星期二", 2], ["週二", 2], ["周二", 2], ["TUE", 2],
  ["3", 3], ["三", 3], ["星期三", 3], ["週三", 3], ["周三", 3], ["WED", 3],
  ["4", 4], ["四", 4], ["星期四", 4], ["週四", 4], ["周四", 4], ["THU", 4],
  ["5", 5], ["五", 5], ["星期五", 5], ["週五", 5], ["周五", 5], ["FRI", 5],
  ["6", 6], ["六", 6], ["星期六", 6], ["週六", 6], ["周六", 6], ["SAT", 6],
  ["7", 7], ["日", 7], ["星期日", 7], ["週日", 7], ["周日", 7], ["SUN", 7],
]);

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

function parseWeekdayLabel(value) {
  return WEEKDAY_LABELS.get(value.trim().toUpperCase()) ?? null;
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
  const weekdayHeaders = header
    .filter((item) => item !== timeHeader && item !== periodHeader)
    .map((item) => ({ item, weekday: parseWeekdayLabel(item.text) }))
    .filter(({ weekday }) => weekday !== null);
  if (weekdayHeaders.length !== 7 || new Set(weekdayHeaders.map(({ weekday }) => weekday)).size !== 7) {
    throw new Error("layout-unsupported");
  }

  const dayColumns = weekdayHeaders
    .map(({ item, weekday }) => [item.x, weekday])
    .sort((a, b) => a.x - b.x);
  const anchors = [timeHeader.x, periodHeader.x, ...dayColumns.map(([x]) => x)];
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
    for (let dayIndex = 0; dayIndex < dayColumns.length; dayIndex += 1) {
      const cell = parseCourseCell(assigned.filter(({ index }) => index === dayIndex + 2).map(({ item }) => item));
      if (cell) courses.push(normalizeCourse({ ...cell, weekday: dayColumns[dayIndex][1], ...time }));
    }
  }

  if (!courses.length) throw new Error("layout-unsupported");
  return mergeContinuousSessions(courses);
}
