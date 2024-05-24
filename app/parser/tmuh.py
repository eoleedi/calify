from typing import List
import datetime
import pandas as pd
import re
from app.course import Course
from app.utils import combine_continuous_sessions

zh_day_to_int = {
    "一": 1,
    "二": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "日": 7,
}
en_day_to_int = {
    "MON": 1,
    "TUE": 2,
    "WED": 3,
    "THU": 4,
    "FRI": 5,
    "SAT": 6,
    "SUN": 7,
}

class FullTimeTableParser:
    def dataframe_to_courses(self, data: pd.DataFrame) -> List[Course]:
        courses = []
        # print(data)
        table_df = data

        # 重新命名欄位
        table_df.columns = ["上課時間", "節次"] + list(range(1, 8))
        print(table_df)

        for _index, row in table_df.iterrows():
            for column_name, item in row[2:].items():  # 略過前兩欄 (第幾節課, 上課時間)
                # 檢查是否為空值或空字串
                if not isinstance(item, str) or item == "":
                    continue

                # 讀取課程名稱、地點
                information = [x.strip() for x in item.split("\n")]
                name = "".join(information[1:-1])
                location = information[-1]

                # 讀取星期幾
                en_weekday = column_name

                # 新增課程
                courses.append(
                    Course(
                        name=name,
                        start_time=datetime.datetime.strptime(
                            row["上課時間"].split("\n")[0].strip(),
                            "%H:%M",
                        ).time(),
                        end_time=datetime.datetime.strptime(
                            row["上課時間"].split("\n")[2].strip(),
                            "%H:%M",
                        ).time(),
                        location=location,
                        weekday=column_name,
                    )
                )

        return combine_continuous_sessions(courses)

    def table_to_dataframe(self, table: List[List[str | None]] | None) -> pd.DataFrame:
        return pd.DataFrame(table[1:], columns=table[0])

    def table_to_courses(self, table: List[List[str | None]] | None) -> List[Course]:
        return self.dataframe_to_courses(self.table_to_dataframe(table))

    def _extract_day(self, value):
        match = re.search(r"\b(MON|TUE|WED|THU|FRI|SAT|SUN)\b", value)
        return match.group(0) if match else None
    
class Semester:
    def __init__(self):
        self._semester_to_date = {
            "112-1": (datetime.date(2023, 9, 4), datetime.date(2023, 12, 24)),
            "112-2": (datetime.date(2024, 2, 19), datetime.date(2024, 6, 9)),
        }

    def get_date(self, semester: str) -> tuple[datetime.date, datetime.date]:
        return self._semester_to_date[semester]