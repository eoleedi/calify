import { parseNtnuFull, parseNtnuSimple } from "./ntnu.js";
import { parseTmuFull } from "./tmu.js";

export function parseTimetable(items, schoolId, formatId) {
  if (schoolId === "ntnu" && formatId === "simple") return parseNtnuSimple(items);
  if (schoolId === "ntnu" && formatId === "full") return parseNtnuFull(items);
  if (schoolId === "tmu" && formatId === "full") return parseTmuFull(items);
  throw new Error("layout-unsupported");
}
