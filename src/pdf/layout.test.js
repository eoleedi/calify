import { describe, expect, it } from "vitest";
import { assignColumns, groupRows } from "./layout.js";

describe("groupRows", () => {
  it("groups nearby y coordinates and sorts each row left to right", () => {
    const items = [
      { text: "Tue", x: 150, y: 700, width: 20, height: 10 },
      { text: "Period", x: 20, y: 700.8, width: 35, height: 10 },
      { text: "Mon", x: 90, y: 699.3, width: 20, height: 10 },
      { text: "1", x: 20, y: 660, width: 8, height: 10 },
    ];
    expect(groupRows(items, 2).map((row) => row.map(({ text }) => text))).toEqual([
      ["Period", "Mon", "Tue"],
      ["1"],
    ]);
  });
});

describe("assignColumns", () => {
  it("joins wrapped text assigned to the same nearest column", () => {
    const row = [
      { text: "Data", x: 91, y: 600, width: 20, height: 10 },
      { text: "Structures", x: 110, y: 600, width: 35, height: 10 },
      { text: "Room 2", x: 201, y: 600, width: 30, height: 10 },
    ];
    expect(assignColumns(row, [20, 90, 200], 30)).toEqual(["", "Data Structures", "Room 2"]);
  });
});
