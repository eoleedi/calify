export const ntnuFullItems = [
  { text: "節次", x: 120, y: 720 },
  { text: "MON", x: 250, y: 720 },
  { text: "TUE", x: 350, y: 720 },
  { text: "WED", x: 450, y: 720 },
  { text: "THU", x: 550, y: 720 },
  { text: "FRI", x: 650, y: 720 },
  { text: "SAT", x: 750, y: 720 },
  { text: "SUN", x: 850, y: 720 },
  { text: "09:10 - 11:00", x: 120, y: 680 },
  { text: "備註", x: 950, y: 670 },
  { text: "備註", x: 950, y: 650 },
  { text: "資料\n結構\n科技 101", x: 350, y: 630 },
  { text: "13:20 - 15:10", x: 120, y: 600 },
  { text: "演算法\n科技 102", x: 450, y: 560 },
  { text: "@無節次或密集課程", x: 120, y: 520 },
  { text: "校外參訪", x: 450, y: 520 },
];

export const ntnuFullWithSubstringWeekday = ntnuFullItems.map((item) =>
  item.text === "MON" ? { ...item, text: "MONKEY" } : item,
);

export const ntnuFullWithInvalidPeriodHeader = ntnuFullItems.map((item) =>
  item.text === "節次" ? { ...item, text: "欄位" } : item,
);
