import { fireEvent, getByLabelText, getByRole, queryByText } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";

const course = { name: "資料結構", location: "科技 101", weekday: 3, startTime: "09:10", endTime: "11:00" };

describe("conversion interface", () => {
  beforeEach(() => { document.body.innerHTML = '<main id="app"></main>'; });

  it("switches locale and updates visible copy", () => {
    createApp(document.querySelector("#app"));
    fireEvent.click(getByRole(document.body, "button", { name: "EN" }));
    expect(queryByText(document.body, "Turn your timetable into time")).not.toBeNull();
  });

  it("parses a PDF, previews courses, and enables download", async () => {
    const extract = vi.fn().mockResolvedValue([{ text: "fixture", x: 0, y: 0, width: 1, height: 1 }]);
    const parse = vi.fn().mockReturnValue([course]);
    const download = vi.fn();
    createApp(document.querySelector("#app"), { extractFirstPage: extract, parseTimetable: parse, downloadCalendar: download });
    const file = new File(["pdf"], "schedule.pdf", { type: "application/pdf" });
    fireEvent.change(getByLabelText(document.body, "選擇 PDF"), { target: { files: [file] } });
    await vi.waitFor(() => expect(queryByText(document.body, "資料結構")).not.toBeNull());
    fireEvent.click(getByRole(document.body, "button", { name: "下載行事曆" }));
    expect(download).toHaveBeenCalledOnce();
  });

  it("shows a localized error for non-PDF input", () => {
    createApp(document.querySelector("#app"));
    const file = new File(["text"], "notes.txt", { type: "text/plain" });
    fireEvent.change(getByLabelText(document.body, "選擇 PDF"), { target: { files: [file] } });
    expect(queryByText(document.body, "請選擇 PDF 檔案")).not.toBeNull();
  });
});
