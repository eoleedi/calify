import { describe, expect, it } from "vitest";
import { parseTimetable } from "./parser.js";
import { tmuFullItems } from "./fixtures/tmu-full.js";

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
});
