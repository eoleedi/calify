function escapeText(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
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

function hashCourse(course) {
  const value = [course.name, course.location, course.weekday, course.startTime, course.endTime].join("\u0000");
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
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

  for (const course of courses) {
    const occurrence = new Date(startDate);
    occurrence.setUTCDate(occurrence.getUTCDate() + (course.weekday - isoWeekday(startDate) + 7) % 7);
    if (occurrence > endDate) throw new Error("Course occurrence is after semester end");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${hashCourse(course)}@calify`,
      `DTSTART:${formatDateTime(occurrence, course.startTime)}`,
      `DTEND:${formatDateTime(occurrence, course.endTime)}`,
      `RRULE:FREQ=WEEKLY;UNTIL=${formatDate(endDate)}T235959`,
      `SUMMARY:${escapeText(course.name)}`,
      `LOCATION:${escapeText(course.location)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
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
