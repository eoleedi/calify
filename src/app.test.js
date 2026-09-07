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
    expect(document.documentElement.lang).toBe("en");
    expect(getByRole(document.body, "button", { name: "EN" }).getAttribute("aria-pressed")).toBe("true");
    expect(getByRole(document.body, "button", { name: "中文" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("shows an accessible link to the project repository", () => {
    createApp(document.querySelector("#app"));
    const link = getByRole(document.body, "link", { name: "View Calify on GitHub" });
    expect(link.getAttribute("href")).toBe("https://github.com/eoleedi/calify");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
    expect(link.querySelector("svg")).not.toBeNull();
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
    expect(getByLabelText(document.body, "選擇 PDF").value).toBe("");
  });

  it("ignores a stale parse after the selected school changes", async () => {
    let resolveExtract;
    const extract = vi.fn(() => new Promise((resolve) => { resolveExtract = resolve; }));
    const parse = vi.fn().mockReturnValue([course]);
    createApp(document.querySelector("#app"), { extractFirstPage: extract, parseTimetable: parse });
    const file = new File(["pdf"], "schedule.pdf", { type: "application/pdf" });
    fireEvent.change(getByLabelText(document.body, "選擇 PDF"), { target: { files: [file] } });
    fireEvent.change(document.querySelector("#school"), { target: { value: "tmu" } });
    resolveExtract([{ text: "stale", x: 0, y: 0, width: 1, height: 1 }]);
    await vi.waitFor(() => expect(extract).toHaveBeenCalledOnce());
    await Promise.resolve();
    expect(queryByText(document.body, "資料結構")).toBeNull();
    expect(document.querySelector(".preview").hasAttribute("hidden")).toBe(true);
  });

  it("does not touch the DOM when destroyed during parsing", async () => {
    let resolveExtract;
    const extract = vi.fn(() => new Promise((resolve) => { resolveExtract = resolve; }));
    const app = createApp(document.querySelector("#app"), { extractFirstPage: extract, parseTimetable: () => [course] });
    fireEvent.change(getByLabelText(document.body, "選擇 PDF"), { target: { files: [new File(["pdf"], "schedule.pdf", { type: "application/pdf" })] } });
    app.destroy();
    resolveExtract([{ text: "late", x: 0, y: 0, width: 1, height: 1 }]);
    await Promise.resolve();
    expect(document.querySelector("#app").childElementCount).toBe(0);
  });

  it("renders parsed HTML-like course text as literal text", async () => {
    const unsafeCourse = { ...course, name: "<img src=x onerror=alert(1)>", location: "<b>unsafe</b>" };
    createApp(document.querySelector("#app"), { extractFirstPage: vi.fn().mockResolvedValue([]), parseTimetable: () => [unsafeCourse] });
    fireEvent.change(getByLabelText(document.body, "選擇 PDF"), { target: { files: [new File(["pdf"], "schedule.pdf", { type: "application/pdf" })] } });
    await vi.waitFor(() => expect(document.querySelector(".course-list li")).not.toBeNull());
    expect(document.querySelector(".course-list strong").textContent).toBe(unsafeCourse.name);
    expect(document.querySelector(".course-list").querySelector("img")).toBeNull();
    expect(document.querySelector(".course-list span").textContent).toContain(unsafeCourse.location);
  });

  it("accepts dropped PDFs and keyboard activation opens the file picker", async () => {
    const file = new File(["pdf"], "schedule.pdf", { type: "application/pdf" });
    const appRoot = document.querySelector("#app");
    createApp(appRoot, { extractFirstPage: vi.fn().mockResolvedValue([]), parseTimetable: () => [] });
    const click = vi.spyOn(getByLabelText(document.body, "選擇 PDF"), "click");
    const zone = document.querySelector(".upload-zone");
    fireEvent.keyDown(zone, { key: "Enter" });
    expect(click).toHaveBeenCalledOnce();
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    await vi.waitFor(() => expect(document.querySelector(".error").textContent).toContain("找不到課程"));
  });
});
