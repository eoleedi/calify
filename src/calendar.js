function escapeText(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function formatDateTime(date, time) {
  return `${formatDate(date)}T${time.replace(":", "")}00`;
}

function courseKey(course) {
  return [course.name, course.location, course.weekday, course.startTime, course.endTime].join("\u0000");
}

function hashCourse(course, duplicateIndex) {
  const value = `${courseKey(course)}\u0000${duplicateIndex}`;
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function foldLine(line) {
  const folded = [];
  let current = "";
  let byteLength = 0;
  const encoder = new TextEncoder();

  for (const character of line) {
    const characterLength = encoder.encode(character).length;
    const limit = folded.length ? 74 : 75;
    if (current && byteLength + characterLength > limit) {
      folded.push(current);
      current = " ";
      byteLength = 1;
    }
    current += character;
    byteLength += characterLength;
  }
  folded.push(current);
  return folded;
}

function isoWeekday(date) {
  return date.getUTCDay() || 7;
}

export function generateCalendar(courses, semester) {
  if (!courses?.length) throw new Error("At least one course is required");

  const startDate = parseDate(semester.startDate);
  const endDate = parseDate(semester.endDate);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Calify//Timetable Converter//EN",
  ];
  const duplicateIndexes = new Map();

  for (const course of courses) {
    const occurrence = new Date(startDate);
    occurrence.setUTCDate(occurrence.getUTCDate() + (course.weekday - isoWeekday(startDate) + 7) % 7);
    if (occurrence > endDate) throw new Error("Course occurrence is after semester end");

    const key = courseKey(course);
    const duplicateIndex = duplicateIndexes.get(key) ?? 0;
    duplicateIndexes.set(key, duplicateIndex + 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${hashCourse(course, duplicateIndex)}@calify`,
      "DTSTAMP:19700101T000000Z",
      `DTSTART:${formatDateTime(occurrence, course.startTime)}`,
      `DTEND:${formatDateTime(occurrence, course.endTime)}`,
      `RRULE:FREQ=WEEKLY;UNTIL=${formatDate(endDate)}T235959`,
      `SUMMARY:${escapeText(course.name)}`,
      `LOCATION:${escapeText(course.location)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.flatMap(foldLine).join("\r\n")}\r\n`;
}

export function downloadCalendar(contents, filename = "calify-calendar.ics") {
  const blob = new Blob([contents], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
