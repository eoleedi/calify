import { assignColumns, groupRows } from "../pdf/layout.js";
import { mergeContinuousSessions, normalizeCourse } from "../courses.js";

const SIMPLE_HEADERS = ["課程中文名稱", "上課時間", "上課教室", "星期"];
const ZH_WEEKDAYS = new Map([
  ["一", 1],
  ["二", 2],
  ["三", 3],
  ["四", 4],
  ["五", 5],
  ["六", 6],
  ["日", 7],
]);
const EN_WEEKDAYS = new Map([
  ["MON", 1],
  ["TUE", 2],
  ["WED", 3],
  ["THU", 4],
  ["FRI", 5],
  ["SAT", 6],
  ["SUN", 7],
]);
const TIME_RANGE = /([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d/;

function findSimpleHeader(rows) {
  return rows.findIndex((row) => SIMPLE_HEADERS.every((header) => row.some((item) => item.text === header)));
}

function parseTime(value) {
  const match = value.match(TIME_RANGE);
  if (!match) return null;
  const [startTime, endTime] = match[0].split(/\s*-\s*/);
  return { startTime, endTime };
}

export function parseNtnuSimple(items) {
  const rows = groupRows(items);
  const headerIndex = findSimpleHeader(rows);
  if (headerIndex === -1) throw new Error("layout-unsupported");

  const header = rows[headerIndex];
  const anchors = SIMPLE_HEADERS.map((name) => header.find((item) => item.text === name).x);
  const courses = [];

  for (const row of rows.slice(headerIndex + 1)) {
    const [name, timeValue, location, weekdayValue] = assignColumns(row, anchors, 45);
    const time = parseTime(timeValue);
    const weekday = ZH_WEEKDAYS.get(weekdayValue);
    if (!time) break;
    if (!name || !location || !weekday) continue;
    courses.push(normalizeCourse({ name, location, weekday, ...time }));
  }

  return mergeContinuousSessions(courses);
}

function findFullHeader(rows) {
  return rows.findIndex((row) => {
    const values = row.map((item) => item.text.toUpperCase());
    return [...EN_WEEKDAYS.keys()].every((day) => values.some((value) => value.includes(day)));
  });
}

function parseCourseCell(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  return { name: lines.slice(0, -1).join(""), location: lines.at(-1) };
}

export function parseNtnuFull(items) {
  const rows = groupRows(items);
  const headerIndex = findFullHeader(rows);
  if (headerIndex === -1) throw new Error("layout-unsupported");

  const header = rows[headerIndex];
  const dayAnchors = [...EN_WEEKDAYS.keys()].map((day) => {
    const item = header.find((value) => value.text.toUpperCase().includes(day));
    return [item.x, EN_WEEKDAYS.get(day)];
  });
  const anchors = [header[0].x, ...dayAnchors.map(([x]) => x)];
  const timeRows = rows.slice(headerIndex + 1).map((row, index) => {
    const columns = assignColumns(row, anchors, 45);
    return { index: index + headerIndex + 1, time: parseTime(columns[0]) };
  }).filter(({ time }) => time);
  if (!timeRows.length) throw new Error("layout-unsupported");

  const cells = new Map();
  for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (row.some((item) => item.text.startsWith("@無節次或密集課程"))) break;
    const timeRow = timeRows.reduce((nearest, candidate) => {
      if (!nearest) return candidate;
      const candidateDistance = Math.abs(candidate.index - rowIndex);
      const nearestDistance = Math.abs(nearest.index - rowIndex);
      if (candidateDistance < nearestDistance) return candidate;
      if (candidateDistance === nearestDistance && candidate.index < rowIndex && nearest.index > rowIndex) {
        return candidate;
      }
      return nearest;
    }, null);
    if (!timeRow) continue;

    for (const item of row) {
      const day = dayAnchors.find(([x]) => Math.abs(item.x - x) <= 45);
      if (!day) continue;
      const key = `${timeRow.index}:${day[1]}`;
      const cell = cells.get(key) ?? { time: timeRow.time, weekday: day[1], lines: [] };
      cell.lines.push(item.text);
      cells.set(key, cell);
    }
  }

  const courses = [];
  for (const { time, weekday, lines } of cells.values()) {
    const cell = parseCourseCell(lines.join("\n"));
    if (cell) courses.push(normalizeCourse({ ...cell, weekday, ...time }));
  }
  return mergeContinuousSessions(courses);
}
