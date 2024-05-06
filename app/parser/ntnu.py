"""This module is used to parse the time table of NTNU."""

from typing import List
import datetime
import pandas as pd
from app.course import Course

zh_day_to_int = {
    "一": 1,
    "二": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "日": 7,
}


class SimpleTimeTableParser:
    def dataframe_to_courses(self, data: pd.DataFrame) -> List[Course]:
        courses = []
        for i in range(len(data)):
            print(data.iloc[i]["上課時間"].split("-"))
            course = Course(
                name=data.iloc[i]["課程中文名稱"].replace("\n", ""),
                start_time=datetime.datetime.strptime(
                    data.iloc[i]["上課時間"].split("-")[0].strip(),
                    "%H:%M",
                ).time(),
                end_time=datetime.datetime.strptime(
                    data.iloc[i]["上課時間"].split("-")[1].strip(),
                    "%H:%M",
                ).time(),
                location=data.iloc[i]["上課教室"].replace("\n", ""),
                weekday=zh_day_to_int.get(data.iloc[i]["星期"], 0),
            )
            courses.append(course)
        return courses

    def table_to_dataframe(self, table: List[List[str | None]] | None) -> pd.DataFrame:
        return pd.DataFrame(table[1:], columns=table[0])

    def table_to_courses(self, table: List[List[str | None]] | None) -> List[Course]:
        return self.dataframe_to_courses(self.table_to_dataframe(table))


class Semester:
    def __init__(self):
        self._semester_to_date = {
            "1121": (datetime.date(2023, 9, 4), datetime.date(2023, 12, 24)),
            "1122": (datetime.date(2024, 2, 19), datetime.date(2024, 6, 9)),
        }

    def get_date(self, semester: str) -> tuple[datetime.date, datetime.date]:
        return self._semester_to_date[semester]
