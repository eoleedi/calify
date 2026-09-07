function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function normalizeCourse(value) {
  const course = {
    name: value.name?.trim(),
    location: value.location?.trim() ?? "",
    weekday: value.weekday,
    startTime: value.startTime,
    endTime: value.endTime,
  };
  if (!course.name) throw new Error("Invalid course name");
  if (!Number.isInteger(course.weekday) || course.weekday < 1 || course.weekday > 7) {
    throw new Error("Invalid course weekday");
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(course.startTime)) throw new Error("Invalid course startTime");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(course.endTime)) throw new Error("Invalid course endTime");
  if (toMinutes(course.endTime) <= toMinutes(course.startTime)) throw new Error("Invalid course endTime");
  return course;
}

export function mergeContinuousSessions(courses, maxGapMinutes = 20) {
  const sorted = courses.map(normalizeCourse).sort((a, b) => {
    return a.weekday - b.weekday || toMinutes(a.startTime) - toMinutes(b.startTime);
  });
  const merged = [];

  for (const course of sorted) {
    const previous = merged.at(-1);
    const gap = previous && toMinutes(course.startTime) - toMinutes(previous.endTime);
    if (
      previous &&
      previous.name === course.name &&
      previous.location === course.location &&
      previous.weekday === course.weekday &&
      gap >= 0 &&
      gap <= maxGapMinutes
    ) {
      previous.endTime = course.endTime;
    } else {
      merged.push({ ...course });
    }
  }

  return merged;
}
