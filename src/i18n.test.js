import { describe, expect, it } from "vitest";
import { translate } from "./i18n.js";

describe("translate", () => {
  it("returns both supported locales", () => {
    expect(translate("zh", "hero.title")).toBe("把課表，放進你的行事曆");
    expect(translate("en", "hero.title")).toBe("Turn your timetable into time");
  });

  it("interpolates values and rejects missing keys", () => {
    expect(translate("en", "preview.count", { count: 2 })).toBe("2 courses found");
    expect(() => translate("en", "missing.key")).toThrow("Missing translation");
  });
});
