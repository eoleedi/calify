import { describe, expect, it } from "vitest";
import { generateCalendar } from "./calendar.js";

const semester = { id: "115-1", startDate: "2026-09-07", endDate: "2026-12-27" };

describe("generateCalendar", () => {
  it("uses the first matching weekday and approved recurrence boundary", () => {
    const ics = generateCalendar([{
      name: "資料結構",
      location: "科技 101",
      weekday: 3,
      startTime: "09:10",
      endTime: "11:00",
    }], semester);
    expect(ics).toContain("DTSTART:20260909T091000");
    expect(ics).toContain("DTEND:20260909T110000");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;UNTIL=20261227T235959");
  });

  it("escapes RFC 5545 text and uses CRLF only", () => {
    const ics = generateCalendar([{
      name: "設計,研究;專題\\A",
      location: "教室\n二樓",
      weekday: 1,
      startTime: "08:10",
      endTime: "09:00",
    }], semester);
    expect(ics).toContain("SUMMARY:設計\\,研究\\;專題\\\\A");
    expect(ics).toContain("LOCATION:教室\\n二樓");
    expect(ics.replaceAll("\r\n", "")).not.toContain("\n");
  });

  it("generates stable unique UIDs for different courses", () => {
    const ics = generateCalendar([
      { name: "A", location: "1", weekday: 1, startTime: "08:00", endTime: "09:00" },
      { name: "B", location: "1", weekday: 1, startTime: "09:00", endTime: "10:00" },
    ], semester);
    const uids = [...ics.matchAll(/^UID:(.+)$/gm)].map((match) => match[1].trim());
    expect(new Set(uids).size).toBe(2);
  });
});
