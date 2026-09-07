import { describe, expect, it } from "vitest";
import { mergeContinuousSessions, normalizeCourse } from "./courses.js";

const algebra = {
  name: "線性代數",
  location: "誠 101",
  weekday: 1,
  startTime: "09:10",
  endTime: "10:00",
};

describe("normalizeCourse", () => {
  it("trims text and accepts a valid course", () => {
    expect(normalizeCourse({ ...algebra, name: " 線性代數 ", location: " 誠 101 " })).toEqual(algebra);
  });

  it.each([
    [{ ...algebra, weekday: 0 }, "weekday"],
    [{ ...algebra, startTime: "9:10" }, "startTime"],
    [{ ...algebra, endTime: "08:00" }, "endTime"],
    [{ ...algebra, name: "" }, "name"],
  ])("rejects malformed course data", (course, field) => {
    expect(() => normalizeCourse(course)).toThrow(field);
  });
});

describe("mergeContinuousSessions", () => {
  it("merges matching sessions separated by no more than 20 minutes", () => {
    const result = mergeContinuousSessions([
      algebra,
      { ...algebra, startTime: "10:10", endTime: "11:00" },
    ]);
    expect(result).toEqual([{ ...algebra, endTime: "11:00" }]);
  });

  it("does not merge different rooms or gaps over 20 minutes", () => {
    const courses = [
      algebra,
      { ...algebra, location: "誠 102", startTime: "10:10", endTime: "11:00" },
      { ...algebra, startTime: "10:30", endTime: "11:20" },
    ];
    expect(mergeContinuousSessions(courses)).toHaveLength(3);
  });

  it("does not mutate the caller array or course objects", () => {
    const later = { ...algebra, startTime: "10:00", endTime: "11:00" };
    const courses = [later, algebra];
    const originalCourses = structuredClone(courses);

    const result = mergeContinuousSessions(courses);

    expect(courses).toEqual(originalCourses);
    expect(result[0]).not.toBe(algebra);
    expect(result[0]).not.toBe(later);
  });

  it.each([
    ["zero gap", "10:00", "11:00", 20, true],
    ["exact 20-minute boundary", "10:20", "11:20", 20, true],
    ["overlap", "09:50", "11:00", 20, false],
    ["over-boundary", "10:21", "11:21", 20, false],
    ["custom max gap", "10:10", "11:00", 5, false],
  ])("handles %s according to the gap contract", (_label, startTime, endTime, maxGapMinutes, merges) => {
    const result = mergeContinuousSessions([algebra, { ...algebra, startTime, endTime }], maxGapMinutes);
    expect(result).toHaveLength(merges ? 1 : 2);
  });

  it("honors a custom maximum gap when the gap matches it", () => {
    expect(mergeContinuousSessions([algebra, { ...algebra, startTime: "10:10", endTime: "11:00" }], 10)).toEqual([
      { ...algebra, endTime: "11:00" },
    ]);
  });
});
