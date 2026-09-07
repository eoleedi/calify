import { describe, expect, it } from "vitest";
import { parseTimetable } from "./parser.js";
import { ntnuSimpleItems } from "./fixtures/ntnu-simple.js";
import { ntnuFullItems } from "./fixtures/ntnu-full.js";

describe("NTNU parsers", () => {
  it("parses and merges a simple timetable", () => {
    expect(parseTimetable(ntnuSimpleItems, "ntnu", "simple")).toEqual([{
      name: "教育心理學",
      location: "教 201",
      weekday: 1,
      startTime: "09:10",
      endTime: "11:00",
    }]);
  });

  it("parses a full timetable course and ignores the trailing note", () => {
    expect(parseTimetable(ntnuFullItems, "ntnu", "full")).toEqual([{
      name: "資料結構",
      location: "科技 101",
      weekday: 3,
      startTime: "13:20",
      endTime: "15:10",
    }]);
  });

  it("rejects a mismatched NTNU layout", () => {
    expect(() => parseTimetable(ntnuSimpleItems, "ntnu", "full")).toThrow("layout-unsupported");
  });
});
