import { describe, expect, it } from "vitest";
import { generateCalendar } from "./calendar.js";
import { getSemester } from "./semesters.js";
import { ntnuFullItems } from "./parsers/fixtures/ntnu-full.js";
import { parseTimetable } from "./parsers/parser.js";

describe("static conversion pipeline", () => {
  it("converts an NTNU fixture into a recurring calendar", () => {
    const courses = parseTimetable(ntnuFullItems, "ntnu", "full");
    const calendar = generateCalendar(courses, getSemester("ntnu", "115-1"));

    expect(calendar).toContain("SUMMARY:資料結構");
    expect(calendar).toContain("DTSTART:20260909T132000");
    expect(calendar).toContain("RRULE:FREQ=WEEKLY;UNTIL=20261227T235959");
    expect(calendar).toContain("LOCATION:科技 101");
  });
});
