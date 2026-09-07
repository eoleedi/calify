import { describe, expect, it, vi } from "vitest";
import { downloadCalendar, generateCalendar } from "./calendar.js";

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

  it("includes a stable RFC 5545 DTSTAMP", () => {
    const ics = generateCalendar([{
      name: "A",
      location: "1",
      weekday: 1,
      startTime: "08:00",
      endTime: "09:00",
    }], semester);
    expect(ics).toContain("DTSTAMP:19700101T000000Z");
    expect(generateCalendar([{
      name: "A",
      location: "1",
      weekday: 1,
      startTime: "08:00",
      endTime: "09:00",
    }], semester)).toBe(ics);
  });

  it("disambiguates duplicate courses with stable unique UIDs", () => {
    const ics = generateCalendar([
      { name: "A", location: "1", weekday: 1, startTime: "08:00", endTime: "09:00" },
      { name: "A", location: "1", weekday: 1, startTime: "08:00", endTime: "09:00" },
    ], semester);
    const uids = [...ics.matchAll(/^UID:(.+)$/gm)].map((match) => match[1].trim());
    expect(new Set(uids).size).toBe(2);
    expect(generateCalendar([
      { name: "A", location: "1", weekday: 1, startTime: "08:00", endTime: "09:00" },
      { name: "A", location: "1", weekday: 1, startTime: "08:00", endTime: "09:00" },
    ], semester)).toBe(ics);
  });

  it("escapes standalone CR and CRLF as RFC text newlines", () => {
    const ics = generateCalendar([{
      name: "line\rone\r\nline\ntwo",
      location: "room",
      weekday: 1,
      startTime: "08:00",
      endTime: "09:00",
    }], semester);
    expect(ics).toContain("SUMMARY:line\\none\\nline\\ntwo");
  });

  it("folds long UTF-8 content lines at 75 octets", () => {
    const ics = generateCalendar([{
      name: "課程".repeat(30),
      location: "教室",
      weekday: 1,
      startTime: "08:00",
      endTime: "09:00",
    }], semester);
    for (const line of ics.split("\r\n").filter(Boolean)) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(ics).toContain("\r\n ");
  });
});

describe("downloadCalendar", () => {
  it("downloads a UTF-8 calendar and cleans up the temporary anchor", async () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:calify");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const anchor = document.createElement("a");
    const click = vi.spyOn(anchor, "click").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockReturnValue(anchor);

    downloadCalendar("行事曆\r\n", "schedule.ics");

    const blob = createObjectURL.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("text/calendar;charset=utf-8");
    const contents = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(blob);
    });
    expect(contents).toBe("行事曆\r\n");
    expect(anchor.download).toBe("schedule.ics");
    expect(anchor.href).toBe("blob:calify");
    expect(click).toHaveBeenCalledOnce();
    expect(document.body.contains(anchor)).toBe(false);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:calify");
  });
});
