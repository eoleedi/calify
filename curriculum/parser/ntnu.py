"""This module is used to parse the time table of NTNU."""

from typing import List
import pandas as pd
from curriculum.course import Course


class SimpleTimeTableParser:
    def dataframe_to_courses(self, data: pd.DataFrame) -> List[Course]:
        courses = []
        for i in range(len(data)):
            course = Course(
                name = data.iloc[i]["課程中文名稱"],
                time = data.iloc[i]["上課時間"],
                location = data.iloc[i]["上課教室"],
                day = data.iloc[i]["星期"],
            )
            courses.append(course)
        return courses

    def table_to_dataframe(self, table: List[List[str | None]] | None) -> pd.DataFrame:
        return pd.DataFrame(table[1:], columns=table[0])

    def table_to_courses(self, table: List[List[str | None]] | None) -> List[Course]:
        return self.dataframe_to_courses(self.table_to_dataframe(table))