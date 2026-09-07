export const SCHOOLS = {
  ntnu: {
    name: { zh: "國立臺灣師範大學", en: "National Taiwan Normal University" },
    formats: [
      { id: "simple", label: { zh: "簡式課表", en: "Simple timetable" } },
      { id: "full", label: { zh: "完整課表", en: "Full timetable" } },
    ],
    semesters: [
      { id: "115-1", startDate: "2026-09-07", endDate: "2026-12-27" },
      { id: "114-2", startDate: "2026-02-23", endDate: "2026-06-14" },
      { id: "114-1", startDate: "2025-09-01", endDate: "2025-12-21" },
    ],
  },
  tmu: {
    name: { zh: "臺北醫學大學", en: "Taipei Medical University" },
    formats: [{ id: "full", label: { zh: "完整課表", en: "Full timetable" } }],
    semesters: [
      { id: "113-2", startDate: "2025-02-17", endDate: "2025-06-20" },
      { id: "113-1", startDate: "2024-09-09", endDate: "2025-01-10" },
    ],
  },
};

export function getSchoolConfig(schoolId) {
  const school = SCHOOLS[schoolId];
  if (!school) throw new Error(`Unsupported school: ${schoolId}`);
  return school;
}

export function getSemester(schoolId, semesterId) {
  const semester = getSchoolConfig(schoolId).semesters.find(({ id }) => id === semesterId);
  if (!semester) throw new Error(`Unsupported semester: ${semesterId}`);
  return semester;
}
