import { describe, expect, it } from "vitest";
import { parseTimetable } from "./parser.js";
import {
  tmuFullItems,
  tmuFullNumericItems,
  tmuFullWithDuplicateWeekday,
  tmuFullWithExtraHeader,
  tmuFullWithMissingWeekday,
} from "./fixtures/tmu-full.js";

describe("TMU parser", () => {
  it("parses a full timetable and merges adjacent periods", () => {
    expect(parseTimetable(tmuFullItems, "tmu", "full")).toEqual([{
      name: "生理學",
      location: "醫綜 3101",
      weekday: 2,
      startTime: "08:10",
      endTime: "10:00",
    }]);
  });

  it("maps weekdays by explicit labels when an unrelated header is present", () => {
    expect(parseTimetable(tmuFullWithExtraHeader, "tmu", "full")).toEqual([{
      name: "生理學",
      location: "醫綜 3101",
      weekday: 2,
      startTime: "08:10",
      endTime: "10:00",
    }]);
  });

  it("accepts numeric weekday labels", () => {
    expect(parseTimetable(tmuFullNumericItems, "tmu", "full")).toEqual([{
      name: "生理學",
      location: "醫綜 3101",
      weekday: 2,
      startTime: "08:10",
      endTime: "10:00",
    }]);
  });

  it.each([
    ["missing", tmuFullWithMissingWeekday],
    ["duplicate", tmuFullWithDuplicateWeekday],
  ])("rejects a %s weekday signature", (_description, items) => {
    expect(() => parseTimetable(items, "tmu", "full")).toThrow("layout-unsupported");
  });
});
