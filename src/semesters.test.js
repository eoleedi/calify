import { describe, expect, it } from "vitest";
import { getSchoolConfig, getSemester } from "./semesters.js";

describe("semester metadata", () => {
  it("contains the approved NTNU 115-1 range", () => {
    expect(getSemester("ntnu", "115-1")).toEqual({
      id: "115-1",
      startDate: "2026-09-07",
      endDate: "2026-12-27",
    });
  });

  it("exposes only formats supported by each parser", () => {
    expect(getSchoolConfig("ntnu").formats.map(({ id }) => id)).toEqual([
      "simple",
      "full",
    ]);
    expect(getSchoolConfig("tmu").formats.map(({ id }) => id)).toEqual(["full"]);
  });

  it("rejects unknown schools and semesters", () => {
    expect(() => getSchoolConfig("unknown")).toThrow("Unsupported school");
    expect(() => getSemester("ntnu", "999-1")).toThrow("Unsupported semester");
  });
});
