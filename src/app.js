import { downloadCalendar as defaultDownloadCalendar, generateCalendar } from "./calendar.js";
import { parseTimetable as defaultParseTimetable } from "./parsers/parser.js";
import { getSemester, SCHOOLS } from "./semesters.js";
import { translate } from "./i18n.js";

const defaultExtractFirstPage = (...args) => import("./pdf/extract.js").then(({ extractFirstPage }) => extractFirstPage(...args));
const defaults = { extractFirstPage: defaultExtractFirstPage, parseTimetable: defaultParseTimetable, generateCalendar, downloadCalendar: defaultDownloadCalendar };
const homeHref = import.meta.env.BASE_URL;

function option(value, label) { return `<option value="${value}">${label}</option>`; }

export function createApp(root, dependencies = {}) {
  const deps = { ...defaults, ...dependencies };
  let locale = "zh";
  let courses = [];
  let calendar = "";
  let busy = false;
  let version = 0;
  let destroyed = false;
  const listeners = [];

  root.innerHTML = `<div class="page-shell">
    <header class="site-header"><a class="wordmark" href="${homeHref}" aria-label="Calify home">Calify<span>.</span></a><div class="header-tools"><a class="repository-link" href="https://github.com/eoleedi/calify" target="_blank" rel="noreferrer" aria-label="View Calify on GitHub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .7a11.3 11.3 0 0 0-3.58 22.02c.57.1.78-.25.78-.55v-2.02c-3.18.69-3.85-1.34-3.85-1.34-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.74 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.52-2.54-.29-5.21-1.27-5.21-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.12 1.17a10.85 10.85 0 0 1 5.68 0c2.16-1.48 3.12-1.17 3.12-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.4-2.68 5.36-5.23 5.64.41.36.78 1.08.78 2.18v2.96c0 .3.2.66.79.55A11.3 11.3 0 0 0 12 .7Z" /></svg></a><div class="locale-switch" aria-label="Language"><button type="button" data-locale="zh" class="is-active" aria-pressed="true">中文</button><button type="button" data-locale="en" aria-pressed="false">EN</button></div></div></header>
    <div class="layout">
      <section class="intro" aria-labelledby="hero-title"><p class="kicker" data-copy="hero.kicker"></p><h1 id="hero-title" data-copy="hero.title"></h1><p class="hero-body" data-copy="hero.body"></p><p class="privacy" data-copy="hero.privacy"></p></section>
      <section class="workbench" aria-labelledby="form-title"><div class="section-heading"><p class="step-mark">01</p><h2 id="form-title" data-copy="form.title"></h2></div>
        <div class="selectors"><label><span data-copy="form.school"></span><select id="school"></select></label><label><span data-copy="form.format"></span><select id="format"></select></label><label><span data-copy="form.semester"></span><select id="semester"></select></label></div>
        <div class="upload-frame"><label class="sr-only" for="file" data-copy="form.file"></label><div class="upload-zone" tabindex="0" role="button" aria-describedby="file-hint"><div class="upload-mark" aria-hidden="true">PDF</div><strong data-copy="form.fileHint"></strong><span id="file-hint" data-copy="form.fileTypes"></span><input id="file" type="file" accept="application/pdf,.pdf" /></div><p class="status" role="status" aria-live="polite"></p></div>
        <div class="error" role="alert" hidden></div><section class="preview" aria-labelledby="preview-title" hidden><div class="preview-head"><div><p class="step-mark">02</p><h2 id="preview-title" data-copy="preview.title"></h2><p class="count"></p></div><button class="download" type="button" data-copy="preview.download"></button></div><ul class="course-list"></ul><button class="reset" type="button" data-copy="preview.reset"></button></section>
      </section>
    </div>
  </div>`;

  const $ = (selector) => root.querySelector(selector);
  const school = $("#school"); const format = $("#format"); const semester = $("#semester"); const file = $("#file"); const zone = $(".upload-zone");

  function copy() { root.querySelectorAll("[data-copy]").forEach((node) => { node.textContent = translate(locale, node.dataset.copy); }); }
  function populate() {
    const config = SCHOOLS[school.value];
    format.innerHTML = config.formats.map((item) => option(item.id, item.label[locale])).join("");
    semester.innerHTML = config.semesters.map((item) => option(item.id, item.id)).join("");
  }
  function clearResult() { courses = []; calendar = ""; $(".preview").hidden = true; $(".error").hidden = true; }
  function invalidate() { version += 1; busy = false; clearResult(); }
  function resetFile() { file.value = ""; invalidate(); $(".status").textContent = translate(locale, "status.ready"); }
  function renderResult() {
    const list = $(".course-list");
    list.replaceChildren();
    courses.forEach((course) => {
      const item = document.createElement("li");
      const details = document.createElement("div");
      const name = document.createElement("strong");
      const location = document.createElement("span");
      const time = document.createElement("time");
      name.textContent = course.name;
      location.textContent = translate(locale, "preview.location", { location: course.location || "—" });
      time.textContent = `${translate(locale, `weekday.${course.weekday}`)} · ${course.startTime}–${course.endTime}`;
      details.append(name, location);
      item.append(details, time);
      list.append(item);
    });
    $(".count").textContent = translate(locale, "preview.count", { count: courses.length });
    $(".preview").hidden = false;
  }
  function showError(code) { $(".error").textContent = translate(locale, `error.${code}`) || translate(locale, "error.conversion-failed"); $(".error").hidden = false; }
  async function handleFile(selected) {
    const request = ++version;
    const current = () => !destroyed && request === version;
    clearResult();
    if (!selected) { showError("file-required"); return; }
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) { file.value = ""; showError("file-type"); return; }
    busy = true; $(".status").textContent = translate(locale, "status.processing");
    try {
      const items = await deps.extractFirstPage(selected);
      if (!current()) return;
      courses = deps.parseTimetable(items, school.value, format.value);
      if (!current()) return;
      if (!courses?.length) throw new Error("courses-empty");
      const selectedSemester = getSemester(school.value, semester.value);
      calendar = deps.generateCalendar(courses, selectedSemester);
      if (!current()) return;
      renderResult();
      $(".status").textContent = translate(locale, "preview.count", { count: courses.length });
    } catch (cause) {
      if (current()) showError(["pdf-unreadable", "pdf-no-text", "layout-unsupported", "courses-empty"].includes(cause.message) ? cause.message : "conversion-failed");
    } finally { if (current()) busy = false; }
  }
  function on(selector, event, handler) { const node = $(selector); node.addEventListener(event, handler); listeners.push(() => node.removeEventListener(event, handler)); }

  document.documentElement.lang = "zh-Hant";
  school.innerHTML = Object.entries(SCHOOLS).map(([id, config]) => option(id, config.name[locale])).join(""); populate(); copy(); $(".status").textContent = translate(locale, "status.ready");
  function setLocale(nextLocale) { locale = nextLocale; document.documentElement.lang = locale === "zh" ? "zh-Hant" : "en"; root.querySelectorAll("[data-locale]").forEach((button) => { const active = button.dataset.locale === locale; button.classList.toggle("is-active", active); button.setAttribute("aria-pressed", String(active)); }); copy(); populate(); if (courses.length) renderResult(); }
  on("[data-locale='zh']", "click", () => setLocale("zh"));
  on("[data-locale='en']", "click", () => setLocale("en"));
  on("#school", "change", () => { populate(); invalidate(); }); on("#format", "change", invalidate); on("#semester", "change", invalidate); on("#file", "change", (event) => handleFile(event.target.files?.[0]));
  on(".upload-zone", "keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); file.click(); } });
  on(".upload-zone", "click", (event) => { if (event.target !== file) file.click(); });
  on(".upload-zone", "dragover", (event) => { event.preventDefault(); zone.classList.add("is-dragging"); }); on(".upload-zone", "dragleave", () => zone.classList.remove("is-dragging")); on(".upload-zone", "drop", (event) => { event.preventDefault(); zone.classList.remove("is-dragging"); handleFile(event.dataTransfer.files?.[0]); });
  on(".download", "click", () => { if (!busy && calendar) deps.downloadCalendar(calendar, "calify-calendar.ics"); }); on(".reset", "click", resetFile);
  return { destroy() { destroyed = true; version += 1; listeners.splice(0).forEach((remove) => remove()); root.replaceChildren(); } };
}
