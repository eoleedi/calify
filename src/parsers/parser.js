import { parseNtnuFull, parseNtnuSimple } from "./ntnu.js";

export function parseTimetable(items, schoolId, formatId) {
  if (schoolId === "ntnu" && formatId === "simple") return parseNtnuSimple(items);
  if (schoolId === "ntnu" && formatId === "full") return parseNtnuFull(items);
  throw new Error("layout-unsupported");
}
