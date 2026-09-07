export const tmuFullItems = [
  { text: "上課時間", x: 110, y: 720 },
  { text: "節次", x: 180, y: 720 },
  { text: "一", x: 280, y: 720 },
  { text: "二", x: 390, y: 720 },
  { text: "三", x: 500, y: 720 },
  { text: "四", x: 610, y: 720 },
  { text: "五", x: 720, y: 720 },
  { text: "六", x: 830, y: 720 },
  { text: "日", x: 940, y: 720 },
  { text: "08:10\n第一節\n09:00", x: 110, y: 670 },
  { text: "PHY101\n生理學\n醫綜 3101", x: 390, y: 670 },
  { text: "09:10\n第二節\n10:00", x: 110, y: 620 },
  { text: "PHY101\n生理學\n醫綜 3101", x: 390, y: 620 },
];

export const tmuFullWithExtraHeader = [
  ...tmuFullItems.slice(0, 2),
  { text: "備註", x: 335, y: 720 },
  ...tmuFullItems.slice(2),
];

export const tmuFullWithMissingWeekday = tmuFullItems.filter((item) => item.text !== "日");

export const tmuFullWithDuplicateWeekday = tmuFullItems.map((item) =>
  item.text === "日" ? { ...item, text: "一" } : item,
);

export const tmuFullNumericItems = tmuFullItems.map((item) => {
  const weekday = ["一", "二", "三", "四", "五", "六", "日"].indexOf(item.text);
  return weekday === -1 ? item : { ...item, text: String(weekday + 1) };
});
